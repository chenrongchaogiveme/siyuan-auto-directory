import { text } from "./dom.js";
import { countDocuments, findAncestorKeys, searchWorkspaceRows } from "./workspace.js";

export const OVERLAY_LIMIT = 400;

function escapeHtml(value) {
    return text(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

export function flattenTree(tree, depth = 0, rows = []) {
    const children = tree && Array.isArray(tree.children) ? tree.children : [];
    children.forEach((node) => {
        if (!node || !node.id || node.external) {
            return;
        }
        rows.push({
            id: text(node.id),
            title: text(node.title) || "未命名文档",
            hpath: text(node.hpath),
            depth,
            hasChildren: Boolean(node.children && node.children.length),
        });
        flattenTree(node, depth + 1, rows);
    });
    return rows;
}

export function filterRows(rows, query) {
    const keyword = text(query).trim().toLowerCase();
    const list = Array.isArray(rows) ? rows : [];
    if (!keyword) {
        return list.slice();
    }
    return list.filter((row) => row.title.toLowerCase().includes(keyword) || row.hpath.toLowerCase().includes(keyword));
}

export function collectVisibleRows(forest, expanded, currentId) {
    const rows = [];
    const walk = (nodes, depth) => {
        (Array.isArray(nodes) ? nodes : []).forEach((node) => {
            if (!node || !node.key) {
                return;
            }
            const isExpanded = expanded && expanded.has(node.key);
            const hasChildren = Boolean(node.children && node.children.length);
            rows.push({
                key: node.key,
                id: node.id,
                title: node.title,
                depth,
                hasChildren,
                expanded: Boolean(isExpanded && hasChildren),
                isNotebook: Boolean(node.isNotebook),
                current: !node.isNotebook && node.id === currentId,
                sub: "",
            });
            if (isExpanded && hasChildren) {
                walk(node.children, depth + 1);
            }
        });
    };
    walk(forest, 0);
    return rows;
}

export class DirectoryOverlay {
    constructor(plugin) {
        this.plugin = plugin;
        this.element = null;
        this.input = null;
        this.list = null;
        this.scope = null;
        this.context = null;
        this.forest = [];
        this.expanded = new Set();
        this.currentId = "";
        this.rows = [];
        this.visible = [];
        this.activeIndex = 0;
        this.query = "";
        this.loading = false;
        this.scrollToCurrent = false;
        this.previousFocus = null;
        this.onKeydownBound = (event) => this.onKeydown(event);
    }

    get isOpen() {
        return Boolean(this.element);
    }

    open(context) {
        this.context = context || null;
        this.previousFocus = document.activeElement;
        if (!this.element) {
            this.build();
        }
        this.query = "";
        if (this.input) {
            this.input.value = "";
        }
        this.activeIndex = 0;
        this.forest = [];
        this.expanded = new Set();
        this.currentId = "";
        this.loading = true;
        this.scrollToCurrent = false;
        if (this.scope) {
            this.scope.textContent = "正在加载…";
        }
        this.applyFilter();
        document.addEventListener("keydown", this.onKeydownBound, true);
        window.setTimeout(() => {
            if (this.input) {
                this.input.focus();
            }
        }, 0);
    }

    setWorkspace(forest, currentId) {
        this.forest = Array.isArray(forest) ? forest : [];
        this.currentId = text(currentId);
        this.loading = false;
        this.expanded = new Set();
        findAncestorKeys(this.forest, this.currentId).forEach((key) => this.expanded.add(key));
        this.scrollToCurrent = Boolean(this.currentId);
        if (this.scope) {
            const total = countDocuments(this.forest);
            this.scope.textContent = total ? `${total} 篇文档 · ${this.forest.length} 个笔记本` : "";
        }
        this.applyFilter();
        const index = this.visible.findIndex((row) => row.current);
        if (index >= 0) {
            this.activeIndex = index;
            this.renderList();
        }
    }

    showError(message) {
        this.loading = false;
        this.visible = [];
        this.rows = [];
        if (this.scope) {
            this.scope.textContent = "";
        }
        if (this.list) {
            this.list.innerHTML = '<div class="sad-overlay__empty">' + escapeHtml(message || "加载工作空间目录失败") + "</div>";
        }
    }

    applyFilter() {
        if (this.query.trim()) {
            this.visible = searchWorkspaceRows(this.forest, this.query, OVERLAY_LIMIT);
        } else {
            this.visible = collectVisibleRows(this.forest, this.expanded, this.currentId);
        }
        if (this.activeIndex >= this.visible.length) {
            this.activeIndex = Math.max(0, this.visible.length - 1);
        }
        this.renderList();
    }

    build() {
        const wrapper = document.createElement("div");
        wrapper.className = "sad-overlay";
        wrapper.innerHTML = `
  <div class="sad-overlay__backdrop" data-sad-overlay-close></div>
  <div class="sad-overlay__panel" role="dialog" aria-modal="true" aria-label="快速目录">
    <div class="sad-overlay__head">
      <input class="sad-overlay__search b3-text-field" type="text" placeholder="搜索整个工作空间的文档…" aria-label="搜索文档">
      <span class="sad-overlay__scope"></span>
    </div>
    <div class="sad-overlay__list" role="listbox" aria-label="目录文档"></div>
    <div class="sad-overlay__foot">↑↓ 选择 · ←→ 折叠/展开 · Enter 打开 · Esc 关闭</div>
  </div>`;
        wrapper.addEventListener("mousedown", (event) => {
            if (event.target && event.target.closest && event.target.closest("[data-sad-overlay-close]")) {
                event.preventDefault();
                this.close();
            }
        });
        wrapper.addEventListener("click", (event) => {
            const target = event.target;
            if (!target || !target.closest) {
                return;
            }
            const toggle = target.closest("[data-sad-overlay-toggle]");
            if (toggle) {
                event.preventDefault();
                event.stopPropagation();
                this.toggle(toggle.getAttribute("data-sad-overlay-toggle"));
                return;
            }
            const row = target.closest("[data-sad-overlay-row]");
            if (!row) {
                return;
            }
            event.preventDefault();
            const item = this.visible.find((entry) => entry.key === row.getAttribute("data-sad-overlay-row"));
            if (item && item.isNotebook) {
                this.toggle(item.key);
                return;
            }
            this.pick(item ? item.id : row.getAttribute("data-sad-overlay-row"));
        });
        this.input = wrapper.querySelector(".sad-overlay__search");
        this.list = wrapper.querySelector(".sad-overlay__list");
        this.scope = wrapper.querySelector(".sad-overlay__scope");
        this.input.addEventListener("input", () => {
            this.query = this.input.value;
            this.activeIndex = 0;
            this.applyFilter();
        });
        document.body.appendChild(wrapper);
        this.element = wrapper;
    }

    renderList() {
        if (!this.list) {
            return;
        }
        if (!this.visible.length) {
            const empty = this.loading ? "正在加载…" : (this.forest.length ? "没有匹配的文档" : "没有可显示的文档");
            this.list.innerHTML = '<div class="sad-overlay__empty">' + empty + "</div>";
            return;
        }
        this.list.innerHTML = this.visible.map((row, index) => {
            const classes = ["sad-overlay__row"];
            if (index === this.activeIndex) {
                classes.push("is-active");
            }
            if (row.current) {
                classes.push("is-current");
            }
            if (row.isNotebook) {
                classes.push("sad-overlay__row--box");
            }
            const twisty = row.hasChildren ? (row.expanded ? "▾" : "▸") : "";
            const sub = row.sub ? `<span class="sad-overlay__sub">${escapeHtml(row.sub)}</span>` : "";
            const badge = row.current ? '<span class="sad-overlay__badge">当前</span>' : "";
            return `
    <button class="${classes.join(" ")}" type="button" role="option" aria-selected="${index === this.activeIndex}" data-sad-overlay-row="${escapeHtml(row.key)}" style="padding-left:${8 + row.depth * 16}px">
      <span class="sad-overlay__twisty"${row.hasChildren ? ` data-sad-overlay-toggle="${escapeHtml(row.key)}"` : ""}>${twisty}</span>
      <span class="sad-overlay__body">
        <span class="sad-overlay__title">${escapeHtml(row.title)}</span>
        ${sub}
      </span>
      ${badge}
    </button>`;
        }).join("");
        const active = this.list.querySelector(".is-active");
        if (this.scrollToCurrent) {
            const current = this.list.querySelector(".is-current");
            this.scrollToCurrent = false;
            if (current && typeof current.scrollIntoView === "function") {
                current.scrollIntoView({block: "center"});
                return;
            }
        }
        if (active && typeof active.scrollIntoView === "function") {
            active.scrollIntoView({block: "nearest"});
        }
    }

    toggle(key) {
        const target = text(key);
        if (!target) {
            return;
        }
        if (this.expanded.has(target)) {
            this.expanded.delete(target);
        } else {
            this.expanded.add(target);
        }
        if (this.query.trim()) {
            this.query = "";
            if (this.input) {
                this.input.value = "";
            }
        }
        this.applyFilter();
    }

    move(delta) {
        if (!this.visible.length) {
            return;
        }
        const next = this.activeIndex + delta;
        this.activeIndex = Math.max(0, Math.min(this.visible.length - 1, next));
        this.renderList();
    }

    expandActive(expand) {
        const row = this.visible[this.activeIndex];
        if (!row) {
            return;
        }
        if (expand && row.hasChildren && !row.expanded) {
            this.toggle(row.key);
            return;
        }
        if (!expand && row.expanded) {
            this.toggle(row.key);
        }
    }

    pick(id) {
        const target = text(id);
        if (!target) {
            return;
        }
        this.close();
        this.plugin.openDocument(target);
    }

    onKeydown(event) {
        if (!this.isOpen) {
            return;
        }
        if (event.isComposing) {
            return;
        }
        if (event.key === "Escape") {
            event.preventDefault();
            event.stopPropagation();
            this.close();
            return;
        }
        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            event.stopPropagation();
            this.move(event.key === "ArrowDown" ? 1 : -1);
            return;
        }
        if (event.key === "ArrowRight") {
            event.preventDefault();
            event.stopPropagation();
            this.expandActive(true);
            return;
        }
        if (event.key === "ArrowLeft") {
            event.preventDefault();
            event.stopPropagation();
            this.expandActive(false);
            return;
        }
        if (event.key === "Enter") {
            event.preventDefault();
            event.stopPropagation();
            const row = this.visible[this.activeIndex];
            if (!row) {
                return;
            }
            if (row.isNotebook) {
                this.toggle(row.key);
                return;
            }
            this.pick(row.id);
        }
    }

    close() {
        document.removeEventListener("keydown", this.onKeydownBound, true);
        if (this.element) {
            this.element.remove();
        }
        this.element = null;
        this.input = null;
        this.list = null;
        this.scope = null;
        this.visible = [];
        this.rows = [];
        this.forest = [];
        this.expanded = new Set();
        this.context = null;
        if (this.previousFocus && typeof this.previousFocus.focus === "function" && this.previousFocus.isConnected) {
            this.previousFocus.focus();
        }
        this.previousFocus = null;
    }
}