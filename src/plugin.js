import { Plugin, getAllEditor, openTab, showMessage } from "siyuan";
import {
    getDocInfo,
    getDocPath,
    getHPath,
    listDocTree,
    listDocTreeRange,
    queryDocRows,
    queryIncomingReferenceRows,
    queryReferenceRows,
    queryTagRows,
    queryTreeRows,
} from "./api.js";
import { DEFAULT_CONFIG, WS_COMMANDS } from "./constants.js";
import { normalizeConfig } from "./config.js";
import {
    documentIdOf,
    isCurrentDocument,
    isUsableProtyle,
    text,
} from "./dom.js";
import { loadLegacyBlocks } from "./legacy.js";
import { appendNavigationOrigin } from "./navigation.js";
import { DirectoryPanel } from "./panel.js";
import { DirectoryOverlay } from "./overlay.js";
import {
    addReference,
    applyIncomingReferences,
    applyDocumentTags,
    applyPinnedNodes,
    applyTreeOrder,
    buildTree,
    collectParentKeys,
    collectReferencedIdsFromProtyle,
    hasDirectoryContent,
    normalizePath,
} from "./tree.js";

export class AutoDirectoryPlugin extends Plugin {
    constructor(options) {
        super(options);
        this.config = {...DEFAULT_CONFIG};
        this.pins = new Set();
        this.panels = new Map();
        this.timers = new Map();
        this.busy = new Set();
        this.pending = new Set();
        this.protyles = new Set();
        this.navigationStacks = new Map();
        this.overlay = null;
        this.onProtyleEvent = this.onProtyleEvent.bind(this);
        this.onWsMain = this.onWsMain.bind(this);
        this.onGlobalKeydown = this.onGlobalKeydown.bind(this);
    }

    async onload() {
        try {
            const stored = await this.loadData("config");
            this.config = normalizeConfig(stored);
        } catch (error) {
            console.warn("[siyuan-auto-directory] 读取配置失败，使用默认值", error);
            this.config = {...DEFAULT_CONFIG};
        }

        try {
            const storedPins = await this.loadData("pins");
            this.pins = new Set(Array.isArray(storedPins)
                ? storedPins.map((id) => text(id)).filter(Boolean)
                : []);
        } catch (error) {
            console.warn("[siyuan-auto-directory] 读取置顶状态失败，使用空列表", error);
            this.pins = new Set();
        }

        this.eventBus.on("loaded-protyle-static", this.onProtyleEvent);
        this.eventBus.on("switch-protyle", this.onProtyleEvent);
        this.eventBus.on("ws-main", this.onWsMain);

        this.addTopBar({
            icon: "iconList",
            title: "自动目录设置",
            position: "right",
            callback: () => this.openSetting(),
        });

        this.overlay = new DirectoryOverlay(this);
        const quickDirectoryLabel = text(this.i18n && this.i18n.quickDirectory) || "快速目录";
        try {
            this.addCommand({
                langKey: "quickDirectory",
                langText: quickDirectoryLabel,
                hotkey: "⌃⌥D",
                callback: () => this.toggleQuickDirectory(),
            });
        } catch (error) {
            console.warn("[siyuan-auto-directory] 注册快速目录命令失败，仅使用键盘监听", error);
        }
        document.addEventListener("keydown", this.onGlobalKeydown, true);
        this.addTopBar({
            icon: "iconSearch",
            title: `${quickDirectoryLabel}（Ctrl+Alt+D）`,
            position: "right",
            callback: () => this.toggleQuickDirectory(),
        });

        try {
            getAllEditor().forEach((editor) => this.schedule(editor.protyle, 160));
        } catch (error) {
            console.warn("[siyuan-auto-directory] 初始化编辑器失败", error);
        }
    }

    onunload() {
        document.removeEventListener("keydown", this.onGlobalKeydown, true);
        if (this.overlay) {
            this.overlay.close();
            this.overlay = null;
        }
        this.eventBus.off("loaded-protyle-static", this.onProtyleEvent);
        this.eventBus.off("switch-protyle", this.onProtyleEvent);
        this.eventBus.off("ws-main", this.onWsMain);

        this.timers.forEach((timer) => clearTimeout(timer));
        this.timers.clear();
        this.panels.forEach((panel) => panel.destroy());
        this.panels.clear();
        this.busy.clear();
        this.pending.clear();
        this.protyles.clear();
        this.navigationStacks.clear();
    }

    onProtyleEvent(event) {
        const protyle = event && event.detail && event.detail.protyle;
        if (!protyle || !isUsableProtyle(protyle)) {
            return;
        }
        this.protyles.add(protyle);
        const panel = this.panels.get(protyle);
        const currentId = documentIdOf(protyle);
        if (panel && currentId && panel.context.id !== currentId) {
            panel.showLoading(currentId);
        }
        this.schedule(protyle, 80);
    }

    onWsMain(event) {
        const detail = event && event.detail;
        if (!detail || !WS_COMMANDS.has(detail.cmd)) {
            return;
        }
        const delay = detail.cmd === "transactions" ? 650 : 140;
        this.protyles.forEach((protyle) => {
            const element = protyle && protyle.element;
            if (!element || !element.isConnected) {
                this.disposeProtyle(protyle);
                return;
            }
            if (typeof element.getClientRects === "function" && element.getClientRects().length === 0) {
                return;
            }
            this.schedule(protyle, delay);
        });
    }

    disposeProtyle(protyle) {
        const timer = this.timers.get(protyle);
        if (timer) {
            clearTimeout(timer);
            this.timers.delete(protyle);
        }
        this.removePanel(protyle);
        this.protyles.delete(protyle);
    }

    schedule(protyle, delay = 120) {
        if (!protyle) {
            return;
        }
        this.protyles.add(protyle);
        const timer = this.timers.get(protyle);
        if (timer) {
            clearTimeout(timer);
        }
        this.timers.set(protyle, setTimeout(() => {
            this.timers.delete(protyle);
            this.refresh(protyle).catch((error) => {
                console.warn("[siyuan-auto-directory] 刷新目录失败", error);
            });
        }, delay));
    }

    async resolveContext(protyle) {
        const block = (protyle && protyle.block) || {};
        let id = documentIdOf(protyle);
        let notebook = text((protyle && protyle.notebookId) || block.boxID || block.box);
        let path = text(protyle && protyle.path);
        if (!id) {
            return null;
        }
        if (!notebook || !path) {
            try {
                const info = await getDocPath(id);
                notebook = notebook || text(info && info.notebook);
                path = path || text(info && info.path);
            } catch (error) {
                console.warn("[siyuan-auto-directory] 解析文档位置失败", error);
            }
        }
        if (!notebook) {
            return null;
        }
        return {id, notebook, path, protyle};
    }

    async refresh(protyle, options = {}) {
        if (!isUsableProtyle(protyle)) {
            return;
        }
        if (this.busy.has(protyle)) {
            this.pending.add(protyle);
            return;
        }
        const existing = this.panels.get(protyle);
        if (options.force && existing) {
            existing.signature = "";
        }
        const liveId = documentIdOf(protyle);
        if (existing && liveId && existing.context.id !== liveId) {
            existing.showLoading(liveId);
        }
        this.busy.add(protyle);
        try {
            const context = await this.resolveContext(protyle);
            if (!context) {
                this.removePanel(protyle);
                return;
            }
            if (!isCurrentDocument(protyle, context.id)) {
                if (existing) {
                    existing.showLoading(documentIdOf(protyle));
                }
                this.schedule(protyle, 30);
                return;
            }
            if (existing && existing.context.id !== context.id) {
                existing.showLoading(context);
            }
            const loaded = await this.loadTree(context, protyle);
            if (!isUsableProtyle(protyle)) {
                return;
            }
            if (!isCurrentDocument(protyle, context.id)) {
                if (existing) {
                    existing.showLoading(documentIdOf(protyle));
                }
                this.schedule(protyle, 30);
                return;
            }
            if (!hasDirectoryContent(loaded.tree)) {
                this.removePanel(protyle);
                return;
            }
            this.renderPanel(protyle, context, loaded);
        } finally {
            this.busy.delete(protyle);
            if (this.pending.delete(protyle)) {
                this.schedule(protyle, 50);
            }
        }
    }

    async loadTree(context, protyle) {
        let hpath = "";
        try {
            hpath = normalizePath(await getHPath(context.id));
        } catch (error) {
            console.warn("[siyuan-auto-directory] 读取文档路径失败，可能已删除或移动", error);
        }
        const notebookRoot = context.id === context.notebook;
        let rows = [];
        try {
            rows = await queryTreeRows(context.notebook, hpath, context.path, context.id, notebookRoot);
        } catch (error) {
            console.warn("[siyuan-auto-directory] SQL 文档树查询失败，使用 filetree 兜底", error);
        }
        if (!Array.isArray(rows) || !rows.some((row) => row && row.id === context.id)) {
            rows = await this.fallbackRows(context, hpath);
        }
        const tree = buildTree(rows, context.id, hpath, context.path, notebookRoot);
        await this.applyFileTreeOrder(context, tree);
        applyPinnedNodes(tree, this.pins);
        const showRefs = this.config.showReferencedDocs !== false;
        const showTags = this.config.showDocumentTags !== false;
        const refsTask = showRefs
            ? Promise.all([
                this.mergeReferencedDocs(tree, protyle),
                this.mergeIncomingReferences(tree),
            ])
            : Promise.resolve();
        const tagsTask = showTags ? this.mergeDocumentTags(tree) : Promise.resolve();
        const legacyTask = loadLegacyBlocks(context.id);
        const [, , legacyIds] = await Promise.all([refsTask, tagsTask, legacyTask]);
        return {tree, legacyIds};
    }

    async applyFileTreeOrder(context, tree) {
        const orderMap = new Map();
        const parentKeys = Array.from(collectParentKeys(tree, context.notebook));
        await Promise.all(parentKeys.map(async (parentID) => {
            try {
                let offset = 0;
                let total = Infinity;
                while (offset < total) {
                    const data = await listDocTreeRange(context.notebook, parentID, offset, 500);
                    const files = data && Array.isArray(data.files) ? data.files : [];
                    files.forEach((file, index) => {
                        if (file && file.id) {
                            orderMap.set(file.id, offset + index);
                        }
                    });
                    offset += files.length;
                    total = data && Number.isFinite(Number(data.total))
                        ? Number(data.total)
                        : offset;
                    if (!files.length) {
                        break;
                    }
                }
            } catch (error) {
                console.warn("[siyuan-auto-directory] 读取目录顺序失败", parentID, error);
            }
        }));
        if (orderMap.size) {
            applyTreeOrder(tree, orderMap);
        }
    }

    async mergeDocumentTags(tree) {
        let rows = [];
        try {
            rows = await queryTagRows(Array.from(tree.index.keys()));
        } catch (error) {
            console.warn("[siyuan-auto-directory] 查询文档标签失败", error);
        }
        applyDocumentTags(tree, rows);
    }

    async mergeReferencedDocs(tree, protyle) {
        const sourceIds = Array.from(tree.index.keys());
        let rows = [];
        try {
            rows = await queryReferenceRows(sourceIds);
        } catch (error) {
            console.warn("[siyuan-auto-directory] 查询引用来源失败", error);
        }
        rows.forEach((row) => {
            addReference(tree, row.source_id, {
                id: row.target_id,
                title: row.target_title,
                hpath: row.target_hpath,
                path: row.target_path,
                count: row.reference_count,
            });
        });
        const root = tree.index.get(tree.id);
        if (root && !root.references.length) {
            await this.mergeDomReferences(tree, protyle);
        }
    }

    async mergeDomReferences(tree, protyle) {
        const root = tree.index.get(tree.id);
        if (!root) {
            return;
        }
        const referenced = collectReferencedIdsFromProtyle(protyle)
            .filter((id) => id && id !== tree.id);
        if (!referenced.length) {
            return;
        }
        let rows = [];
        try {
            rows = await queryDocRows(referenced);
        } catch (error) {
            console.warn("[siyuan-auto-directory] 查询 DOM 引用文档失败", error);
        }
        const byId = new Map(rows.map((row) => [row.id, row]));
        await Promise.all(referenced.map(async (id) => {
            const row = byId.get(id);
            if (row) {
                addReference(tree, tree.id, {
                    id: row.id,
                    title: row.content,
                    hpath: row.hpath,
                    path: row.path,
                });
                return;
            }
            try {
                const [info, path] = await Promise.all([
                    getDocInfo(id).catch(() => ({})),
                    getDocPath(id).catch(() => ({})),
                ]);
                const title = (info && (info.name || info.title)) || "";
                const targetPath = path && path.path;
                const targetHPath = path && path.hpath;
                if (!title && !targetPath && !targetHPath) {
                    return;
                }
                addReference(tree, tree.id, {
                    id,
                    title: title || "引用文档",
                    hpath: targetHPath,
                    path: targetPath,
                });
            } catch (error) {
                console.warn("[siyuan-auto-directory] 解析引用文档失败", id, error);
            }
        }));
    }

    async mergeIncomingReferences(tree) {
        let rows = [];
        try {
            rows = await queryIncomingReferenceRows(Array.from(tree.index.keys()));
        } catch (error) {
            console.warn("[siyuan-auto-directory] 查询被引用来源失败", error);
        }
        applyIncomingReferences(tree, rows, tree.id);
    }
    async fallbackRows(context, hpath) {
        const data = await listDocTree(context.notebook, context.path, true).catch(() => []);
        const ids = [];
        const walk = (nodes) => {
            (nodes || []).forEach((node) => {
                if (node && node.id) {
                    ids.push(node.id);
                    walk(node.children);
                }
            });
        };
        walk(data);
        const unique = Array.from(new Set(ids));
        const lookupIds = Array.from(new Set([...unique, context.id]));
        let metaRows = [];
        try {
            metaRows = await queryDocRows(lookupIds);
        } catch {}
        const metaById = new Map(metaRows.map((row) => [row.id, row]));
        const rows = await Promise.all(unique.map(async (id) => {
            const [info, path] = await Promise.all([
                getDocInfo(id).catch(() => ({})),
                getHPath(id).catch(() => ""),
            ]);
            const meta = metaById.get(id) || {};
            return {
                id,
                content: (info && (info.name || info.title)) || "",
                hpath: normalizePath(path || ""),
                path: text(info && info.path),
                created: text(meta.created || (info && info.created)),
                updated: text(meta.updated || (info && info.updated)),
            };
        }));
        try {
            const info = await getDocInfo(context.id);
            const meta = metaById.get(context.id) || {};
            rows.push({
                id: context.id,
                content: text(info && info.name) || "当前文档",
                hpath,
                path: context.path,
                created: text(meta.created || (info && info.created)),
                updated: text(meta.updated || (info && info.updated)),
            });
        } catch (error) {
            const meta = metaById.get(context.id) || {};
            rows.push({
                id: context.id,
                content: "当前文档",
                hpath,
                path: context.path,
                created: text(meta.created),
                updated: text(meta.updated),
            });
        }
        return rows;
    }

    renderPanel(protyle, context, loaded) {
        const panel = this.panels.get(protyle);
        if (panel) {
            panel.update(context, loaded.tree, this.config, loaded.legacyIds);
            return;
        }
        const next = new DirectoryPanel(
            this,
            protyle,
            context,
            loaded.tree,
            this.config,
            loaded.legacyIds
        );
        next.signature = next.currentSignature();
        this.panels.set(protyle, next);
    }

    reloadPanels() {
        this.panels.forEach((panel) => panel.ensurePlacement());
        this.protyles.forEach((protyle) => this.schedule(protyle, 0));
    }

    rememberNavigation(context, title, targetId) {
        const target = text(targetId);
        if (!target) {
            return;
        }
        const stack = appendNavigationOrigin(
            this.navigationStacks.get(text(context && context.id)),
            {id: context && context.id, title},
            target
        );
        if (stack.length) {
            this.navigationStacks.set(target, stack);
        } else {
            this.navigationStacks.delete(target);
        }
    }

    navigationFor(documentId) {
        const stack = this.navigationStacks.get(text(documentId)) || [];
        return {trail: stack.slice(-4)};
    }

    removePanel(protyle) {
        const panel = this.panels.get(protyle);
        if (!panel) {
            return;
        }
        panel.destroy();
        this.panels.delete(protyle);
    }

    onGlobalKeydown(event) {
        if (!event || event.repeat || event.isComposing) {
            return;
        }
        const key = text(event.key).toLowerCase();
        if (key === "d" && event.ctrlKey && event.altKey && !event.shiftKey && !event.metaKey) {
            event.preventDefault();
            event.stopPropagation();
            this.toggleQuickDirectory();
        }
    }

    toggleQuickDirectory() {
        const now = Date.now();
        if (now - (this.lastQuickToggle || 0) < 200) {
            return;
        }
        this.lastQuickToggle = now;
        if (this.overlay && this.overlay.isOpen) {
            this.overlay.close();
            return;
        }
        this.openQuickDirectory();
    }

    activeProtyle() {
        let protyles = [];
        try {
            protyles = getAllEditor()
                .map((editor) => editor && editor.protyle)
                .filter((protyle) => protyle && protyle.element && protyle.element.isConnected);
        } catch (error) {
            console.warn("[siyuan-auto-directory] 获取编辑器失败", error);
        }
        if (!protyles.length) {
            return null;
        }
        const focused = protyles.find((protyle) => protyle.element.contains(document.activeElement));
        if (focused) {
            return focused;
        }
        const visible = protyles.filter((protyle) => (
            typeof protyle.element.getClientRects !== "function" || protyle.element.getClientRects().length > 0
        ));
        return visible[0] || protyles[0];
    }

    async openQuickDirectory() {
        const protyle = this.activeProtyle();
        if (!protyle) {
            showMessage("没有找到可用的编辑器");
            return;
        }
        const panel = this.panels.get(protyle);
        if (panel && panel.tree) {
            this.overlay.open(panel.context, panel.tree);
            return;
        }
        const context = await this.resolveContext(protyle);
        if (!context) {
            showMessage("无法确定当前文档");
            return;
        }
        this.overlay.open(context, null);
        try {
            const loaded = await this.loadTree(context, protyle);
            if (this.overlay && this.overlay.isOpen && this.overlay.context && this.overlay.context.id === context.id) {
                this.overlay.setTree(loaded.tree);
            }
        } catch (error) {
            console.warn("[siyuan-auto-directory] 加载快速目录失败", error);
        }
    }
    openDocument(id, options = {}) {
        const targetId = text(id);
        if (!targetId) {
            return;
        }
        if (!options.back && options.fromPanel && options.context) {
            this.rememberNavigation(options.context, options.title, targetId);
        }
        try {
            openTab({app: this.app, doc: {id: targetId, action: ["cb-get-all"]}});
        } catch (error) {
            console.error("[siyuan-auto-directory] 打开文档失败", error);
            showMessage("打开文档失败：" + error.message);
        }
    }

    openSetting() {
        import("./settings.js").then(({openSettingsDialog}) => {
            openSettingsDialog(this.config, async (next) => {
                await this.updateConfig(next);
                this.panels.forEach((panel) => {
                    panel.signature = "";
                });
                showMessage("自动目录设置已保存");
                this.protyles.forEach((protyle) => this.schedule(protyle, 60));
            }, async () => {
                this.reloadPanels();
            });
        }).catch((error) => {
            console.error("[siyuan-auto-directory] 打开设置失败", error);
            showMessage("打开设置失败：" + error.message);
        });
    }

    async updateConfig(next) {
        const normalized = normalizeConfig(next);
        await this.saveData("config", normalized);
        this.config = normalized;
        this.panels.forEach((panel) => {
            panel.config = normalized;
        });
        return normalized;
    }

    applyPinState() {
        this.panels.forEach((panel) => {
            if (panel.element && panel.element.classList.contains("is-loading")) {
                return;
            }
            applyPinnedNodes(panel.tree, this.pins);
            panel.signature = "";
            panel.render();
        });
    }

    async togglePin(id) {
        const key = text(id);
        if (!key) {
            return false;
        }
        const next = new Set(this.pins);
        if (next.has(key)) {
            next.delete(key);
        } else {
            next.add(key);
        }
        try {
            await this.saveData("pins", Array.from(next));
        } catch (error) {
            console.error("[siyuan-auto-directory] 保存置顶状态失败", error);
            showMessage("保存置顶状态失败：" + error.message);
            return this.pins.has(key);
        }
        this.pins = next;
        this.applyPinState();
        return this.pins.has(key);
    }
}
