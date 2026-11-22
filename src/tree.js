import { hashString, text } from "./dom.js";
import { isRowInScope } from "./sql.js";

export function normalizePath(value) {
    const path = text(value).replace(/\\/g, "/").replace(/\/+/g, "/");
    if (!path || path === "/") {
        return "/";
    }
    return "/" + path.replace(/^\/+|\/+$/g, "");
}

export function parentPath(value) {
    const path = normalizePath(value);
    const index = path.lastIndexOf("/");
    return index <= 0 ? "/" : path.slice(0, index);
}

export function countNodes(node) {
    let count = 0;
    (node.children || []).forEach((child) => {
        count += 1 + countNodes(child);
    });
    return count;
}

export function createNode(row, overrides = {}) {
    return {
        id: text(row.id),
        title: text(row.content || row.name || row.title || "未命名文档"),
        hpath: normalizePath(row.hpath || ""),
        path: text(row.path || ""),
        created: text(row.created || ""),
        updated: text(row.updated || ""),
        children: [],
        referenced: false,
        referenceSources: [],
        references: [],
        order: null,
        external: false,
        pinned: false,
        tags: [],
        ...overrides,
    };
}

export function buildTree(rows, rootId, rootHPath, rootPath = "", includeAll = false) {
    const nodes = new Map();
    const scope = normalizePath(rootHPath);

    rows.forEach((row) => {
        if (!row || !row.id) {
            return;
        }
        if (!includeAll && !isRowInScope(row, {rootId, hpath: scope, path: rootPath})) {
            return;
        }
        nodes.set(row.id, createNode(row));
    });

    if (!nodes.has(rootId)) {
        nodes.set(rootId, createNode({
            id: rootId,
            content: "当前文档",
            hpath: scope,
            path: rootPath,
        }));
    }

    const root = nodes.get(rootId);
    const byPath = new Map();
    nodes.forEach((node) => {
        if (node.hpath) {
            byPath.set(node.hpath, node);
        }
    });

    nodes.forEach((node) => {
        if (node.id === rootId) {
            return;
        }
        let parent = node.hpath ? byPath.get(parentPath(node.hpath)) : null;
        if (!parent || parent === node) {
            parent = root;
        }
        if (!parent.children.some((child) => child.id === node.id)) {
            parent.children.push(node);
        }
    });

    Object.defineProperty(root, "index", {value: nodes, enumerable: false});
    sortTree(root);
    return root;
}

export function sortTree(node) {
    node.children.sort((left, right) => {
        const leftPinned = left.pinned === true;
        const rightPinned = right.pinned === true;
        if (leftPinned !== rightPinned) {
            return leftPinned ? -1 : 1;
        }
        if (Number.isFinite(left.order) && Number.isFinite(right.order)) {
            return left.order - right.order;
        }
        if (Number.isFinite(left.order) !== Number.isFinite(right.order)) {
            return Number.isFinite(left.order) ? -1 : 1;
        }
        const leftKey = left.external ? "~" + left.title : (left.hpath || left.title);
        const rightKey = right.external ? "~" + right.title : (right.hpath || right.title);
        return leftKey.localeCompare(rightKey, "zh", {
            numeric: true,
            sensitivity: "base",
        });
    });
    node.children.forEach(sortTree);
}

export function referenceSource(source) {
    if (!source || typeof source !== "object") {
        return null;
    }
    const id = text(source.id);
    const title = text(source.title || source.name);
    const path = text(source.path);
    const hpath = normalizePath(source.hpath || "");
    if (!id && !title && !path && hpath === "/") {
        return null;
    }
    return {id, title, path, hpath};
}

export function markReferenced(tree, ids, source = null) {
    const normalized = referenceSource(source);
    ids.forEach((id) => {
        const node = tree.index.get(id);
        if (node) {
            node.referenced = true;
            if (normalized) {
                const sources = Array.isArray(node.referenceSources) ? node.referenceSources : [];
                if (!sources.some((item) => item.id && item.id === normalized.id)) {
                    sources.push(normalized);
                }
                node.referenceSources = sources;
            }
        }
    });
}

export function addReference(tree, sourceId, info) {
    const sourceNode = findNode(tree, sourceId);
    const targetId = text(info && (info.id || info.targetId));
    if (!sourceNode || !targetId || targetId === sourceNode.id) {
        return null;
    }
    const targetNode = findNode(tree, targetId);
    const entry = {
        id: targetId,
        title: text((info && (info.title || info.content)) || (targetNode && targetNode.title) || "引用文档"),
        hpath: normalizePath((info && info.hpath) || (targetNode && targetNode.hpath) || ""),
        path: text((info && info.path) || (targetNode && targetNode.path) || ""),
        count: Math.max(1, Number(info && info.count) || 1),
        external: !targetNode,
    };
    const existing = sourceNode.references.find((item) => item.id === targetId);
    if (existing) {
        existing.count += entry.count;
        existing.title = entry.title || existing.title;
        existing.hpath = entry.hpath || existing.hpath;
        existing.path = entry.path || existing.path;
        existing.external = entry.external;
    } else {
        sourceNode.references.push(entry);
    }
    sourceNode.references.sort((left, right) => {
        const leftKey = left.external ? "~" + left.title : (left.hpath || left.title);
        const rightKey = right.external ? "~" + right.title : (right.hpath || right.title);
        return leftKey.localeCompare(rightKey, "zh", {numeric: true, sensitivity: "base"});
    });
    if (targetNode) {
        markReferenced(tree, [targetId], {
            id: sourceNode.id,
            title: sourceNode.title,
            hpath: sourceNode.hpath,
            path: sourceNode.path,
        });
    }
    return entry;
}

export function collectParentKeys(tree, notebookId) {
    const keys = new Set();
    tree.index.forEach((node) => {
        if (node.children && node.children.length) {
            keys.add(node.id === notebookId ? "" : node.id);
        }
    });
    return Array.from(keys);
}

export function applyTreeOrder(tree, orderMap) {
    tree.index.forEach((node) => {
        const order = orderMap.get(node.id);
        if (Number.isFinite(order)) {
            node.order = order;
        }
    });
    sortTree(tree);
}

export function applyPinnedNodes(tree, pinnedIds) {
    const pinned = pinnedIds instanceof Set ? pinnedIds : new Set(pinnedIds || []);
    tree.index.forEach((node) => {
        node.pinned = pinned.has(node.id);
    });
    sortTree(tree);
}

export function parseDocumentTags(value) {
    const tags = [];
    text(value).split(/\s+/).forEach((token) => {
        const match = token.match(/^#+(.+?)#*$/);
        const tag = text(match && match[1]).trim();
        if (tag && !tags.includes(tag)) {
            tags.push(tag);
        }
    });
    return tags;
}

export function applyDocumentTags(tree, rows) {
    const tagsById = new Map();
    (rows || []).forEach((row) => {
        const id = text(row && row.root_id);
        if (!id) {
            return;
        }
        const list = tagsById.get(id) || [];
        parseDocumentTags(row.tag).forEach((tag) => {
            if (!list.includes(tag)) {
                list.push(tag);
            }
        });
        tagsById.set(id, list);
    });
    tree.index.forEach((node, id) => {
        node.tags = tagsById.get(id) || [];
    });
}

export function addExternalNode(tree, info, source = null) {
    if (tree.index.has(info.id)) {
        markReferenced(tree, [info.id], source);
        return;
    }
    const node = createNode({
        id: info.id,
        content: info.title || info.name || info.content || "引用文档",
        hpath: normalizePath(info.hpath || ""),
        path: info.path || "",
        created: info.created || "",
        updated: info.updated || "",
    }, {
        referenced: true,
        external: true,
        referenceSources: source ? [referenceSource(source)].filter(Boolean) : [],
    });
    tree.children.push(node);
    tree.index.set(node.id, node);
    sortTree(tree);
    return node;
}

export function findNode(tree, id) {
    return tree && tree.index ? tree.index.get(text(id)) : null;
}

export function isNodeUnder(tree, ancestorId, nodeId) {
    const ancestor = findNode(tree, ancestorId);
    if (!ancestor) {
        return false;
    }
    let found = false;
    const visit = (node) => {
        if (found || node.id === nodeId) {
            found = found || node.id === nodeId;
            return;
        }
        (node.children || []).forEach(visit);
    };
    visit(ancestor);
    return found;
}

export function canMoveNode(tree, sourceId, targetId) {
    const source = findNode(tree, sourceId);
    const target = findNode(tree, targetId);
    if (!source || !target || source === target) {
        return false;
    }
    if (source.external || target.external) {
        return false;
    }
    return !isNodeUnder(tree, source.id, target.id);
}

export function collectReferencedIds(editor) {
    const ids = new Set();
    if (!editor || typeof editor.querySelectorAll !== "function") {
        return [];
    }
    editor.querySelectorAll('span[data-type~="block-ref"]').forEach((span) => {
        const subtype = span.getAttribute("data-subtype");
        const id = span.getAttribute("data-id");
        if (id && (subtype === "d" || subtype === "doc")) {
            ids.add(id);
        }
    });
    return Array.from(ids);
}

export function collectReferencedIdsFromProtyle(protyle) {
    const ids = new Set();
    const roots = [
        protyle && protyle.wysiwyg && protyle.wysiwyg.element,
        protyle && protyle.element,
    ].filter(Boolean);
    roots.forEach((root) => {
        collectReferencedIds(root).forEach((id) => ids.add(id));
    });
    return Array.from(ids);
}

export function signature(tree, context, config) {
    const parts = [];
    const visit = (node) => {
        parts.push([
            node.id,
            node.title,
            node.created,
            node.updated,
            node.children.length,
            node.referenced ? 1 : 0,
            node.external ? 1 : 0,
            node.pinned ? 1 : 0,
            (node.tags || []).join("~"),
            (node.referenceSources || []).map((source) => [
                source.id,
                source.title,
                source.path,
                source.hpath,
            ].join("~")).join(","),
            (node.references || []).map((reference) => [
                reference.id,
                reference.title,
                reference.path,
                reference.hpath,
                reference.count,
            ].join("~")).join(","),
        ].join(":"));
        node.children.forEach(visit);
    };
    visit(tree);
    return hashString([
        context.id,
        config.maxDepth,
        config.defaultExpandedDepth,
        config.autoExpand,
        config.showChildCount,
        config.showReferencedDocs,
        config.showDocumentTags,
        config.showCreatedTime,
        config.showUpdatedTime,
        parts.join("|"),
    ].join("::"));
}

export function hasDirectoryContent(tree) {
    return Boolean(tree && tree.children.length);
}

export function flattenVisible(tree, expanded, maxDepth = 0) {
    const rows = [];
    const visit = (node, depth) => {
        rows.push({node, depth});
        if (maxDepth > 0 && depth + 1 >= maxDepth) {
            return;
        }
        node.children.forEach((child) => {
            if (expanded.has(node.id)) {
                visit(child, depth + 1);
            }
        });
    };
    tree.children.forEach((child) => visit(child, 0));
    return rows;
}
