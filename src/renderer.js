import { PAGE_SIZE } from "./constants.js";
import { escapeHtml, text } from "./dom.js";
import { allSelectableIds } from "./selection.js";
import { formatDateTime } from "./time.js";
import { countNodes } from "./tree.js";

const INLINE_REFERENCE_LIMIT = 2;

function childLimit(node, depth, config) {
    if (config.maxDepth > 0 && depth + 1 >= config.maxDepth) {
        return [];
    }
    return node.children || [];
}

function referencedCount(tree) {
    let count = 0;
    const visit = (node) => {
        count += (node.references || []).length;
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

function renderInlineReferences(node, state, label = "引用了") {
    const references = node.references || [];
    if (!references.length) {
        return "";
    }
    return renderReferenceLine(state, referenceKey("out", node.id), label, references);
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
    const count = config.showChildCount && hasChildren
        ? `<span class="siyuan-auto-directory__count" title="直接子文档数">${children.length}</span>`
        : "";
    const badge = showReferencedDocs && node.referenced
        ? node.external
            ? `<span class="siyuan-auto-directory__badge siyuan-auto-directory__badge--external" title="当前文档引用了树外文档">外部引用</span>`
            : `<span class="siyuan-auto-directory__badge" title="其他目录笔记引用了这个文档">被引用</span>`
        : "";
    const inlineReferences = references.length ? renderInlineReferences(node, state) : "";
    const createdTime = formatDateTime(node.created);
    const updatedTime = formatDateTime(node.updated);
    const createdText = createdTime ? `创建 ${createdTime}` : "";
    const updatedText = updatedTime ? `修改 ${updatedTime}` : "";
    const timeDetail = [createdText, updatedText].filter(Boolean).join(" · ");
    const showCreatedTime = config.showCreatedTime === true && createdText;
    const showUpdatedTime = config.showUpdatedTime !== false && updatedText;
    const openTitle = `打开：${node.title}${timeDetail ? `\n${timeDetail}` : ""}`;
    const draggable = !node.external;
    const branch = expanded
        ? `<div class="siyuan-auto-directory__branch" data-sad-branch="${escapeHtml(node.id)}">${renderRows(children, depth + 1, state, config, node.id)}</div>`
        : "";
    const toggle = hasChildren
        ? `<button class="siyuan-auto-directory__toggle" type="button" data-sad-toggle="${escapeHtml(node.id)}" aria-expanded="${expanded}" aria-label="${expanded ? "收起" : "展开"}：${escapeHtml(node.title)}">
      <svg aria-hidden="true"><use xlink:href="#iconRight"></use></svg>
    </button>`
        : `<span class="siyuan-auto-directory__toggle" aria-hidden="true"></span>`;

    return `<div class="siyuan-auto-directory__node" data-sad-node="${escapeHtml(node.id)}" data-sad-depth="${depth}">
  <div class="siyuan-auto-directory__row${selected ? " is-selected" : ""}${node.external ? " is-external" : ""}" data-sad-row="${escapeHtml(node.id)}" draggable="${draggable}" data-sad-draggable="${draggable}"${draggable ? ' title="拖到行上/下缘同级排序，拖到行中间成为子文档"' : ""}>
    <label class="siyuan-auto-directory__check" title="选择：${escapeHtml(node.title)}">
      <input type="checkbox" data-sad-select="${escapeHtml(node.id)}" ${selected ? "checked" : ""} aria-label="选择：${escapeHtml(node.title)}">
    </label>
    ${toggle}
    <div class="siyuan-auto-directory__row-main">
      <button class="siyuan-auto-directory__name" type="button" data-sad-open="${escapeHtml(node.id)}" title="${escapeHtml(openTitle)}">${escapeHtml(node.title)}</button>
      ${showCreatedTime ? `<span class="siyuan-auto-directory__meta" title="${escapeHtml(timeDetail)}">${escapeHtml(createdText)}</span>` : ""}
      ${inlineReferences}
    </div>
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
    const refs = showRefs ? referencedCount(tree) : 0;
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
<div class="siyuan-auto-directory__footer">来源：${sourceText} · 不写入正文 · 拖到行上/下缘同级排序，拖到行中间成为子文档</div>`;
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
