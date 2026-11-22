export const DEFAULT_CONFIG = Object.freeze({
    maxDepth: 0,
    defaultExpandedDepth: 4,
    autoExpand: true,
    showChildCount: true,
    showReferencedDocs: true,
    showCreatedTime: false,
    showUpdatedTime: true,
    confirmMove: true,
});

export const PAGE_SIZE = 120;

export const AUTO_EXPAND_LIMIT = 48;

export const PANEL_ATTR = "data-sad-panel";

export const LEGACY_MARKER = "siyuan-auto-directory:start";

export const WS_COMMANDS = new Set([
    "transactions",
    "create",
    "removeDoc",
    "removeDocByID",
    "rename",
    "moveDocs",
    "mount",
    "unmount",
    "reloadDoc",
]);
