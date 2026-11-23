import { DEFAULT_CONFIG } from "./constants.js";

export function clampInt(value, min, max, fallback) {
    const number = Number(value);
    if (!Number.isFinite(number)) {
        return fallback;
    }
    return Math.max(min, Math.min(max, Math.round(number)));
}

export function normalizeConfig(input) {
    const source = input && typeof input === "object" ? input : {};
    return {
        maxDepth: clampInt(source.maxDepth, 0, 50, DEFAULT_CONFIG.maxDepth),
        defaultExpandedDepth: clampInt(source.defaultExpandedDepth, 0, 50, DEFAULT_CONFIG.defaultExpandedDepth),
        autoExpand: source.autoExpand !== false,
        showChildCount: source.showChildCount !== false,
        showReferencedDocs: source.showReferencedDocs !== false,
        hideIndexedReferences: source.hideIndexedReferences !== false,
        showDocumentTags: source.showDocumentTags !== false,
        showCreatedTime: source.showCreatedTime === true,
        showUpdatedTime: source.showUpdatedTime !== false,
        confirmMove: source.confirmMove !== false,
    };
}
