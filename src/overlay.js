import { text } from "./dom.js";

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

export class DirectoryOverlay {
    constructor(plugin) {
        this.plugin = plugin;
        this.element = null;
        this.input = null;
        this.list = null;
        this.scope = null;
        this.context = null;
        this.rows = [];
        this.visible = [];
        this.activeIndex = 0;
        this.query = "";
        this.loading = false;
        this.previousFocus = null;
        this.onKeydownBound = (event) => this.onKeydown(event);
    }

    get isOpen() {
        return Boolean(this.element);
    }

    open(context, tree) {
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
        this.setTree(tree);
        document.addEventListener("keydown", this.onKeydownBound, true);
        window.setTimeout(() => {
            if (this.input) {
                this.input.focus();
            }
        }, 0);
    }

    setTree(tree) {
        this.loading = !tree;
        this.rows = flattenTree(tree || {children: []});
        if (this.rows.length > OVERLAY_LIMIT) {
            this.rows = this.rows.slice(0, OVERLAY_LIMIT);
        }
        if (this.scope) {
            this.scope.textContent = this.rows.length ? `${this.rows.length} 篇文档` : "";
        }
        this.applyFilter();
    }

    build() {
        const wrapper = document.createElement("div");
        wrapper.className = "sad-overlay";
        wrapper.innerHTML = `
  <div class="sad-overlay__backdrop" data-sad-overlay-close></div>
  <div class="sad-overlay__panel" role="dialog" aria-modal="true" aria-label="快速目录">
    <div class="sad-overlay__head">
      <input class="sad-overlay__search b3-text-field" type="text" placeholder="搜索当前目录下的文档…" aria-label="搜索文档">
      <span class="sad-overlay__scope"></span>
    </div>
    <div class="sad-overlay__list" role="listbox" aria-label="目录文档"></div>
    <div class="sad-overlay__foot">↑↓ 选择 · Enter 打开 · Esc 关闭</div>
  </div>`;
        wrapper.addEventListener("mousedown", (event) => {
            if (event.target && event.target.closest && event.target.closest("[data-sad-overlay-close]")) {
                event.preventDefault();
                this.close();
            }
        });
        wrapper.addEventListener("click", (event) => {
            const row = event.target && event.target.closest ? event.target.closest("[data-sad-overlay-row]") : null;
            if (!row) {
                return;
            }
            event.preventDefault();
            this.pick(row.getAttribute("data-sad-overlay-row"));
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

    applyFilter() {
        this.visible = filterRows(this.rows, this.query);
        if (this.activeIndex >= this.visible.length) {
            this.activeIndex = Math.max(0, this.visible.length - 1);
        }
        this.renderList();
    }

    renderList() {
        if (!this.list) {
            return;
        }
        if (!this.visible.length) {
            this.list.innerHTML = '<div class="sad-overlay__empty">' + (this.loading ? "正在加载…" : "没有匹配的文档") + '</div>';
            return;
        }
        this.list.innerHTML = this.visible.map((row, index) => `
    <button class="sad-overlay__row${index === this.activeIndex ? " is-active" : ""}" type="button" role="option" aria-selected="${index === this.activeIndex}" data-sad-overlay-row="${escapeHtml(row.id)}" style="padding-left:${10 + row.depth * 14}px">
      <span class="sad-overlay__title">${escapeHtml(row.title)}</span>
      <span class="sad-overlay__path">${escapeHtml(row.hpath)}</span>
    </button>`).join("");
        const active = this.list.querySelector(".is-active");
        if (active && typeof active.scrollIntoView === "function") {
            active.scrollIntoView({block: "nearest"});
        }
    }

    move(delta) {
        if (!this.visible.length) {
            return;
        }
        const next = this.activeIndex + delta;
        this.activeIndex = Math.max(0, Math.min(this.visible.length - 1, next));
        this.renderList();
    }

    pick(id) {
        const target = this.visible.find((row) => row.id === id) || this.rows.find((row) => row.id === id);
        if (!target) {
            return;
        }
        this.close();
        this.plugin.openDocument(target.id);
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
        if (event.key === "Enter") {
            event.preventDefault();
            event.stopPropagation();
            const row = this.visible[this.activeIndex];
            if (row) {
                this.pick(row.id);
            }
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
        this.context = null;
        if (this.previousFocus && typeof this.previousFocus.focus === "function" && this.previousFocus.isConnected) {
            this.previousFocus.focus();
        }
        this.previousFocus = null;
    }
}