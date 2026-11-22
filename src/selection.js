import { text } from "./dom.js";

export function createSelection() {
    return new Set();
}

export function setSelected(selection, id, selected) {
    const key = text(id);
    if (!key) {
        return selection;
    }
    if (selected) {
        selection.add(key);
    } else {
        selection.delete(key);
    }
    return selection;
}

export function pruneSelection(selection, tree) {
    const valid = new Set();
    if (tree && tree.index) {
        tree.index.forEach((_node, id) => valid.add(id));
    }
    Array.from(selection).forEach((id) => {
        if (!valid.has(id) || id === (tree && tree.id)) {
            selection.delete(id);
        }
    });
    return selection;
}

export function selectedNodes(tree, selection) {
    const nodes = [];
    if (!tree || !tree.index) {
        return nodes;
    }
    selection.forEach((id) => {
        const node = tree.index.get(id);
        if (node && node.id !== tree.id) {
            nodes.push(node);
        }
    });
    return nodes;
}

export function allSelectableIds(tree) {
    const ids = [];
    if (!tree || !tree.index) {
        return ids;
    }
    tree.index.forEach((node) => {
        if (node.id !== tree.id) {
            ids.push(node.id);
        }
    });
    return ids;
}
