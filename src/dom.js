export function text(value, fallback = "") {
    return value == null ? fallback : String(value);
}

export function documentIdOf(protyle) {
    const block = (protyle && protyle.block) || {};
    return text(block.rootID || block.id || (protyle && protyle.blockId));
}

export function isCurrentDocument(protyle, documentId) {
    const currentId = documentIdOf(protyle);
    return !currentId || !documentId || currentId === text(documentId);
}

export function contextsDiffer(previous, next) {
    const previousId = text(previous && previous.id);
    const nextId = text(next && next.id);
    return Boolean(previousId && nextId && previousId !== nextId);
}

export function escapeHtml(value) {
    return text(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

export function hashString(value) {
    const source = text(value);
    let hash = 2166136261;
    for (let index = 0; index < source.length; index += 1) {
        hash ^= source.charCodeAt(index);
        hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(36);
}

export function editorElement(protyle) {
    return (protyle && protyle.wysiwyg && protyle.wysiwyg.element) ||
        (protyle && protyle.element && protyle.element.querySelector(".protyle-wysiwyg")) ||
        null;
}

export function contentElement(protyle) {
    return (protyle && protyle.contentElement) ||
        (protyle && protyle.element && protyle.element.querySelector(".protyle-content")) ||
        null;
}

export function isUsableProtyle(protyle) {
    if (!protyle || !protyle.element || !protyle.element.isConnected) {
        return false;
    }
    const options = protyle.options || {};
    if (options.backlinkData) {
        return false;
    }
    if (Array.isArray(options.action) && options.action.includes("cb-get-history")) {
        return false;
    }
    return Boolean(editorElement(protyle) && contentElement(protyle));
}

export function cssEscape(value) {
    if (typeof CSS !== "undefined" && typeof CSS.escape === "function") {
        return CSS.escape(text(value));
    }
    return text(value).replace(/["\\]/g, "\\$&");
}
