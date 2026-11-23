import { PAGE_SIZE } from "./constants.js";
import { escapeHtml, text } from "./dom.js";
import { allSelectableIds } from "./selection.js";
import { formatDateTime } from "./time.js";
import { countNodes } from "./tree.js";

const INLINE_REFERENCE_LIMIT = 2;

const SORT_OPTIONS = [
    {value: "tree", label: "文档树顺序"},
    {value: "updated:desc", label: "最新修改"},
    {value: "updated:asc", label: "最早修改"},
    {value: "created:desc", label: "最新创建"},
    {value: "created:asc", label: "最早创建"},
    {value: "title:asc", label: "名称 A→Z"},
    {value: "title:desc", label: "名称 Z→A"},
];

function sortSelectValue(state) {
    const mode = state && typeof state.sortMode === "string" ? state.sortMode : "tree";
    if (mode === "tree") {
        return "tree";
    }
    const direction = state && state.sortDirection === "desc" ? "desc" : "asc";
    return `${mode}:${direction}`;
}

function renderSortSelect(state) {
    const value = sortSelectValue(state);
    return `<select class="siyuan-auto-directory__sort" data-sad-sort title="排序方式（仅影响当前目录显示）" aria-label="目录排序方式">${SORT_OPTIONS.map((option) => `<option value="${option.value}"${option.value === value ? " selected" : ""}>${option.label}</option>`).join("")}</select>`;
}

function childLimit(node, depth, config) {
    if (config.maxDepth > 0 && depth + 1 >= config.maxDepth) {
        return [];
    }
    return node.children || [];
}

function referencedCount(tree, hideIndexed = false) {
    let count = 0;
    const visit = (node) => {
        (node.references || []).forEach((reference) => {
            if (!hideIndexed || reference.external) {
                count += 1;
            }
        });
        (node.children || []).forEach(visit);
    };
    visit(tree);
    return count;
}

function renderMore(parentId, remaining) {
    return `<button class="siyuan-auto-directory__more" type="button" data-sad-more="${escapeHtml(parentId)}">加载更多（剩余 ${remaining} 篇）</button>`;
}

function referenceOrigin(node) {
    if (node.hpath && node.hpath !== "/") {
        return node.hpath;
    }
    return node.path || "未知路径";
}

function referenceKey(kind, nodeId) {
    return `${kind}:${nodeId}`;
}

function renderTags(tags, config, variant = "inline") {
    if (config.showDocumentTags === false || !tags.length) {
        return "";
    }
    const visible = variant === "detail" ? tags : tags.slice(0, 3);
    const hidden = tags.length - visible.length;
    const title = tags.map((tag) => `#${tag}`).join(" ");
    const classes = `siyuan-auto-directory__tags${variant === "detail" ? " siyuan-auto-directory__tags--detail" : ""}`;
    return `<span class="${classes}" title="标签：${escapeHtml(title)}">${visible.map((tag) => `<span class="siyuan-auto-directory__tag">#${escapeHtml(tag)}</span>`).join("")}${hidden > 0 ? `<span class="siyuan-auto-directory__tag siyuan-auto-directory__tag--more" title="还有 ${hidden} 个标签">+${hidden}</span>` : ""}</span>`;
}

const PIN_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M16 9V4h1c.55 0 1-.45 1-1s-.45-1-1-1H7c-.55 0-1 .45-1 1s.45 1 1 1h1v5c0 1.66-1.34 3-3 3v2h5.97v7l1 1 1-1v-7H19v-2c-1.66 0-3-1.34-3-3z"/></svg>';

function renderReferenceLine(state, key, label, references) {
    if (!references.length) {
        return "";
    }
    const expanded = Boolean(state.referenceExpanded && state.referenceExpanded.has(key));
    const visible = expanded ? references : references.slice(0, INLINE_REFERENCE_LIMIT);
    const hidden = references.length - visible.length;
    const toggle = hidden > 0
        ? `<button class="siyuan-auto-directory__ref-more" type="button" data-sad-more-refs="${escapeHtml(key)}">+${hidden}</button>`
        : (expanded && references.length > INLINE_REFERENCE_LIMIT
            ? `<button class="siyuan-auto-directory__ref-more" type="button" data-sad-more-refs="${escapeHtml(key)}">收起</button>`
            : "");
    return `<span class="siyuan-auto-directory__inline-refs">
      <span class="siyuan-auto-directory__ref-label">${escapeHtml(label)}</span>
      ${visible.map((reference) => `<button class="siyuan-auto-directory__ref-link${reference.external ? " is-external" : ""}" type="button" data-sad-open="${escapeHtml(reference.id)}" title="打开引用文档：${escapeHtml(reference.title || referenceOrigin(reference))}（${escapeHtml(referenceOrigin(reference))}）">${escapeHtml(referenceOrigin(reference))}</button>`).join("")}
      ${toggle}
    </span>`;
}

function renderInlineReferences(references, sourceId, state, label = "引用了") {
    if (!references.length) {
        return "";
    }
    return renderReferenceLine(state, referenceKey("out", sourceId), label, references);
}

function renderNavigation(tree, state) {
    const trail = state.navigation && Array.isArray(state.navigation.trail)
        ? state.navigation.trail
        : [];
    if (!trail.length) {
        return "";
    }
    const back = trail[trail.length - 1];
    const currentTitle = text(tree && tree.title) || "当前文档";
    const items = trail.map((entry) => {
        const title = text(entry && entry.title) || "上级目录";
        const id = text(entry && entry.id);
        return `<button class="siyuan-auto-directory__nav-link" type="button" data-sad-navigate-to="${escapeHtml(id)}" title="返回目录：${escapeHtml(title)}">${escapeHtml(title)}</button><span class="siyuan-auto-directory__nav-separator" aria-hidden="true">›</span>`;
    }).join("");
    return `<nav class="siyuan-auto-directory__navigation" aria-label="目录导航">
  <button class="siyuan-auto-directory__nav-back" type="button" data-sad-navigate-to="${escapeHtml(back.id)}" title="返回上级目录：${escapeHtml(back.title || "上级目录")}">
    <span aria-hidden="true">←</span><span>返回上级</span>
  </button>
  <span class="siyuan-auto-directory__nav-divider" aria-hidden="true"></span>
  <span class="siyuan-auto-directory__nav-trail">
    ${items}<span class="siyuan-auto-directory__nav-current" aria-current="page">${escapeHtml(currentTitle)}</span>
  </span>
</nav>`;
}

function renderRows(nodes, depth, state, config, parentId) {
    if (!nodes.length) {
        return "";
    }
    const pageSize = state.page.get(parentId) || PAGE_SIZE;
    const visible = nodes.slice(0, pageSize);
    const html = visible.map((node) => renderNode(node, depth, state, config)).join("");
    if (nodes.length <= pageSize) {
        return html;
    }
    return html + renderMore(parentId, nodes.length - pageSize);
}

function renderNode(node, depth, state, config) {
    const children = childLimit(node, depth, config);
    const showReferencedDocs = config.showReferencedDocs !== false;
    const references = showReferencedDocs ? (node.references || []) : [];
    const hasChildren = children.length > 0;
    const expanded = hasChildren && state.expanded.has(node.id);
    const selected = state.selection.has(node.id);
    const pinned = node.pinned === true;
    const tagList = Array.isArray(node.tags) ? node.tags : [];
    const inlineTags = tagList.length === 1 ? renderTags(tagList, config) : "";
    const detailTags = tagList.length > 1 ? renderTags(tagList, config, "detail") : "";
    const pinButton = node.external
        ? ""
        : `<button class="siyuan-auto-directory__pin${pinned ? " is-active" : ""}" type="button" data-sad-pin="${escapeHtml(node.id)}" aria-pressed="${pinned}" title="${pinned ? "取消置顶" : "在当前层级置顶"}" aria-label="${pinned ? "取消置顶" : "在当前层级置顶"}：${escapeHtml(node.title)}">${PIN_ICON}</button>`;
    const count = config.showChildCount && hasChildren
        ? `<span class="siyuan-auto-directory__count" title="直接子文档数">${children.length}</span>`
        : "";
    const badge = showReferencedDocs && node.referenced
        ? node.external
            ? `<span class="siyuan-auto-directory__badge siyuan-auto-directory__badge--external" title="当前文档引用了树外文档">外部引用</span>`
            : `<span class="siyuan-auto-directory__badge" title="其他目录笔记引用了这个文档">被引用</span>`
        : "";
    const visibleReferences = config.hideIndexedReferences !== false
        ? references.filter((reference) => reference.external)
        : references;
    const inlineReferences = visibleReferences.length ? renderInlineReferences(visibleReferences, node.id, state) : "";
    const createdTime = formatDateTime(node.created);
    const updatedTime = formatDateTime(node.updated);
    const createdText = createdTime ? `创建 ${createdTime}` : "";
    const updatedText = updatedTime ? `修改 ${updatedTime}` : "";
    const timeDetail = [createdText, updatedText].filter(Boolean).join(" · ");
    const showCreatedTime = config.showCreatedTime === true && createdText;
    const showUpdatedTime = config.showUpdatedTime !== false && updatedText;
    const openTitle = `打开：${node.title}${timeDetail ? `\n${timeDetail}` : ""}`;
    const draggable = !node.external;
    const autoSorted = state.sortMode && state.sortMode !== "tree";
    const dragHint = autoSorted
        ? "拖到行中间成为子文档；自动排序下暂停同级拖拽"
        : "拖到行上/下缘同级排序，拖到行中间成为子文档";
    const branch = expanded
        ? `<div class="siyuan-auto-directory__branch" data-sad-branch="${escapeHtml(node.id)}">${renderRows(children, depth + 1, state, config, node.id)}</div>`
        : "";
    const toggle = hasChildren
        ? `<button class="siyuan-auto-directory__toggle" type="button" data-sad-toggle="${escapeHtml(node.id)}" aria-expanded="${expanded}" aria-label="${expanded ? "收起" : "展开"}：${escapeHtml(node.title)}">
      <svg aria-hidden="true"><use xlink:href="#iconRight"></use></svg>
    </button>`
        : `<span class="siyuan-auto-directory__toggle" aria-hidden="true"></span>`;

    return `<div class="siyuan-auto-directory__node" data-sad-node="${escapeHtml(node.id)}" data-sad-depth="${depth}">
  <div class="siyuan-auto-directory__row${selected ? " is-selected" : ""}${node.external ? " is-external" : ""}${pinned ? " is-pinned" : ""}" data-sad-row="${escapeHtml(node.id)}" draggable="${draggable}" data-sad-draggable="${draggable}"${draggable ? ` title="${escapeHtml(dragHint)}"` : ""}>
    <label class="siyuan-auto-directory__check" title="选择：${escapeHtml(node.title)}">
      <input type="checkbox" data-sad-select="${escapeHtml(node.id)}" ${selected ? "checked" : ""} aria-label="选择：${escapeHtml(node.title)}">
    </label>
    ${toggle}
    <div class="siyuan-auto-directory__row-main">
      <div class="siyuan-auto-directory__row-main-title">
        <button class="siyuan-auto-directory__name" type="button" data-sad-open="${escapeHtml(node.id)}" title="${escapeHtml(openTitle)}">${escapeHtml(node.title)}</button>
        ${pinButton}
      </div>
      ${detailTags}
      ${showCreatedTime ? `<span class="siyuan-auto-directory__meta" title="${escapeHtml(timeDetail)}">${escapeHtml(createdText)}</span>` : ""}
      ${inlineReferences}
    </div>
    ${inlineTags}
    ${showUpdatedTime ? `<span class="siyuan-auto-directory__time" title="最后修改时间：${escapeHtml(updatedTime)}">${escapeHtml(updatedText)}</span>` : ""}
    ${badge}
    ${count}
    <button class="siyuan-auto-directory__delete" type="button" data-sad-delete="${escapeHtml(node.id)}" title="删除：${escapeHtml(node.title)}">删除</button>
    <button class="siyuan-auto-directory__open" type="button" data-sad-open="${escapeHtml(node.id)}" title="打开：${escapeHtml(node.title)}" aria-label="打开：${escapeHtml(node.title)}">→</button>
  </div>
  ${branch}
</div>`;
}

export function renderPanelHtml(tree, state, config, legacyIds = []) {
    const total = countNodes(tree);
    const selected = state.selection ? state.selection.size : 0;
    const showRefs = config.showReferencedDocs !== false;
    const selectable = allSelectableIds(tree);
    const allChecked = selectable.length > 0 && selectable.every((id) => state.selection.has(id));
    const refs = showRefs ? referencedCount(tree, config.hideIndexedReferences !== false) : 0;
    const scope = config.maxDepth > 0 ? ` · 最多 ${config.maxDepth} 层` : "";
    const refText = refs ? ` · 引用 ${refs} 篇` : "";
    const sourceText = showRefs ? "真实子文档层级 + 逐篇引用" : "真实子文档层级";
    const childNodes = tree.children.filter((node) => !node.external);
    const legacy = legacyIds.length
        ? `<div class="siyuan-auto-directory__legacy">
  <span>检测到旧版目录块 ${legacyIds.length} 个。当前树已按真实文档重新合并，旧块可清理以避免重复。</span>
  <button type="button" data-sad-action="remove-legacy">删除旧块</button>
</div>`
        : "";
    const deleteLabel = selected ? `删除选中 (${selected})` : "删除选中";
    const sortHint = state.sortMode && state.sortMode !== "tree"
        ? "当前为临时排序，切回“文档树顺序”即可恢复"
        : "点击图钉置顶 · 拖到行上/下缘同级排序，拖到行中间成为子文档";
    return `<div class="siyuan-auto-directory__header">
  <label class="siyuan-auto-directory__select-all" title="全选当前目录">
    <input type="checkbox" data-sad-select-all ${allChecked ? "checked" : ""} ${selectable.length ? "" : "disabled"} aria-label="全选当前目录">
    <span>全选</span>
  </label>
  <span class="siyuan-auto-directory__title">
    <svg class="siyuan-auto-directory__icon" aria-hidden="true"><use xlink:href="#iconList"></use></svg>
    目录
  </span>
  <span class="siyuan-auto-directory__status">共 ${total} 篇${refText}${scope}</span>
  ${renderSortSelect(state)}
  <span class="siyuan-auto-directory__actions">
    <button class="siyuan-auto-directory__delete-selected" type="button" data-sad-action="delete-selected" ${selected ? "" : "disabled"}>${deleteLabel}</button>
    <button class="siyuan-auto-directory__action" type="button" data-sad-action="refresh" title="刷新目录" aria-label="刷新目录">
      <svg aria-hidden="true"><use xlink:href="#iconRefresh"></use></svg>
    </button>
    <button class="siyuan-auto-directory__action" type="button" data-sad-action="settings" title="目录设置" aria-label="目录设置">
      <svg aria-hidden="true"><use xlink:href="#iconSettings"></use></svg>
    </button>
  </span>
</div>
${renderNavigation(tree, state)}
${legacy}
<div class="siyuan-auto-directory__tree">${renderRows(childNodes, 0, state, config, "__root__")}</div>
<div class="siyuan-auto-directory__footer">来源：${sourceText} · 不写入正文 · ${sortHint}</div>`;
}

export function markSelectionOnElement(element, selection, allIds = []) {
    if (!element) {
        return;
    }
    element.querySelectorAll("[data-sad-select]").forEach((input) => {
        const checked = selection.has(input.getAttribute("data-sad-select"));
        input.checked = checked;
        const row = input.closest(".siyuan-auto-directory__row");
        if (row) {
            row.classList.toggle("is-selected", checked);
        }
    });
    const button = element.querySelector('[data-sad-action="delete-selected"]');
    if (button) {
        button.disabled = selection.size === 0;
        button.textContent = selection.size ? `删除选中 (${selection.size})` : "删除选中";
    }
    const selectAll = element.querySelector("[data-sad-select-all]");
    if (selectAll) {
        const allChecked = allIds.length > 0 && allIds.every((id) => selection.has(id));
        const someChecked = !allChecked && allIds.some((id) => selection.has(id));
        selectAll.checked = allChecked;
        selectAll.indeterminate = someChecked;
        selectAll.setAttribute("data-sad-indeterminate", someChecked ? "true" : "false");
        selectAll.disabled = allIds.length === 0;
    }
}

export function elementTitle(element) {
    return text(element && element.textContent).trim();
}
