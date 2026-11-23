import { confirm, showMessage } from "siyuan";
import { getDocPath, moveDocsByID, removeDocuments, reorderDocs } from "./api.js";
import { AUTO_EXPAND_LIMIT, PANEL_ATTR, PAGE_SIZE } from "./constants.js";
import { contentElement, contextsDiffer, cssEscape, editorElement, text } from "./dom.js";
import { removeLegacyBlocks } from "./legacy.js";
import { showMoveConfirm } from "./move-dialog.js";
import { markSelectionOnElement, renderPanelHtml } from "./renderer.js";
import { allSelectableIds, pruneSelection, selectedNodes, setSelected } from "./selection.js";
import { applySortMode, canMoveNode, findNode, normalizeSort, signature } from "./tree.js";

function panelElement(protyle) {
    const content = contentElement(protyle);
    const editor = editorElement(protyle);
    if (!content) {
        return {content, editor, element: null};
    }
    let element = content.querySelector(`:scope > [${PANEL_ATTR}="true"]`);
    if (!element) {
        element = document.createElement("div");
        element.className = "siyuan-auto-directory";
        element.setAttribute(PANEL_ATTR, "true");
        content.insertBefore(element, editor || content.firstChild);
    }
    return {content, editor, element};
}

export class DirectoryPanel {
    constructor(plugin, protyle, context, tree, config, legacyIds = []) {
        this.plugin = plugin;
        this.protyle = protyle;
        this.context = context;
        this.tree = tree;
        this.navigation = this.plugin.navigationFor(context.id);
        this.config = config;
        this.legacyIds = new Set(legacyIds);
        this.expanded = new Set();
        this.referenceExpanded = new Set();
        this.page = new Map();
        this.selection = new Set();
        this.hiddenLegacyElements = new Set();
        this.seeded = false;
        this.signature = "";
        this.sortMode = "tree";
        this.sortDirection = "asc";
        this.destroyed = false;
        this.observer = null;
        this.observerContent = null;
        this.restoreTimer = null;
        this.dragSourceId = "";
        this.dropTargetId = "";
        this.dropPosition = "";
        this.onClick = this.onClick.bind(this);
        this.onChange = this.onChange.bind(this);
        this.onDragStart = this.onDragStart.bind(this);
        this.onDragOver = this.onDragOver.bind(this);
        this.onDragLeave = this.onDragLeave.bind(this);
        this.onDrop = this.onDrop.bind(this);
        this.onDragEnd = this.onDragEnd.bind(this);
        this.onMutations = this.onMutations.bind(this);
        const placement = panelElement(protyle);
        this.element = placement.element;
        if (!this.element) {
            throw new Error("找不到思源编辑器容器");
        }
        this.element.setAttribute("data-sad-root", context.id);
        this.element.addEventListener("click", this.onClick);
        this.element.addEventListener("change", this.onChange);
        this.element.addEventListener("dragstart", this.onDragStart);
        this.element.addEventListener("dragover", this.onDragOver);
        this.element.addEventListener("dragleave", this.onDragLeave);
        this.element.addEventListener("drop", this.onDrop);
        this.element.addEventListener("dragend", this.onDragEnd);
        this.seedExpanded();
        this.render();
        this.observePlacement();
    }

    seedExpanded() {
        if (this.seeded || this.config.autoExpand === false) {
            return;
        }
        const limit = this.config.defaultExpandedDepth;
        const walk = (node, depth) => {
            (node.children || []).forEach((child) => {
                if (depth < limit && child.children && child.children.length && this.expanded.size < AUTO_EXPAND_LIMIT) {
                    this.expanded.add(child.id);
                }
                walk(child, depth + 1);
            });
        };
        walk(this.tree, 0);
        this.seeded = true;
    }

    currentSignature() {
        const trail = this.navigation && Array.isArray(this.navigation.trail)
            ? this.navigation.trail.map((entry) => text(entry && entry.id)).join(",")
            : "";
        return signature(this.tree, this.context, this.config) +
            "|sort:" + this.sortMode + ":" + this.sortDirection +
            "|nav:" + trail +
            "|legacy:" + Array.from(this.legacyIds).sort().join(",");
    }

    update(context, tree, config, legacyIds = []) {
        if (contextsDiffer(this.context, context)) {
            this.expanded.clear();
            this.referenceExpanded.clear();
            this.page.clear();
            this.selection.clear();
            this.seeded = false;
            this.signature = "";
            this.sortMode = "tree";
            this.sortDirection = "asc";
        }
        if (this.config.defaultExpandedDepth !== config.defaultExpandedDepth) {
            this.seeded = false;
        }
        if (this.config.autoExpand !== config.autoExpand) {
            this.seeded = false;
            if (config.autoExpand === false) {
                this.expanded.clear();
            }
        }
        this.context = context;
        this.element.setAttribute("data-sad-root", context.id);
        this.tree = tree;
        applySortMode(this.tree, this.sortMode, this.sortDirection);
        this.navigation = this.plugin.navigationFor(context.id);
        this.config = config;
        this.legacyIds = new Set(legacyIds);
        pruneSelection(this.selection, tree);
        this.pruneReferenceExpanded();
        this.seedExpanded();
        const next = this.currentSignature();
        if (next === this.signature) {
            this.ensurePlacement();
            return false;
        }
        this.signature = next;
        this.render();
        return true;
    }

    ensurePlacement() {
        const content = contentElement(this.protyle);
        const editor = editorElement(this.protyle);
        if (!content || !this.element) {
            return;
        }
        if (this.element.parentElement !== content) {
            content.insertBefore(this.element, editor || content.firstChild);
        }
        if (editor && this.element.nextElementSibling !== editor) {
            content.insertBefore(this.element, editor);
        }
        this.observePlacement();
    }

    observePlacement() {
        if (this.destroyed) {
            return;
        }
        const content = contentElement(this.protyle);
        if (!content) {
            return;
        }
        if (!this.observer) {
            this.observer = new MutationObserver(this.onMutations);
        }
        if (this.observerContent !== content) {
            this.observer.disconnect();
            this.observer.observe(content, {childList: true});
            this.observerContent = content;
        }
    }

    onMutations() {
        if (this.destroyed || !this.element) {
            return;
        }
        const content = contentElement(this.protyle);
        const editor = editorElement(this.protyle);
        if (!content) {
            return;
        }
        if (this.element.parentElement === content && (!editor || this.element.nextElementSibling === editor)) {
            return;
        }
        if (!this.restoreTimer) {
            this.restoreTimer = setTimeout(() => {
                this.restoreTimer = null;
                if (!this.destroyed) {
                    this.ensurePlacement();
                }
            }, 0);
        }
    }

    render() {
        if (!this.element) {
            return;
        }
        this.element.classList.remove("is-loading");
        this.element.removeAttribute("aria-busy");
        this.ensurePlacement();
        applySortMode(this.tree, this.sortMode, this.sortDirection);
        this.element.innerHTML = renderPanelHtml(this.tree, this, this.config, Array.from(this.legacyIds));
        markSelectionOnElement(this.element, this.selection, allSelectableIds(this.tree));
        this.syncLegacyVisibility();
    }

    showLoading(context) {
        if (this.destroyed || !this.element) {
            return;
        }
        const id = text(typeof context === "string" ? context : context && context.id);
        if (id) {
            this.element.setAttribute("data-sad-root", id);
        }
        this.element.setAttribute("aria-busy", "true");
        if (this.element.classList.contains("is-loading") &&
            this.element.querySelector(":scope > .siyuan-auto-directory__loading")) {
            return;
        }
        this.element.classList.add("is-loading");
        const loading = document.createElement("div");
        loading.className = "siyuan-auto-directory__loading";
        loading.setAttribute("role", "status");
        loading.setAttribute("aria-live", "polite");
        loading.innerHTML = '<span class="siyuan-auto-directory__spinner" aria-hidden="true"></span><span>正在加载目录…</span>';
        this.element.appendChild(loading);
    }

    visibleNode(id) {
        return this.tree.index.get(text(id));
    }

    pruneReferenceExpanded() {
        const valid = new Set([`out:${this.tree.id}`]);
        this.tree.index.forEach((node) => {
            valid.add(`out:${node.id}`);
            valid.add(`in:${node.id}`);
        });
        this.referenceExpanded.forEach((key) => {
            if (!valid.has(key)) {
                this.referenceExpanded.delete(key);
            }
        });
    }

    syncLegacyVisibility() {
        this.hiddenLegacyElements.forEach((element) => {
            element.classList.remove("sad-legacy-block");
        });
        this.hiddenLegacyElements.clear();
        const editor = editorElement(this.protyle);
        if (!editor || !this.legacyIds.size) {
            return;
        }
        this.legacyIds.forEach((id) => {
            const block = editor.querySelector(`[data-node-id="${cssEscape(id)}"]`);
            if (block) {
                block.classList.add("sad-legacy-block");
                this.hiddenLegacyElements.add(block);
            }
        });
    }

    async onClick(event) {
        const target = event.target;
        if (!target || typeof target.closest !== "function") {
            return;
        }
        const action = target.closest("[data-sad-action]");
        if (action) {
            event.preventDefault();
            event.stopPropagation();
            const name = action.getAttribute("data-sad-action");
            if (name === "refresh") {
                this.signature = "";
                this.plugin.refresh(this.protyle, {force: true});
            } else if (name === "settings") {
                this.plugin.openSetting();
            } else if (name === "delete-selected") {
                await this.deleteSelected();
            } else if (name === "remove-legacy") {
                await this.removeLegacy();
            }
            return;
        }
        const pin = target.closest("[data-sad-pin]");
        if (pin) {
            event.preventDefault();
            event.stopPropagation();
            const id = pin.getAttribute("data-sad-pin");
            if (id) {
                pin.disabled = true;
                try {
                    await this.plugin.togglePin(id);
                } finally {
                    if (pin.isConnected) {
                        pin.disabled = false;
                    }
                }
            }
            return;
        }
        const toggle = target.closest("[data-sad-toggle]");
        if (toggle) {
            event.preventDefault();
            event.stopPropagation();
            const id = toggle.getAttribute("data-sad-toggle");
            if (this.expanded.has(id)) {
                this.expanded.delete(id);
            } else {
                this.expanded.add(id);
            }
            this.render();
            return;
        }
        const more = target.closest("[data-sad-more]");
        if (more) {
            event.preventDefault();
            event.stopPropagation();
            const id = more.getAttribute("data-sad-more") || "__root__";
            const current = this.page.get(id) || 0;
            this.page.set(id, current + PAGE_SIZE);
            this.render();
            return;
        }
        const moreReferences = target.closest("[data-sad-more-refs]");
        if (moreReferences) {
            event.preventDefault();
            event.stopPropagation();
            const key = moreReferences.getAttribute("data-sad-more-refs");
            if (key) {
                if (this.referenceExpanded.has(key)) {
                    this.referenceExpanded.delete(key);
                } else {
                    this.referenceExpanded.add(key);
                }
                this.render();
            }
            return;
        }
        const remove = target.closest("[data-sad-delete]");
        if (remove) {
            event.preventDefault();
            event.stopPropagation();
            await this.confirmDelete([remove.getAttribute("data-sad-delete")]);
            return;
        }
        const open = target.closest("[data-sad-open]");
        if (open) {
            event.preventDefault();
            event.stopPropagation();
            const id = open.getAttribute("data-sad-open");
            if (id) {
                this.plugin.openDocument(id, {
                    fromPanel: true,
                    context: this.context,
                    title: this.tree.title,
                });
            }
            return;
        }
        const navigate = target.closest("[data-sad-navigate-to]");
        if (navigate) {
            event.preventDefault();
            event.stopPropagation();
            const id = navigate.getAttribute("data-sad-navigate-to");
            if (id) {
                this.plugin.openDocument(id, {back: true});
            }
        }
    }

    rowFromTarget(target) {
        return target && typeof target.closest === "function"
            ? target.closest("[data-sad-row]")
            : null;
    }

    clearDragState() {
        this.dragSourceId = "";
        this.dropTargetId = "";
        this.dropPosition = "";
        if (!this.element) {
            return;
        }
        this.element.querySelectorAll(".is-dragging, .is-drop-target, .is-drop-before, .is-drop-inside, .is-drop-after").forEach((row) => {
            row.classList.remove("is-dragging", "is-drop-target", "is-drop-before", "is-drop-inside", "is-drop-after");
        });
    }

    updateDropTarget(row, position = "") {
        const id = row ? row.getAttribute("data-sad-row") : "";
        if (this.dropTargetId === id && this.dropPosition === position) {
            return;
        }
        this.dropTargetId = id;
        this.dropPosition = position;
        this.element.querySelectorAll(".is-drop-target, .is-drop-before, .is-drop-inside, .is-drop-after").forEach((item) => {
            item.classList.remove("is-drop-target", "is-drop-before", "is-drop-inside", "is-drop-after");
        });
        if (row) {
            row.classList.add("is-drop-target");
            if (position) {
                row.classList.add(`is-drop-${position}`);
            }
        }
    }

    dropPositionForEvent(row, event) {
        const rect = row.getBoundingClientRect();
        const ratio = rect.height > 0 ? (event.clientY - rect.top) / rect.height : 0.5;
        if (ratio < 0.28) {
            return "before";
        }
        if (ratio > 0.72) {
            return "after";
        }
        return "inside";
    }

    onDragStart(event) {
        const row = this.rowFromTarget(event.target);
        if (!row || row.getAttribute("data-sad-draggable") !== "true") {
            event.preventDefault();
            return;
        }
        const id = row.getAttribute("data-sad-row");
        const node = findNode(this.tree, id);
        if (!node || node.external) {
            event.preventDefault();
            return;
        }
        this.dragSourceId = id;
        row.classList.add("is-dragging");
        if (event.dataTransfer) {
            event.dataTransfer.effectAllowed = "move";
            event.dataTransfer.setData("text/plain", id);
        }
    }

    onDragOver(event) {
        const row = this.rowFromTarget(event.target);
        if (!row || !this.dragSourceId) {
            return;
        }
        const targetId = row.getAttribute("data-sad-row");
        const position = this.dropPositionForEvent(row, event);
        if (this.sortMode !== "tree" && position !== "inside") {
            this.updateDropTarget(null);
            if (event.dataTransfer) {
                event.dataTransfer.dropEffect = "none";
            }
            return;
        }
        if (!canMoveNode(this.tree, this.dragSourceId, targetId)) {
            this.updateDropTarget(null);
            if (event.dataTransfer) {
                event.dataTransfer.dropEffect = "none";
            }
            return;
        }
        event.preventDefault();
        event.stopPropagation();
        if (event.dataTransfer) {
            event.dataTransfer.dropEffect = "move";
        }
        this.updateDropTarget(row, position);
    }

    onDragLeave(event) {
        const row = this.rowFromTarget(event.target);
        if (!row || (event.relatedTarget && row.contains(event.relatedTarget))) {
            return;
        }
        if (row.getAttribute("data-sad-row") === this.dropTargetId) {
            this.updateDropTarget(null);
        }
    }

    onDrop(event) {
        const row = this.rowFromTarget(event.target);
        if (!row || !this.dragSourceId) {
            return;
        }
        const sourceId = this.dragSourceId;
        const position = this.dropPosition;
        const targetId = row.getAttribute("data-sad-row");
        if (this.sortMode !== "tree" && position !== "inside") {
            this.clearDragState();
            return;
        }
        if (!position || !canMoveNode(this.tree, sourceId, targetId)) {
            this.clearDragState();
            return;
        }
        event.preventDefault();
        event.stopPropagation();
        this.clearDragState();
        this.startMove(sourceId, targetId, position);
    }

    onDragEnd() {
        this.clearDragState();
    }

    async startMove(sourceId, targetId, position) {
        const source = findNode(this.tree, sourceId);
        const target = findNode(this.tree, targetId);
        if (!source || !target) {
            return;
        }
        const relation = position === "inside"
            ? "内，作为它的子文档"
            : (position === "before" ? "上方（同一层级）" : "下方（同一层级）");
        if (this.config.confirmMove === false) {
            await this.performMove(source, target, position, relation);
            return;
        }
        showMoveConfirm({
            sourceTitle: source.title,
            targetTitle: target.title,
            relation,
        }, async ({dontAsk}) => {
            if (dontAsk) {
                try {
                    await this.plugin.updateConfig({
                        ...this.config,
                        confirmMove: false,
                    });
                    this.config = this.plugin.config;
                } catch (error) {
                    console.error("[siyuan-auto-directory] 保存移动确认设置失败", error);
                    showMessage("移动确认设置保存失败：" + error.message);
                }
            }
            await this.performMove(source, target, position, relation);
        });
    }

    async performMove(source, target, position, relation) {
        try {
            if (position === "inside") {
                await moveDocsByID([source.id], target.id);
            } else {
                const result = await reorderDocs([source.id], target.id, position);
                if (result && result.changed === false) {
                    showMessage(result.conflict
                        ? "同级排序存在自定义排序冲突，请先在思源文档树中调整排序"
                        : "目录顺序没有变化");
                    return;
                }
            }
            showMessage(`已将「${source.title}」移动到「${target.title}」${relation}`);
            this.selection.delete(source.id);
            this.signature = "";
            this.plugin.refresh(this.protyle, {force: true});
        } catch (error) {
            console.error("[siyuan-auto-directory] 移动文档失败", error);
            showMessage("移动文档失败：" + error.message);
        }
    }

    onChange(event) {
        const input = event.target;
        if (!input || !input.matches) {
            return;
        }
        if (input.matches("[data-sad-sort]")) {
            const [mode, direction] = text(input.value).split(":");
            const next = normalizeSort(mode, direction);
            this.sortMode = next.mode;
            this.sortDirection = next.direction;
            this.signature = "";
            this.render();
            this.signature = this.currentSignature();
            return;
        }
        if (input.matches("[data-sad-select-all]")) {
            const ids = allSelectableIds(this.tree);
            this.selection.clear();
            if (input.checked) {
                ids.forEach((id) => this.selection.add(id));
            }
            markSelectionOnElement(this.element, this.selection, ids);
            return;
        }
        if (!input.matches("[data-sad-select]")) {
            return;
        }
        const id = input.getAttribute("data-sad-select");
        setSelected(this.selection, id, input.checked);
        markSelectionOnElement(this.element, this.selection, allSelectableIds(this.tree));
    }

    async deleteSelected() {
        await this.confirmDelete(Array.from(this.selection));
    }

    async confirmDelete(ids) {
        const nodes = selectedNodes(this.tree, new Set((ids || []).filter(Boolean)));
        if (!nodes.length) {
            return;
        }
        const names = nodes.slice(0, 5).map((node) => `「${node.title}」`).join("、");
        const extra = nodes.length > 5 ? ` 等 ${nodes.length} 篇` : "";
        confirm(
            "删除选中文档",
            `将删除 ${nodes.length} 篇文档：${names}${extra}。删除后无法在目录中恢复，请确认文档树中没有需要保留的内容。`,
            async () => {
                try {
                    const paths = [];
                    for (const node of nodes) {
                        if (node.path) {
                            paths.push(node.path);
                            continue;
                        }
                        const data = await getDocPath(node.id);
                        if (data && data.path) {
                            paths.push(data.path);
                        }
                    }
                    if (!paths.length) {
                        showMessage("没有找到可删除的文档路径");
                        return;
                    }
                    await removeDocuments(paths);
                    this.selection.clear();
                    showMessage(`已删除 ${paths.length} 篇文档`);
                    this.signature = "";
                    this.plugin.refresh(this.protyle, {force: true});
                } catch (error) {
                    console.error("[siyuan-auto-directory] 删除文档失败", error);
                    showMessage("删除文档失败：" + error.message);
                }
            }
        );
    }

    async removeLegacy() {
        const ids = Array.from(this.legacyIds);
        if (!ids.length) {
            return;
        }
        confirm(
            "清理旧版目录块",
            `将删除当前文档中的 ${ids.length} 个旧版目录块。新目录不会写入正文，删除旧块不会影响文档树。`,
            async () => {
                try {
                    await removeLegacyBlocks(ids);
                    this.legacyIds.clear();
                    this.syncLegacyVisibility();
                    showMessage("旧版目录块已清理");
                    this.render();
                    this.plugin.refresh(this.protyle, {force: true});
                } catch (error) {
                    console.error("[siyuan-auto-directory] 清理旧版目录块失败", error);
                    showMessage("清理旧版目录块失败：" + error.message);
                }
            }
        );
    }

    destroy() {
        this.destroyed = true;
        if (this.restoreTimer) {
            clearTimeout(this.restoreTimer);
            this.restoreTimer = null;
        }
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }
        this.observerContent = null;
        this.hiddenLegacyElements.forEach((element) => {
            element.classList.remove("sad-legacy-block");
        });
        this.hiddenLegacyElements.clear();
        this.element.removeEventListener("click", this.onClick);
        this.element.removeEventListener("change", this.onChange);
        this.element.removeEventListener("dragstart", this.onDragStart);
        this.element.removeEventListener("dragover", this.onDragOver);
        this.element.removeEventListener("dragleave", this.onDragLeave);
        this.element.removeEventListener("drop", this.onDrop);
        this.element.removeEventListener("dragend", this.onDragEnd);
        this.element.remove();
    }
}
