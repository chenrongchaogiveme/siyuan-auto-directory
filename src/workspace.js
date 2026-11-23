import { text } from "./dom.js";

export const WORKSPACE_LIMIT = 400;

function breadcrumbOf(node) {
    const parts = [node.notebook];
    node.parentPath.split("/").filter(Boolean).forEach((part) => parts.push(part));
    return parts.filter(Boolean).join(" / ");
}

function parentIdFromPath(path) {
    const parts = text(path).split("/").filter(Boolean);
    return parts.length > 1 ? parts[parts.length - 2] : "";
}

function assignDepth(node, depth, parentKey) {
    node.depth = depth;
    node.parentKey = parentKey;
    node.children.forEach((child) => assignDepth(child, depth + 1, node.key));
}

function sortSiblings(nodes) {
    nodes.sort((left, right) => (left.sort - right.sort)
        || left.hpath.localeCompare(right.hpath, "zh-CN")
        || (left.created - right.created)
        || left.id.localeCompare(right.id));
    nodes.forEach((node) => sortSiblings(node.children));
}

function sortOf(row, sortMaps) {
    const map = sortMaps && sortMaps[text(row.box)];
    if (map && Object.prototype.hasOwnProperty.call(map, row.id)) {
        const value = Number(map[row.id]);
        if (Number.isFinite(value)) {
            return value;
        }
    }
    const fallback = Number(row.sort);
    return Number.isFinite(fallback) ? fallback : 0;
}

export function buildWorkspaceForest(rows, notebooks, sortMaps) {
    const notebookNames = new Map();
    const notebookOrder = new Map();
    (Array.isArray(notebooks) ? notebooks : []).forEach((notebook, index) => {
        if (notebook && notebook.id) {
            const id = text(notebook.id);
            notebookNames.set(id, text(notebook.name) || id);
            notebookOrder.set(id, index);
        }
    });

    const boxes = new Map();
    const ensureBox = (boxId) => {
        if (!boxes.has(boxId)) {
            boxes.set(boxId, {
                key: `box:${boxId}`,
                id: boxId,
                title: notebookNames.get(boxId) || boxId,
                hpath: "/",
                box: boxId,
                notebook: notebookNames.get(boxId) || boxId,
                parentPath: "",
                isNotebook: true,
                depth: 0,
                parentKey: "",
                children: [],
                byId: new Map(),
                byHpath: new Map(),
                nodes: [],
            });
        }
        return boxes.get(boxId);
    };

    (Array.isArray(rows) ? rows : []).forEach((row) => {
        if (!row || !row.id) {
            return;
        }
        const boxId = text(row.box) || "unknown";
        const box = ensureBox(boxId);
        if (text(row.id) === boxId) {
            if (!notebookNames.has(boxId) && text(row.content)) {
                box.title = text(row.content);
                box.notebook = box.title;
            }
            return;
        }
        const hpath = text(row.hpath);
        const segments = hpath.split("/").filter(Boolean);
        const node = {
            key: text(row.id),
            id: text(row.id),
            title: text(row.content) || segments[segments.length - 1] || "未命名文档",
            hpath,
            box: box.box,
            notebook: box.title,
            parentPath: segments.length > 1 ? "/" + segments.slice(0, -1).join("/") : "",
            parentId: parentIdFromPath(row.path),
            isNotebook: false,
            depth: 0,
            parentKey: "",
            sort: sortOf(row, sortMaps),
            created: Number(row.created) || 0,
            children: [],
        };
        box.byId.set(node.id, node);
        if (hpath && !box.byHpath.has(hpath)) {
            box.byHpath.set(hpath, node);
        }
        box.nodes.push(node);
    });

    Array.from(boxes.values()).forEach((box) => {
        box.nodes.forEach((node) => {
            const parent = (node.parentId ? box.byId.get(node.parentId) : null)
                || (node.parentPath ? box.byHpath.get(node.parentPath) : null);
            if (parent && parent !== node) {
                parent.children.push(node);
            } else {
                box.children.push(node);
            }
        });
    });

    const forest = Array.from(boxes.values())
        .filter((box) => box.children.length)
        .sort((left, right) => {
            const leftOrder = notebookOrder.has(left.box) ? notebookOrder.get(left.box) : Number.MAX_SAFE_INTEGER;
            const rightOrder = notebookOrder.has(right.box) ? notebookOrder.get(right.box) : Number.MAX_SAFE_INTEGER;
            return (leftOrder - rightOrder) || left.title.localeCompare(right.title, "zh-CN");
        });

    forest.forEach((box) => {
        sortSiblings(box.children);
        box.children.forEach((child) => assignDepth(child, 1, box.key));
        delete box.byId;
        delete box.byHpath;
        delete box.nodes;
    });
    return forest;
}

export function countDocuments(forest) {
    let total = 0;
    const walk = (node) => {
        if (!node.isNotebook) {
            total += 1;
        }
        node.children.forEach(walk);
    };
    (Array.isArray(forest) ? forest : []).forEach(walk);
    return total;
}

export function findAncestorKeys(forest, id) {
    const target = text(id);
    if (!target) {
        return [];
    }
    const visit = (node, chain) => {
        if (node.id && node.id === target) {
            return chain.concat(node.key);
        }
        for (const child of node.children) {
            const found = visit(child, chain.concat(node.key));
            if (found) {
                return found;
            }
        }
        return null;
    };
    for (const box of Array.isArray(forest) ? forest : []) {
        const found = visit(box, []);
        if (found) {
            return found;
        }
    }
    return [];
}

export function searchWorkspaceRows(forest, query, limit = WORKSPACE_LIMIT) {
    const keyword = text(query).trim().toLowerCase();
    const rows = [];
    if (!keyword) {
        return rows;
    }
    const walk = (node) => {
        if (rows.length >= limit) {
            return;
        }
        if (!node.isNotebook
            && (node.title.toLowerCase().includes(keyword) || node.hpath.toLowerCase().includes(keyword))) {
            rows.push({
                key: node.key,
                id: node.id,
                title: node.title,
                depth: 0,
                hasChildren: false,
                expanded: false,
                isNotebook: false,
                current: false,
                sub: breadcrumbOf(node),
            });
        }
        node.children.forEach(walk);
    };
    (Array.isArray(forest) ? forest : []).forEach(walk);
    return rows;
}