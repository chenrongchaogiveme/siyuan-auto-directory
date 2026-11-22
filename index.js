var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/constants.js
var DEFAULT_CONFIG, PAGE_SIZE, AUTO_EXPAND_LIMIT, PANEL_ATTR, LEGACY_MARKER, WS_COMMANDS;
var init_constants = __esm({
  "src/constants.js"() {
    DEFAULT_CONFIG = Object.freeze({
      maxDepth: 0,
      defaultExpandedDepth: 4,
      autoExpand: true,
      showChildCount: true,
      showReferencedDocs: true,
      showCreatedTime: false,
      showUpdatedTime: true,
      confirmMove: true
    });
    PAGE_SIZE = 120;
    AUTO_EXPAND_LIMIT = 48;
    PANEL_ATTR = "data-sad-panel";
    LEGACY_MARKER = "siyuan-auto-directory:start";
    WS_COMMANDS = /* @__PURE__ */ new Set([
      "transactions",
      "create",
      "removeDoc",
      "removeDocByID",
      "rename",
      "moveDocs",
      "mount",
      "unmount",
      "reloadDoc"
    ]);
  }
});

// src/config.js
function clampInt(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return fallback;
  }
  return Math.max(min, Math.min(max, Math.round(number)));
}
function normalizeConfig(input) {
  const source = input && typeof input === "object" ? input : {};
  return {
    maxDepth: clampInt(source.maxDepth, 0, 50, DEFAULT_CONFIG.maxDepth),
    defaultExpandedDepth: clampInt(source.defaultExpandedDepth, 0, 50, DEFAULT_CONFIG.defaultExpandedDepth),
    autoExpand: source.autoExpand !== false,
    showChildCount: source.showChildCount !== false,
    showReferencedDocs: source.showReferencedDocs !== false,
    showCreatedTime: source.showCreatedTime === true,
    showUpdatedTime: source.showUpdatedTime !== false,
    confirmMove: source.confirmMove !== false
  };
}
var init_config = __esm({
  "src/config.js"() {
    init_constants();
  }
});

// src/settings.js
var settings_exports = {};
__export(settings_exports, {
  openSettingsDialog: () => openSettingsDialog
});
function openSettingsDialog(config, saveConfig, reloadPanels) {
  const content = `<div class="b3-dialog__content sad-settings">
  <label class="sad-settings__field">
    <span class="sad-settings__label">\u6700\u5927\u76EE\u5F55\u5C42\u7EA7</span>
    <span class="sad-settings__hint">0 = \u4E0D\u9650\u5236</span>
    <input class="b3-text-field fn__block" id="sad-max-depth" type="number" min="0" max="50" value="${config.maxDepth}">
  </label>
  <label class="sad-settings__field">
    <span class="sad-settings__label">\u9ED8\u8BA4\u5C55\u5F00\u5C42\u7EA7</span>
    <span class="sad-settings__hint">\u4EC5\u5728\u5F00\u542F\u201C\u9ED8\u8BA4\u5C55\u5F00\u76EE\u5F55\u201D\u65F6\u751F\u6548</span>
    <input class="b3-text-field fn__block" id="sad-expanded-depth" type="number" min="0" max="50" value="${config.defaultExpandedDepth}">
  </label>
  <div class="sad-settings__divider"></div>
  <label class="sad-settings__toggle">
    <span class="sad-settings__toggle-text">
      <span class="sad-settings__label">\u9ED8\u8BA4\u5C55\u5F00\u76EE\u5F55</span>
      <span class="sad-settings__hint">\u5173\u95ED\u540E\u9996\u6B21\u663E\u793A\u5168\u90E8\u6536\u8D77\uFF0C\u9002\u5408\u6587\u6863\u5F88\u591A\u6216\u5C42\u7EA7\u5F88\u6DF1\u7684\u60C5\u51B5\u3002</span>
    </span>
    <input id="sad-auto-expand" type="checkbox" class="b3-switch" ${config.autoExpand !== false ? "checked" : ""}>
  </label>
  <label class="sad-settings__toggle">
    <span class="sad-settings__toggle-text">
      <span class="sad-settings__label">\u663E\u793A\u5B50\u6587\u6863\u6570\u91CF</span>
      <span class="sad-settings__hint">\u5728\u6BCF\u4E2A\u53EF\u5C55\u5F00\u76EE\u5F55\u9879\u53F3\u4FA7\u663E\u793A\u76F4\u63A5\u5B50\u6587\u6863\u6570\u3002</span>
    </span>
    <input id="sad-show-count" type="checkbox" class="b3-switch" ${config.showChildCount ? "checked" : ""}>
  </label>
  <label class="sad-settings__toggle">
    <span class="sad-settings__toggle-text">
      <span class="sad-settings__label">\u663E\u793A\u6700\u540E\u4FEE\u6539\u65F6\u95F4</span>
      <span class="sad-settings__hint">\u5728\u76EE\u5F55\u884C\u53F3\u4FA7\u663E\u793A\u6587\u6863\u6700\u540E\u4FEE\u6539\u65F6\u95F4\u3002</span>
    </span>
    <input id="sad-show-updated-time" type="checkbox" class="b3-switch" ${config.showUpdatedTime !== false ? "checked" : ""}>
  </label>
  <label class="sad-settings__toggle">
    <span class="sad-settings__toggle-text">
      <span class="sad-settings__label">\u663E\u793A\u521B\u5EFA\u65F6\u95F4</span>
      <span class="sad-settings__hint">\u5173\u95ED\u65F6\u4ECD\u53EF\u5728\u6807\u9898\u60AC\u505C\u63D0\u793A\u4E2D\u67E5\u770B\uFF1B\u5F00\u542F\u540E\u663E\u793A\u5728\u6807\u9898\u4E0B\u65B9\u3002</span>
    </span>
    <input id="sad-show-created-time" type="checkbox" class="b3-switch" ${config.showCreatedTime === true ? "checked" : ""}>
  </label>
  <label class="sad-settings__toggle">
    <span class="sad-settings__toggle-text">
      <span class="sad-settings__label">\u663E\u793A\u6B63\u6587\u5F15\u7528\u7684\u6587\u6863</span>
      <span class="sad-settings__hint">\u5173\u95ED\u540E\u53EA\u663E\u793A\u771F\u5B9E\u5B50\u6587\u6863\uFF1B\u5F00\u542F\u65F6\u5F15\u7528\u6309\u6765\u6E90\u7B14\u8BB0\u884C\u5185\u5C55\u793A\uFF0C\u9ED8\u8BA4\u4EC5\u663E\u793A\u4E24\u6761\u3002</span>
    </span>
    <input id="sad-show-references" type="checkbox" class="b3-switch" ${config.showReferencedDocs !== false ? "checked" : ""}>
  </label>
  <label class="sad-settings__toggle">
    <span class="sad-settings__toggle-text">
      <span class="sad-settings__label">\u79FB\u52A8\u524D\u786E\u8BA4</span>
      <span class="sad-settings__hint">\u62D6\u62FD\u79FB\u52A8\u65F6\u5148\u786E\u8BA4\uFF1B\u53EF\u5728\u786E\u8BA4\u6846\u4E2D\u52FE\u9009\u201C\u4E0D\u518D\u63D0\u793A\u201D\uFF0C\u518D\u4ECE\u8FD9\u91CC\u91CD\u65B0\u5F00\u542F\u3002</span>
    </span>
    <input id="sad-confirm-move" type="checkbox" class="b3-switch" ${config.confirmMove !== false ? "checked" : ""}>
  </label>
  <div class="sad-settings__note">
    \u6709\u5B50\u6587\u6863\u6216\u6B63\u6587\u5F15\u7528\u6587\u6863\u65F6\u81EA\u52A8\u663E\u793A\uFF0C\u4E0D\u518D\u533A\u5206\u7A7A\u767D\u6587\u6863\u3002<br>
    \u76EE\u5F55\u662F\u9605\u8BFB\u8F85\u52A9\u6D6E\u5C42\uFF0C\u4E0D\u4F1A\u5199\u5165\u6B63\u6587\uFF1B\u65E7\u7248\u76EE\u5F55\u5757\u53EF\u5728\u9762\u677F\u9876\u90E8\u6E05\u7406\u3002
  </div>
</div>
<div class="b3-dialog__action">
  <button class="b3-button b3-button--outline" data-sad-reload>\u91CD\u8F7D\u76EE\u5F55</button>
  <div class="fn__space"></div>
  <button class="b3-button b3-button--cancel" data-sad-cancel>\u53D6\u6D88</button>
  <div class="fn__space"></div>
  <button class="b3-button b3-button--text" data-sad-save>\u4FDD\u5B58</button>
</div>`;
  const dialog = new import_siyuan4.Dialog({
    title: "\u81EA\u52A8\u76EE\u5F55\u8BBE\u7F6E",
    content,
    width: "500px",
    height: "auto"
  });
  const close = dialog.element.querySelector("[data-sad-cancel]");
  const save = dialog.element.querySelector("[data-sad-save]");
  const reload = dialog.element.querySelector("[data-sad-reload]");
  if (close) {
    close.addEventListener("click", () => dialog.destroy());
  }
  if (reload && reloadPanels) {
    reload.addEventListener("click", async () => {
      reload.disabled = true;
      try {
        await reloadPanels();
        (0, import_siyuan4.showMessage)("\u76EE\u5F55\u5DF2\u91CD\u65B0\u52A0\u8F7D");
      } catch (error) {
        console.error("[siyuan-auto-directory] \u91CD\u8F7D\u76EE\u5F55\u5931\u8D25", error);
        (0, import_siyuan4.showMessage)("\u91CD\u8F7D\u76EE\u5F55\u5931\u8D25\uFF1A" + error.message);
      } finally {
        reload.disabled = false;
      }
    });
  }
  if (!save) {
    return dialog;
  }
  const autoExpand = dialog.element.querySelector("#sad-auto-expand");
  const expandedDepth = dialog.element.querySelector("#sad-expanded-depth");
  const syncDepthState = () => {
    if (autoExpand && expandedDepth) {
      expandedDepth.disabled = !autoExpand.checked;
    }
  };
  if (autoExpand) {
    autoExpand.addEventListener("change", syncDepthState);
    syncDepthState();
  }
  save.addEventListener("click", async () => {
    const number = (selector, fallback) => {
      const input = dialog.element.querySelector(selector);
      return input ? clampInt(input.value, 0, 50, fallback) : fallback;
    };
    const count = dialog.element.querySelector("#sad-show-count");
    const updatedTime = dialog.element.querySelector("#sad-show-updated-time");
    const createdTime = dialog.element.querySelector("#sad-show-created-time");
    const references = dialog.element.querySelector("#sad-show-references");
    const moveConfirm = dialog.element.querySelector("#sad-confirm-move");
    const next = normalizeConfig({
      maxDepth: number("#sad-max-depth", config.maxDepth),
      defaultExpandedDepth: number("#sad-expanded-depth", config.defaultExpandedDepth),
      autoExpand: autoExpand ? autoExpand.checked : config.autoExpand,
      showChildCount: count ? count.checked : config.showChildCount,
      showUpdatedTime: updatedTime ? updatedTime.checked : config.showUpdatedTime,
      showCreatedTime: createdTime ? createdTime.checked : config.showCreatedTime,
      showReferencedDocs: references ? references.checked : config.showReferencedDocs,
      confirmMove: moveConfirm ? moveConfirm.checked : config.confirmMove
    });
    try {
      await saveConfig(next);
      dialog.destroy();
    } catch (error) {
      console.error("[siyuan-auto-directory] \u4FDD\u5B58\u8BBE\u7F6E\u5931\u8D25", error);
      (0, import_siyuan4.showMessage)("\u4FDD\u5B58\u8BBE\u7F6E\u5931\u8D25\uFF1A" + error.message);
    }
  });
  return dialog;
}
var import_siyuan4;
var init_settings = __esm({
  "src/settings.js"() {
    import_siyuan4 = require("siyuan");
    init_config();
  }
});

// src/entry.js
var entry_exports = {};
__export(entry_exports, {
  default: () => entry_default
});
module.exports = __toCommonJS(entry_exports);

// src/plugin.js
var import_siyuan5 = require("siyuan");

// src/api.js
var import_siyuan = require("siyuan");
init_constants();

// src/sql.js
function normalizeHPath(value) {
  const path = String(value == null ? "" : value).replace(/\\/g, "/").replace(/\/+/g, "/");
  if (!path || path === "/") {
    return "/";
  }
  return "/" + path.replace(/^\/+|\/+$/g, "");
}
function normalizeDocPath(value) {
  const path = String(value == null ? "" : value).trim().replace(/\\/g, "/");
  if (!path) {
    return "";
  }
  return "/" + path.replace(/^\/+|\/+$/g, "");
}
function escapeSql(value) {
  return String(value == null ? "" : value).replace(/'/g, "''");
}
function escapeLike(value) {
  return String(value == null ? "" : value).replace(/[\\%_]/g, (match) => "\\" + match);
}
function buildTreeScope({ rootId, hpath, path }) {
  const clauses = [];
  if (rootId) {
    clauses.push(`id = '${escapeSql(rootId)}'`);
  }
  const scope = normalizeHPath(hpath);
  if (scope !== "/") {
    clauses.push(`hpath = '${escapeSql(scope)}'`);
    clauses.push(`hpath LIKE '${escapeSql(escapeLike(scope))}/%' ESCAPE '\\'`);
  }
  const docPath = normalizeDocPath(path);
  if (docPath) {
    clauses.push(`path = '${escapeSql(docPath)}'`);
    const directory = docPath.replace(/\.sy$/i, "");
    if (directory && directory !== "/") {
      clauses.push(`path LIKE '${escapeSql(escapeLike(directory))}/%' ESCAPE '\\'`);
    }
  }
  return clauses.length ? `AND (${Array.from(new Set(clauses)).join(" OR ")})` : "";
}
function isRowInScope(row, { rootId, hpath, path }) {
  if (!row || !row.id) {
    return false;
  }
  if (rootId && row.id === rootId) {
    return true;
  }
  const scope = normalizeHPath(hpath);
  if (scope !== "/") {
    const rowHPath = normalizeHPath(row.hpath);
    if (rowHPath === scope || rowHPath.startsWith(scope + "/")) {
      return true;
    }
  }
  const docPath = normalizeDocPath(path);
  if (docPath) {
    const rowPath = normalizeDocPath(row.path);
    const directory = docPath.replace(/\.sy$/i, "");
    if (rowPath === docPath || directory !== "/" && rowPath.startsWith(directory + "/")) {
      return true;
    }
  }
  return false;
}

// src/api.js
function responseData(response) {
  if (!response || response.code !== 0) {
    throw new Error(response && response.msg || "\u601D\u6E90 API \u8BF7\u6C42\u5931\u8D25");
  }
  return response.data;
}
async function post(path, payload, silent = false) {
  const response = silent ? await (0, import_siyuan.fetchSyncPost)(path, payload || {}, void 0, false) : await (0, import_siyuan.fetchSyncPost)(path, payload || {});
  return responseData(response);
}
function escapeSql2(value) {
  return String(value == null ? "" : value).replace(/'/g, "''");
}
function getHPath(id) {
  return post("/api/filetree/getHPathByID", { id });
}
function getDocInfo(id) {
  return post("/api/block/getDocInfo", { id });
}
function getDocPath(id) {
  return post("/api/filetree/getPathByID", { id });
}
async function queryDocRows(ids) {
  const unique = Array.from(new Set((ids || []).filter(Boolean)));
  if (!unique.length) {
    return [];
  }
  const quoted = unique.map((id) => `'${escapeSql2(id)}'`).join(",");
  const rows = await post("/api/query/sql", {
    stmt: `SELECT id, hpath, path, content, created, updated FROM blocks WHERE type = 'd' AND id IN (${quoted})`
  });
  return Array.isArray(rows) ? rows : [];
}
async function queryTreeRows(notebook, hpath, path, rootId, includeAll = false) {
  const box = escapeSql2(notebook);
  const scope = includeAll ? "" : buildTreeScope({ rootId, hpath, path });
  const rows = await post("/api/query/sql", {
    stmt: `SELECT id, hpath, path, content, created, updated, sort FROM blocks WHERE type = 'd' AND box = '${box}' ${scope} ORDER BY hpath ASC`
  });
  if (!Array.isArray(rows)) {
    throw new Error("SQL \u8FD4\u56DE\u683C\u5F0F\u5F02\u5E38");
  }
  return rows;
}
async function queryReferenceRows(sourceIds) {
  const unique = Array.from(new Set((sourceIds || []).filter(Boolean)));
  if (!unique.length) {
    return [];
  }
  const rows = [];
  for (let index = 0; index < unique.length; index += 200) {
    const chunk = unique.slice(index, index + 200);
    const quoted = chunk.map((id) => `'${escapeSql2(id)}'`).join(",");
    const result = await post("/api/query/sql", {
      stmt: `SELECT
  r.root_id AS source_id,
  CASE
    WHEN r.def_block_root_id IS NOT NULL AND r.def_block_root_id <> '' THEN r.def_block_root_id
    ELSE r.def_block_id
  END AS target_id,
  COUNT(*) AS reference_count,
  MAX(COALESCE(b.content, r.content, '')) AS target_title,
  MAX(COALESCE(b.hpath, '')) AS target_hpath,
  MAX(COALESCE(b.path, r.def_block_path, '')) AS target_path
FROM refs r
LEFT JOIN blocks b ON b.id = CASE
  WHEN r.def_block_root_id IS NOT NULL AND r.def_block_root_id <> '' THEN r.def_block_root_id
  ELSE r.def_block_id
END
WHERE r.root_id IN (${quoted})
GROUP BY r.root_id, target_id
ORDER BY r.root_id, target_hpath, target_title
LIMIT 5000`
    });
    if (Array.isArray(result)) {
      rows.push(...result);
    }
  }
  return rows;
}
async function listDocTree(notebook, path, silent = false) {
  const data = await post("/api/filetree/listDocTree", { notebook, path }, silent);
  return Array.isArray(data) ? data : data && Array.isArray(data.tree) ? data.tree : [];
}
function listDocTreeRange(notebook, parentID, offset = 0, limit = 500) {
  return post("/api/filetree/listDocTreeRange", { notebook, parentID, offset, limit });
}
async function findLegacyBlocks(docId) {
  const rows = await post("/api/query/sql", {
    stmt: `SELECT id FROM blocks WHERE root_id = '${escapeSql2(docId)}' AND markdown LIKE '%${LEGACY_MARKER}%'`
  });
  return Array.isArray(rows) ? rows.map((row) => row.id).filter(Boolean) : [];
}
function removeDocuments(paths) {
  return post("/api/filetree/removeDocs", { paths });
}
function moveDocsByID(fromIDs, toID) {
  return post("/api/filetree/moveDocsByID", { fromIDs, toID });
}
function reorderDocs(sourceIDs, targetID, position) {
  return post("/api/filetree/reorderDocs", {
    sourceIDs,
    targetID,
    position,
    respectSort: true
  });
}
function deleteBlock(id) {
  return post("/api/block/deleteBlock", { id });
}

// src/plugin.js
init_constants();
init_config();

// src/dom.js
function text(value, fallback = "") {
  return value == null ? fallback : String(value);
}
function documentIdOf(protyle) {
  const block = protyle && protyle.block || {};
  return text(block.rootID || block.id || protyle && protyle.blockId);
}
function isCurrentDocument(protyle, documentId) {
  const currentId = documentIdOf(protyle);
  return !currentId || !documentId || currentId === text(documentId);
}
function contextsDiffer(previous, next) {
  const previousId = text(previous && previous.id);
  const nextId = text(next && next.id);
  return Boolean(previousId && nextId && previousId !== nextId);
}
function escapeHtml(value) {
  return text(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function hashString(value) {
  const source = text(value);
  let hash = 2166136261;
  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}
function editorElement(protyle) {
  return protyle && protyle.wysiwyg && protyle.wysiwyg.element || protyle && protyle.element && protyle.element.querySelector(".protyle-wysiwyg") || null;
}
function contentElement(protyle) {
  return protyle && protyle.contentElement || protyle && protyle.element && protyle.element.querySelector(".protyle-content") || null;
}
function isUsableProtyle(protyle) {
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
function cssEscape(value) {
  if (typeof CSS !== "undefined" && typeof CSS.escape === "function") {
    return CSS.escape(text(value));
  }
  return text(value).replace(/["\\]/g, "\\$&");
}

// src/legacy.js
async function loadLegacyBlocks(docId) {
  try {
    return await findLegacyBlocks(docId);
  } catch (error) {
    console.warn("[siyuan-auto-directory] \u68C0\u67E5\u65E7\u7248\u76EE\u5F55\u5757\u5931\u8D25", error);
    return [];
  }
}
async function removeLegacyBlocks(ids) {
  const unique = Array.from(new Set((ids || []).filter(Boolean)));
  for (const id of unique) {
    await deleteBlock(id);
  }
  return unique.length;
}

// src/navigation.js
var NAVIGATION_LIMIT = 10;
function appendNavigationOrigin(stack, origin, targetId, limit = NAVIGATION_LIMIT) {
  const target = text(targetId);
  const originId = text(origin && origin.id);
  const entries = (Array.isArray(stack) ? stack : []).map((entry) => ({
    id: text(entry && entry.id),
    title: text(entry && entry.title)
  })).filter((entry) => entry.id && entry.id !== target);
  if (!target || !originId || originId === target) {
    return entries;
  }
  entries.push({
    id: originId,
    title: text(origin && origin.title) || originId
  });
  return entries.slice(-Math.max(1, limit));
}

// src/panel.js
var import_siyuan3 = require("siyuan");
init_constants();

// src/move-dialog.js
var import_siyuan2 = require("siyuan");
function showMoveConfirm(options, onConfirm) {
  const sourceTitle = options && options.sourceTitle ? options.sourceTitle : "\u6587\u6863";
  const targetTitle = options && options.targetTitle ? options.targetTitle : "\u76EE\u6807\u6587\u6863";
  const relation = options && options.relation ? options.relation : "";
  const dialog = new import_siyuan2.Dialog({
    title: "\u79FB\u52A8\u6587\u6863",
    content: `<div class="b3-dialog__content sad-move-confirm">
  <div class="sad-move-confirm__message">
    \u5C06\u300C${escapeHtml(sourceTitle)}\u300D\u79FB\u52A8\u5230\u300C${escapeHtml(targetTitle)}\u300D${escapeHtml(relation)}\u3002
  </div>
  <label class="sad-move-confirm__option">
    <span class="sad-move-confirm__option-text">
      <span class="sad-move-confirm__option-title">\u4E4B\u540E\u4E0D\u518D\u63D0\u793A</span>
      <span class="sad-move-confirm__option-hint">\u9700\u8981\u6062\u590D\u65F6\uFF0C\u53EF\u5728\u201C\u81EA\u52A8\u76EE\u5F55\u8BBE\u7F6E\u201D\u4E2D\u91CD\u65B0\u5F00\u542F\u201C\u79FB\u52A8\u524D\u786E\u8BA4\u201D\u3002</span>
    </span>
    <input id="sad-move-dont-ask" type="checkbox" class="b3-switch">
  </label>
</div>
<div class="b3-dialog__action">
  <button class="b3-button b3-button--cancel" data-sad-move-cancel>\u53D6\u6D88</button>
  <div class="fn__space"></div>
  <button class="b3-button b3-button--text" data-sad-move-confirm>\u79FB\u52A8</button>
</div>`,
    width: "460px",
    height: "auto"
  });
  const cancel = dialog.element.querySelector("[data-sad-move-cancel]");
  const confirm2 = dialog.element.querySelector("[data-sad-move-confirm]");
  const dontAsk = dialog.element.querySelector("#sad-move-dont-ask");
  if (cancel) {
    cancel.addEventListener("click", () => dialog.destroy());
  }
  if (confirm2) {
    confirm2.addEventListener("click", () => {
      confirm2.disabled = true;
      const skipNextTime = Boolean(dontAsk && dontAsk.checked);
      dialog.destroy();
      onConfirm({ dontAsk: skipNextTime });
    });
  }
  return dialog;
}

// src/renderer.js
init_constants();

// src/selection.js
function setSelected(selection, id, selected) {
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
function pruneSelection(selection, tree) {
  const valid = /* @__PURE__ */ new Set();
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
function selectedNodes(tree, selection) {
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
function allSelectableIds(tree) {
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

// src/time.js
function pad2(value) {
  return String(value).padStart(2, "0");
}
function localDate(year, month, day, hour = 0, minute = 0, second = 0) {
  const date = new Date(year, month - 1, day, hour, minute, second);
  if (date.getFullYear() !== year || date.getMonth() + 1 !== month || date.getDate() !== day || date.getHours() !== hour || date.getMinutes() !== minute) {
    return null;
  }
  return date;
}
function parseDateTime(value) {
  const raw = text(value).trim();
  if (!raw) {
    return null;
  }
  const compact = raw.match(/^(\d{4})(\d{2})(\d{2})(\d{2})?(\d{2})?(\d{2})?$/);
  if (compact) {
    const date = localDate(
      Number(compact[1]),
      Number(compact[2]),
      Number(compact[3]),
      Number(compact[4] || 0),
      Number(compact[5] || 0),
      Number(compact[6] || 0)
    );
    if (date) {
      return date;
    }
  }
  const separated = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
  if (separated) {
    const date = localDate(
      Number(separated[1]),
      Number(separated[2]),
      Number(separated[3]),
      Number(separated[4] || 0),
      Number(separated[5] || 0),
      Number(separated[6] || 0)
    );
    if (date) {
      return date;
    }
  }
  if (/^\d{10}$/.test(raw)) {
    return new Date(Number(raw) * 1e3);
  }
  if (/^\d{13}$/.test(raw)) {
    return new Date(Number(raw));
  }
  const timestamp = Date.parse(raw);
  return Number.isNaN(timestamp) ? null : new Date(timestamp);
}
function formatDateTime(value) {
  const date = parseDateTime(value);
  if (!date || Number.isNaN(date.getTime())) {
    return "";
  }
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())} ${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

// src/tree.js
function normalizePath(value) {
  const path = text(value).replace(/\\/g, "/").replace(/\/+/g, "/");
  if (!path || path === "/") {
    return "/";
  }
  return "/" + path.replace(/^\/+|\/+$/g, "");
}
function parentPath(value) {
  const path = normalizePath(value);
  const index = path.lastIndexOf("/");
  return index <= 0 ? "/" : path.slice(0, index);
}
function countNodes(node) {
  let count = 0;
  (node.children || []).forEach((child) => {
    count += 1 + countNodes(child);
  });
  return count;
}
function createNode(row, overrides = {}) {
  return {
    id: text(row.id),
    title: text(row.content || row.name || row.title || "\u672A\u547D\u540D\u6587\u6863"),
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
    ...overrides
  };
}
function buildTree(rows, rootId, rootHPath, rootPath = "", includeAll = false) {
  const nodes = /* @__PURE__ */ new Map();
  const scope = normalizePath(rootHPath);
  rows.forEach((row) => {
    if (!row || !row.id) {
      return;
    }
    if (!includeAll && !isRowInScope(row, { rootId, hpath: scope, path: rootPath })) {
      return;
    }
    nodes.set(row.id, createNode(row));
  });
  if (!nodes.has(rootId)) {
    nodes.set(rootId, createNode({
      id: rootId,
      content: "\u5F53\u524D\u6587\u6863",
      hpath: scope,
      path: rootPath
    }));
  }
  const root = nodes.get(rootId);
  const byPath = /* @__PURE__ */ new Map();
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
  Object.defineProperty(root, "index", { value: nodes, enumerable: false });
  sortTree(root);
  return root;
}
function sortTree(node) {
  node.children.sort((left, right) => {
    if (Number.isFinite(left.order) && Number.isFinite(right.order)) {
      return left.order - right.order;
    }
    if (Number.isFinite(left.order) !== Number.isFinite(right.order)) {
      return Number.isFinite(left.order) ? -1 : 1;
    }
    const leftKey = left.external ? "~" + left.title : left.hpath || left.title;
    const rightKey = right.external ? "~" + right.title : right.hpath || right.title;
    return leftKey.localeCompare(rightKey, "zh", {
      numeric: true,
      sensitivity: "base"
    });
  });
  node.children.forEach(sortTree);
}
function referenceSource(source) {
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
  return { id, title, path, hpath };
}
function markReferenced(tree, ids, source = null) {
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
function addReference(tree, sourceId, info) {
  const sourceNode = findNode(tree, sourceId);
  const targetId = text(info && (info.id || info.targetId));
  if (!sourceNode || !targetId || targetId === sourceNode.id) {
    return null;
  }
  const targetNode = findNode(tree, targetId);
  const entry = {
    id: targetId,
    title: text(info && (info.title || info.content) || targetNode && targetNode.title || "\u5F15\u7528\u6587\u6863"),
    hpath: normalizePath(info && info.hpath || targetNode && targetNode.hpath || ""),
    path: text(info && info.path || targetNode && targetNode.path || ""),
    count: Math.max(1, Number(info && info.count) || 1),
    external: !targetNode
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
    const leftKey = left.external ? "~" + left.title : left.hpath || left.title;
    const rightKey = right.external ? "~" + right.title : right.hpath || right.title;
    return leftKey.localeCompare(rightKey, "zh", { numeric: true, sensitivity: "base" });
  });
  if (targetNode) {
    markReferenced(tree, [targetId], {
      id: sourceNode.id,
      title: sourceNode.title,
      hpath: sourceNode.hpath,
      path: sourceNode.path
    });
  }
  return entry;
}
function collectParentKeys(tree, notebookId) {
  const keys = /* @__PURE__ */ new Set();
  tree.index.forEach((node) => {
    if (node.children && node.children.length) {
      keys.add(node.id === notebookId ? "" : node.id);
    }
  });
  return Array.from(keys);
}
function applyTreeOrder(tree, orderMap) {
  tree.index.forEach((node) => {
    const order = orderMap.get(node.id);
    if (Number.isFinite(order)) {
      node.order = order;
    }
  });
  sortTree(tree);
}
function findNode(tree, id) {
  return tree && tree.index ? tree.index.get(text(id)) : null;
}
function isNodeUnder(tree, ancestorId, nodeId) {
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
function canMoveNode(tree, sourceId, targetId) {
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
function collectReferencedIds(editor) {
  const ids = /* @__PURE__ */ new Set();
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
function collectReferencedIdsFromProtyle(protyle) {
  const ids = /* @__PURE__ */ new Set();
  const roots = [
    protyle && protyle.wysiwyg && protyle.wysiwyg.element,
    protyle && protyle.element
  ].filter(Boolean);
  roots.forEach((root) => {
    collectReferencedIds(root).forEach((id) => ids.add(id));
  });
  return Array.from(ids);
}
function signature(tree, context, config) {
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
      (node.referenceSources || []).map((source) => [
        source.id,
        source.title,
        source.path,
        source.hpath
      ].join("~")).join(","),
      (node.references || []).map((reference) => [
        reference.id,
        reference.title,
        reference.path,
        reference.hpath,
        reference.count
      ].join("~")).join(",")
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
    config.showCreatedTime,
    config.showUpdatedTime,
    parts.join("|")
  ].join("::"));
}
function hasDirectoryContent(tree) {
  return Boolean(tree && tree.children.length);
}

// src/renderer.js
var INLINE_REFERENCE_LIMIT = 2;
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
  return `<button class="siyuan-auto-directory__more" type="button" data-sad-more="${escapeHtml(parentId)}">\u52A0\u8F7D\u66F4\u591A\uFF08\u5269\u4F59 ${remaining} \u7BC7\uFF09</button>`;
}
function referenceOrigin(node) {
  if (node.hpath && node.hpath !== "/") {
    return node.hpath;
  }
  return node.path || "\u672A\u77E5\u8DEF\u5F84";
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
  const toggle = hidden > 0 ? `<button class="siyuan-auto-directory__ref-more" type="button" data-sad-more-refs="${escapeHtml(key)}">+${hidden}</button>` : expanded && references.length > INLINE_REFERENCE_LIMIT ? `<button class="siyuan-auto-directory__ref-more" type="button" data-sad-more-refs="${escapeHtml(key)}">\u6536\u8D77</button>` : "";
  return `<span class="siyuan-auto-directory__inline-refs">
      <span class="siyuan-auto-directory__ref-label">${escapeHtml(label)}</span>
      ${visible.map((reference) => `<button class="siyuan-auto-directory__ref-link${reference.external ? " is-external" : ""}" type="button" data-sad-open="${escapeHtml(reference.id)}" title="\u6253\u5F00\u5F15\u7528\u6587\u6863\uFF1A${escapeHtml(reference.title || referenceOrigin(reference))}\uFF08${escapeHtml(referenceOrigin(reference))}\uFF09">${escapeHtml(referenceOrigin(reference))}</button>`).join("")}
      ${toggle}
    </span>`;
}
function renderInlineReferences(node, state, label = "\u5F15\u7528\u4E86") {
  const references = node.references || [];
  if (!references.length) {
    return "";
  }
  return renderReferenceLine(state, referenceKey("out", node.id), label, references);
}
function renderNavigation(tree, state) {
  const trail = state.navigation && Array.isArray(state.navigation.trail) ? state.navigation.trail : [];
  if (!trail.length) {
    return "";
  }
  const back = trail[trail.length - 1];
  const currentTitle = text(tree && tree.title) || "\u5F53\u524D\u6587\u6863";
  const items = trail.map((entry) => {
    const title = text(entry && entry.title) || "\u4E0A\u7EA7\u76EE\u5F55";
    const id = text(entry && entry.id);
    return `<button class="siyuan-auto-directory__nav-link" type="button" data-sad-navigate-to="${escapeHtml(id)}" title="\u8FD4\u56DE\u76EE\u5F55\uFF1A${escapeHtml(title)}">${escapeHtml(title)}</button><span class="siyuan-auto-directory__nav-separator" aria-hidden="true">\u203A</span>`;
  }).join("");
  return `<nav class="siyuan-auto-directory__navigation" aria-label="\u76EE\u5F55\u5BFC\u822A">
  <button class="siyuan-auto-directory__nav-back" type="button" data-sad-navigate-to="${escapeHtml(back.id)}" title="\u8FD4\u56DE\u4E0A\u7EA7\u76EE\u5F55\uFF1A${escapeHtml(back.title || "\u4E0A\u7EA7\u76EE\u5F55")}">
    <span aria-hidden="true">\u2190</span><span>\u8FD4\u56DE\u4E0A\u7EA7</span>
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
  const references = showReferencedDocs ? node.references || [] : [];
  const hasChildren = children.length > 0;
  const expanded = hasChildren && state.expanded.has(node.id);
  const selected = state.selection.has(node.id);
  const count = config.showChildCount && hasChildren ? `<span class="siyuan-auto-directory__count" title="\u76F4\u63A5\u5B50\u6587\u6863\u6570">${children.length}</span>` : "";
  const badge = showReferencedDocs && node.referenced ? node.external ? `<span class="siyuan-auto-directory__badge siyuan-auto-directory__badge--external" title="\u5F53\u524D\u6587\u6863\u5F15\u7528\u4E86\u6811\u5916\u6587\u6863">\u5916\u90E8\u5F15\u7528</span>` : `<span class="siyuan-auto-directory__badge" title="\u5176\u4ED6\u76EE\u5F55\u7B14\u8BB0\u5F15\u7528\u4E86\u8FD9\u4E2A\u6587\u6863">\u88AB\u5F15\u7528</span>` : "";
  const inlineReferences = references.length ? renderInlineReferences(node, state) : "";
  const createdTime = formatDateTime(node.created);
  const updatedTime = formatDateTime(node.updated);
  const createdText = createdTime ? `\u521B\u5EFA ${createdTime}` : "";
  const updatedText = updatedTime ? `\u4FEE\u6539 ${updatedTime}` : "";
  const timeDetail = [createdText, updatedText].filter(Boolean).join(" \xB7 ");
  const showCreatedTime = config.showCreatedTime === true && createdText;
  const showUpdatedTime = config.showUpdatedTime !== false && updatedText;
  const openTitle = `\u6253\u5F00\uFF1A${node.title}${timeDetail ? `
${timeDetail}` : ""}`;
  const draggable = !node.external;
  const branch = expanded ? `<div class="siyuan-auto-directory__branch" data-sad-branch="${escapeHtml(node.id)}">${renderRows(children, depth + 1, state, config, node.id)}</div>` : "";
  const toggle = hasChildren ? `<button class="siyuan-auto-directory__toggle" type="button" data-sad-toggle="${escapeHtml(node.id)}" aria-expanded="${expanded}" aria-label="${expanded ? "\u6536\u8D77" : "\u5C55\u5F00"}\uFF1A${escapeHtml(node.title)}">
      <svg aria-hidden="true"><use xlink:href="#iconRight"></use></svg>
    </button>` : `<span class="siyuan-auto-directory__toggle" aria-hidden="true"></span>`;
  return `<div class="siyuan-auto-directory__node" data-sad-node="${escapeHtml(node.id)}" data-sad-depth="${depth}">
  <div class="siyuan-auto-directory__row${selected ? " is-selected" : ""}${node.external ? " is-external" : ""}" data-sad-row="${escapeHtml(node.id)}" draggable="${draggable}" data-sad-draggable="${draggable}"${draggable ? ' title="\u62D6\u5230\u884C\u4E0A/\u4E0B\u7F18\u540C\u7EA7\u6392\u5E8F\uFF0C\u62D6\u5230\u884C\u4E2D\u95F4\u6210\u4E3A\u5B50\u6587\u6863"' : ""}>
    <label class="siyuan-auto-directory__check" title="\u9009\u62E9\uFF1A${escapeHtml(node.title)}">
      <input type="checkbox" data-sad-select="${escapeHtml(node.id)}" ${selected ? "checked" : ""} aria-label="\u9009\u62E9\uFF1A${escapeHtml(node.title)}">
    </label>
    ${toggle}
    <div class="siyuan-auto-directory__row-main">
      <button class="siyuan-auto-directory__name" type="button" data-sad-open="${escapeHtml(node.id)}" title="${escapeHtml(openTitle)}">${escapeHtml(node.title)}</button>
      ${showCreatedTime ? `<span class="siyuan-auto-directory__meta" title="${escapeHtml(timeDetail)}">${escapeHtml(createdText)}</span>` : ""}
      ${inlineReferences}
    </div>
    ${showUpdatedTime ? `<span class="siyuan-auto-directory__time" title="\u6700\u540E\u4FEE\u6539\u65F6\u95F4\uFF1A${escapeHtml(updatedTime)}">${escapeHtml(updatedText)}</span>` : ""}
    ${badge}
    ${count}
    <button class="siyuan-auto-directory__delete" type="button" data-sad-delete="${escapeHtml(node.id)}" title="\u5220\u9664\uFF1A${escapeHtml(node.title)}">\u5220\u9664</button>
    <button class="siyuan-auto-directory__open" type="button" data-sad-open="${escapeHtml(node.id)}" title="\u6253\u5F00\uFF1A${escapeHtml(node.title)}" aria-label="\u6253\u5F00\uFF1A${escapeHtml(node.title)}">\u2192</button>
  </div>
  ${branch}
</div>`;
}
function renderPanelHtml(tree, state, config, legacyIds = []) {
  const total = countNodes(tree);
  const selected = state.selection ? state.selection.size : 0;
  const showRefs = config.showReferencedDocs !== false;
  const selectable = allSelectableIds(tree);
  const allChecked = selectable.length > 0 && selectable.every((id) => state.selection.has(id));
  const refs = showRefs ? referencedCount(tree) : 0;
  const scope = config.maxDepth > 0 ? ` \xB7 \u6700\u591A ${config.maxDepth} \u5C42` : "";
  const refText = refs ? ` \xB7 \u5F15\u7528 ${refs} \u7BC7` : "";
  const sourceText = showRefs ? "\u771F\u5B9E\u5B50\u6587\u6863\u5C42\u7EA7 + \u9010\u7BC7\u5F15\u7528" : "\u771F\u5B9E\u5B50\u6587\u6863\u5C42\u7EA7";
  const childNodes = tree.children.filter((node) => !node.external);
  const legacy = legacyIds.length ? `<div class="siyuan-auto-directory__legacy">
  <span>\u68C0\u6D4B\u5230\u65E7\u7248\u76EE\u5F55\u5757 ${legacyIds.length} \u4E2A\u3002\u5F53\u524D\u6811\u5DF2\u6309\u771F\u5B9E\u6587\u6863\u91CD\u65B0\u5408\u5E76\uFF0C\u65E7\u5757\u53EF\u6E05\u7406\u4EE5\u907F\u514D\u91CD\u590D\u3002</span>
  <button type="button" data-sad-action="remove-legacy">\u5220\u9664\u65E7\u5757</button>
</div>` : "";
  const deleteLabel = selected ? `\u5220\u9664\u9009\u4E2D (${selected})` : "\u5220\u9664\u9009\u4E2D";
  return `<div class="siyuan-auto-directory__header">
  <label class="siyuan-auto-directory__select-all" title="\u5168\u9009\u5F53\u524D\u76EE\u5F55">
    <input type="checkbox" data-sad-select-all ${allChecked ? "checked" : ""} ${selectable.length ? "" : "disabled"} aria-label="\u5168\u9009\u5F53\u524D\u76EE\u5F55">
    <span>\u5168\u9009</span>
  </label>
  <span class="siyuan-auto-directory__title">
    <svg class="siyuan-auto-directory__icon" aria-hidden="true"><use xlink:href="#iconList"></use></svg>
    \u76EE\u5F55
  </span>
  <span class="siyuan-auto-directory__status">\u5171 ${total} \u7BC7${refText}${scope}</span>
  <span class="siyuan-auto-directory__actions">
    <button class="siyuan-auto-directory__delete-selected" type="button" data-sad-action="delete-selected" ${selected ? "" : "disabled"}>${deleteLabel}</button>
    <button class="siyuan-auto-directory__action" type="button" data-sad-action="refresh" title="\u5237\u65B0\u76EE\u5F55" aria-label="\u5237\u65B0\u76EE\u5F55">
      <svg aria-hidden="true"><use xlink:href="#iconRefresh"></use></svg>
    </button>
    <button class="siyuan-auto-directory__action" type="button" data-sad-action="settings" title="\u76EE\u5F55\u8BBE\u7F6E" aria-label="\u76EE\u5F55\u8BBE\u7F6E">
      <svg aria-hidden="true"><use xlink:href="#iconSettings"></use></svg>
    </button>
  </span>
</div>
${renderNavigation(tree, state)}
${legacy}
<div class="siyuan-auto-directory__tree">${renderRows(childNodes, 0, state, config, "__root__")}</div>
<div class="siyuan-auto-directory__footer">\u6765\u6E90\uFF1A${sourceText} \xB7 \u4E0D\u5199\u5165\u6B63\u6587 \xB7 \u62D6\u5230\u884C\u4E0A/\u4E0B\u7F18\u540C\u7EA7\u6392\u5E8F\uFF0C\u62D6\u5230\u884C\u4E2D\u95F4\u6210\u4E3A\u5B50\u6587\u6863</div>`;
}
function markSelectionOnElement(element, selection, allIds = []) {
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
    button.textContent = selection.size ? `\u5220\u9664\u9009\u4E2D (${selection.size})` : "\u5220\u9664\u9009\u4E2D";
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

// src/panel.js
function panelElement(protyle) {
  const content = contentElement(protyle);
  const editor = editorElement(protyle);
  if (!content) {
    return { content, editor, element: null };
  }
  let element = content.querySelector(`:scope > [${PANEL_ATTR}="true"]`);
  if (!element) {
    element = document.createElement("div");
    element.className = "siyuan-auto-directory";
    element.setAttribute(PANEL_ATTR, "true");
    content.insertBefore(element, editor || content.firstChild);
  }
  return { content, editor, element };
}
var DirectoryPanel = class {
  constructor(plugin, protyle, context, tree, config, legacyIds = []) {
    this.plugin = plugin;
    this.protyle = protyle;
    this.context = context;
    this.tree = tree;
    this.navigation = this.plugin.navigationFor(context.id);
    this.config = config;
    this.legacyIds = new Set(legacyIds);
    this.expanded = /* @__PURE__ */ new Set();
    this.referenceExpanded = /* @__PURE__ */ new Set();
    this.page = /* @__PURE__ */ new Map();
    this.selection = /* @__PURE__ */ new Set();
    this.hiddenLegacyElements = /* @__PURE__ */ new Set();
    this.seeded = false;
    this.signature = "";
    this.destroyed = false;
    this.observer = null;
    this.observerContent = null;
    this.restoreTimer = null;
    this.dragSourceId = "";
    this.dropTargetId = "";
    this.dropPosition = "";
    this.onClick = this.onClick.bind(this);
    this.onChange = this.onChange.bind(this);
    this.onDragStart = this.onDragStart.bind(this);
    this.onDragOver = this.onDragOver.bind(this);
    this.onDragLeave = this.onDragLeave.bind(this);
    this.onDrop = this.onDrop.bind(this);
    this.onDragEnd = this.onDragEnd.bind(this);
    this.onMutations = this.onMutations.bind(this);
    const placement = panelElement(protyle);
    this.element = placement.element;
    if (!this.element) {
      throw new Error("\u627E\u4E0D\u5230\u601D\u6E90\u7F16\u8F91\u5668\u5BB9\u5668");
    }
    this.element.setAttribute("data-sad-root", context.id);
    this.element.addEventListener("click", this.onClick);
    this.element.addEventListener("change", this.onChange);
    this.element.addEventListener("dragstart", this.onDragStart);
    this.element.addEventListener("dragover", this.onDragOver);
    this.element.addEventListener("dragleave", this.onDragLeave);
    this.element.addEventListener("drop", this.onDrop);
    this.element.addEventListener("dragend", this.onDragEnd);
    this.seedExpanded();
    this.render();
    this.observePlacement();
  }
  seedExpanded() {
    if (this.seeded || this.config.autoExpand === false) {
      return;
    }
    const limit = this.config.defaultExpandedDepth;
    const walk = (node, depth) => {
      (node.children || []).forEach((child) => {
        if (depth < limit && child.children && child.children.length && this.expanded.size < AUTO_EXPAND_LIMIT) {
          this.expanded.add(child.id);
        }
        walk(child, depth + 1);
      });
    };
    walk(this.tree, 0);
    this.seeded = true;
  }
  currentSignature() {
    const trail = this.navigation && Array.isArray(this.navigation.trail) ? this.navigation.trail.map((entry) => text(entry && entry.id)).join(",") : "";
    return signature(this.tree, this.context, this.config) + "|nav:" + trail + "|legacy:" + Array.from(this.legacyIds).sort().join(",");
  }
  update(context, tree, config, legacyIds = []) {
    if (contextsDiffer(this.context, context)) {
      this.expanded.clear();
      this.referenceExpanded.clear();
      this.page.clear();
      this.selection.clear();
      this.seeded = false;
      this.signature = "";
    }
    if (this.config.defaultExpandedDepth !== config.defaultExpandedDepth) {
      this.seeded = false;
    }
    if (this.config.autoExpand !== config.autoExpand) {
      this.seeded = false;
      if (config.autoExpand === false) {
        this.expanded.clear();
      }
    }
    this.context = context;
    this.element.setAttribute("data-sad-root", context.id);
    this.tree = tree;
    this.navigation = this.plugin.navigationFor(context.id);
    this.config = config;
    this.legacyIds = new Set(legacyIds);
    pruneSelection(this.selection, tree);
    this.pruneReferenceExpanded();
    this.seedExpanded();
    const next = this.currentSignature();
    if (next === this.signature) {
      this.ensurePlacement();
      return false;
    }
    this.signature = next;
    this.render();
    return true;
  }
  ensurePlacement() {
    const content = contentElement(this.protyle);
    const editor = editorElement(this.protyle);
    if (!content || !this.element) {
      return;
    }
    if (this.element.parentElement !== content) {
      content.insertBefore(this.element, editor || content.firstChild);
    }
    if (editor && this.element.nextElementSibling !== editor) {
      content.insertBefore(this.element, editor);
    }
    this.observePlacement();
  }
  observePlacement() {
    if (this.destroyed) {
      return;
    }
    const content = contentElement(this.protyle);
    if (!content) {
      return;
    }
    if (!this.observer) {
      this.observer = new MutationObserver(this.onMutations);
    }
    if (this.observerContent !== content) {
      this.observer.disconnect();
      this.observer.observe(content, { childList: true });
      this.observerContent = content;
    }
  }
  onMutations() {
    if (this.destroyed || !this.element) {
      return;
    }
    const content = contentElement(this.protyle);
    const editor = editorElement(this.protyle);
    if (!content) {
      return;
    }
    if (this.element.parentElement === content && (!editor || this.element.nextElementSibling === editor)) {
      return;
    }
    if (!this.restoreTimer) {
      this.restoreTimer = setTimeout(() => {
        this.restoreTimer = null;
        if (!this.destroyed) {
          this.ensurePlacement();
        }
      }, 0);
    }
  }
  render() {
    if (!this.element) {
      return;
    }
    this.element.classList.remove("is-loading");
    this.element.removeAttribute("aria-busy");
    this.ensurePlacement();
    this.element.innerHTML = renderPanelHtml(this.tree, this, this.config, Array.from(this.legacyIds));
    markSelectionOnElement(this.element, this.selection, allSelectableIds(this.tree));
    this.syncLegacyVisibility();
  }
  showLoading(context) {
    if (this.destroyed || !this.element) {
      return;
    }
    const id = text(typeof context === "string" ? context : context && context.id);
    if (id) {
      this.element.setAttribute("data-sad-root", id);
    }
    this.element.setAttribute("aria-busy", "true");
    if (this.element.classList.contains("is-loading") && this.element.querySelector(":scope > .siyuan-auto-directory__loading")) {
      return;
    }
    this.element.classList.add("is-loading");
    const loading = document.createElement("div");
    loading.className = "siyuan-auto-directory__loading";
    loading.setAttribute("role", "status");
    loading.setAttribute("aria-live", "polite");
    loading.innerHTML = '<span class="siyuan-auto-directory__spinner" aria-hidden="true"></span><span>\u6B63\u5728\u52A0\u8F7D\u76EE\u5F55\u2026</span>';
    this.element.appendChild(loading);
  }
  visibleNode(id) {
    return this.tree.index.get(text(id));
  }
  pruneReferenceExpanded() {
    const valid = /* @__PURE__ */ new Set([`out:${this.tree.id}`]);
    this.tree.index.forEach((node) => {
      valid.add(`out:${node.id}`);
      valid.add(`in:${node.id}`);
    });
    this.referenceExpanded.forEach((key) => {
      if (!valid.has(key)) {
        this.referenceExpanded.delete(key);
      }
    });
  }
  syncLegacyVisibility() {
    this.hiddenLegacyElements.forEach((element) => {
      element.classList.remove("sad-legacy-block");
    });
    this.hiddenLegacyElements.clear();
    const editor = editorElement(this.protyle);
    if (!editor || !this.legacyIds.size) {
      return;
    }
    this.legacyIds.forEach((id) => {
      const block = editor.querySelector(`[data-node-id="${cssEscape(id)}"]`);
      if (block) {
        block.classList.add("sad-legacy-block");
        this.hiddenLegacyElements.add(block);
      }
    });
  }
  async onClick(event) {
    const target = event.target;
    if (!target || typeof target.closest !== "function") {
      return;
    }
    const action = target.closest("[data-sad-action]");
    if (action) {
      event.preventDefault();
      event.stopPropagation();
      const name = action.getAttribute("data-sad-action");
      if (name === "refresh") {
        this.signature = "";
        this.plugin.refresh(this.protyle, { force: true });
      } else if (name === "settings") {
        this.plugin.openSetting();
      } else if (name === "delete-selected") {
        await this.deleteSelected();
      } else if (name === "remove-legacy") {
        await this.removeLegacy();
      }
      return;
    }
    const toggle = target.closest("[data-sad-toggle]");
    if (toggle) {
      event.preventDefault();
      event.stopPropagation();
      const id = toggle.getAttribute("data-sad-toggle");
      if (this.expanded.has(id)) {
        this.expanded.delete(id);
      } else {
        this.expanded.add(id);
      }
      this.render();
      return;
    }
    const more = target.closest("[data-sad-more]");
    if (more) {
      event.preventDefault();
      event.stopPropagation();
      const id = more.getAttribute("data-sad-more") || "__root__";
      const current = this.page.get(id) || 0;
      this.page.set(id, current + PAGE_SIZE);
      this.render();
      return;
    }
    const moreReferences = target.closest("[data-sad-more-refs]");
    if (moreReferences) {
      event.preventDefault();
      event.stopPropagation();
      const key = moreReferences.getAttribute("data-sad-more-refs");
      if (key) {
        if (this.referenceExpanded.has(key)) {
          this.referenceExpanded.delete(key);
        } else {
          this.referenceExpanded.add(key);
        }
        this.render();
      }
      return;
    }
    const remove = target.closest("[data-sad-delete]");
    if (remove) {
      event.preventDefault();
      event.stopPropagation();
      await this.confirmDelete([remove.getAttribute("data-sad-delete")]);
      return;
    }
    const open = target.closest("[data-sad-open]");
    if (open) {
      event.preventDefault();
      event.stopPropagation();
      const id = open.getAttribute("data-sad-open");
      if (id) {
        this.plugin.openDocument(id, {
          fromPanel: true,
          context: this.context,
          title: this.tree.title
        });
      }
      return;
    }
    const navigate = target.closest("[data-sad-navigate-to]");
    if (navigate) {
      event.preventDefault();
      event.stopPropagation();
      const id = navigate.getAttribute("data-sad-navigate-to");
      if (id) {
        this.plugin.openDocument(id, { back: true });
      }
    }
  }
  rowFromTarget(target) {
    return target && typeof target.closest === "function" ? target.closest("[data-sad-row]") : null;
  }
  clearDragState() {
    this.dragSourceId = "";
    this.dropTargetId = "";
    this.dropPosition = "";
    if (!this.element) {
      return;
    }
    this.element.querySelectorAll(".is-dragging, .is-drop-target, .is-drop-before, .is-drop-inside, .is-drop-after").forEach((row) => {
      row.classList.remove("is-dragging", "is-drop-target", "is-drop-before", "is-drop-inside", "is-drop-after");
    });
  }
  updateDropTarget(row, position = "") {
    const id = row ? row.getAttribute("data-sad-row") : "";
    if (this.dropTargetId === id && this.dropPosition === position) {
      return;
    }
    this.dropTargetId = id;
    this.dropPosition = position;
    this.element.querySelectorAll(".is-drop-target, .is-drop-before, .is-drop-inside, .is-drop-after").forEach((item) => {
      item.classList.remove("is-drop-target", "is-drop-before", "is-drop-inside", "is-drop-after");
    });
    if (row) {
      row.classList.add("is-drop-target");
      if (position) {
        row.classList.add(`is-drop-${position}`);
      }
    }
  }
  dropPositionForEvent(row, event) {
    const rect = row.getBoundingClientRect();
    const ratio = rect.height > 0 ? (event.clientY - rect.top) / rect.height : 0.5;
    if (ratio < 0.28) {
      return "before";
    }
    if (ratio > 0.72) {
      return "after";
    }
    return "inside";
  }
  onDragStart(event) {
    const row = this.rowFromTarget(event.target);
    if (!row || row.getAttribute("data-sad-draggable") !== "true") {
      event.preventDefault();
      return;
    }
    const id = row.getAttribute("data-sad-row");
    const node = findNode(this.tree, id);
    if (!node || node.external) {
      event.preventDefault();
      return;
    }
    this.dragSourceId = id;
    row.classList.add("is-dragging");
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", id);
    }
  }
  onDragOver(event) {
    const row = this.rowFromTarget(event.target);
    if (!row || !this.dragSourceId) {
      return;
    }
    const targetId = row.getAttribute("data-sad-row");
    const position = this.dropPositionForEvent(row, event);
    if (!canMoveNode(this.tree, this.dragSourceId, targetId)) {
      this.updateDropTarget(null);
      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = "none";
      }
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = "move";
    }
    this.updateDropTarget(row, position);
  }
  onDragLeave(event) {
    const row = this.rowFromTarget(event.target);
    if (!row || event.relatedTarget && row.contains(event.relatedTarget)) {
      return;
    }
    if (row.getAttribute("data-sad-row") === this.dropTargetId) {
      this.updateDropTarget(null);
    }
  }
  onDrop(event) {
    const row = this.rowFromTarget(event.target);
    if (!row || !this.dragSourceId) {
      return;
    }
    const sourceId = this.dragSourceId;
    const position = this.dropPosition;
    const targetId = row.getAttribute("data-sad-row");
    if (!position || !canMoveNode(this.tree, sourceId, targetId)) {
      this.clearDragState();
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    this.clearDragState();
    this.startMove(sourceId, targetId, position);
  }
  onDragEnd() {
    this.clearDragState();
  }
  async startMove(sourceId, targetId, position) {
    const source = findNode(this.tree, sourceId);
    const target = findNode(this.tree, targetId);
    if (!source || !target) {
      return;
    }
    const relation = position === "inside" ? "\u5185\uFF0C\u4F5C\u4E3A\u5B83\u7684\u5B50\u6587\u6863" : position === "before" ? "\u4E0A\u65B9\uFF08\u540C\u4E00\u5C42\u7EA7\uFF09" : "\u4E0B\u65B9\uFF08\u540C\u4E00\u5C42\u7EA7\uFF09";
    if (this.config.confirmMove === false) {
      await this.performMove(source, target, position, relation);
      return;
    }
    showMoveConfirm({
      sourceTitle: source.title,
      targetTitle: target.title,
      relation
    }, async ({ dontAsk }) => {
      if (dontAsk) {
        try {
          await this.plugin.updateConfig({
            ...this.config,
            confirmMove: false
          });
          this.config = this.plugin.config;
        } catch (error) {
          console.error("[siyuan-auto-directory] \u4FDD\u5B58\u79FB\u52A8\u786E\u8BA4\u8BBE\u7F6E\u5931\u8D25", error);
          (0, import_siyuan3.showMessage)("\u79FB\u52A8\u786E\u8BA4\u8BBE\u7F6E\u4FDD\u5B58\u5931\u8D25\uFF1A" + error.message);
        }
      }
      await this.performMove(source, target, position, relation);
    });
  }
  async performMove(source, target, position, relation) {
    try {
      if (position === "inside") {
        await moveDocsByID([source.id], target.id);
      } else {
        const result = await reorderDocs([source.id], target.id, position);
        if (result && result.changed === false) {
          (0, import_siyuan3.showMessage)(result.conflict ? "\u540C\u7EA7\u6392\u5E8F\u5B58\u5728\u81EA\u5B9A\u4E49\u6392\u5E8F\u51B2\u7A81\uFF0C\u8BF7\u5148\u5728\u601D\u6E90\u6587\u6863\u6811\u4E2D\u8C03\u6574\u6392\u5E8F" : "\u76EE\u5F55\u987A\u5E8F\u6CA1\u6709\u53D8\u5316");
          return;
        }
      }
      (0, import_siyuan3.showMessage)(`\u5DF2\u5C06\u300C${source.title}\u300D\u79FB\u52A8\u5230\u300C${target.title}\u300D${relation}`);
      this.selection.delete(source.id);
      this.signature = "";
      this.plugin.refresh(this.protyle, { force: true });
    } catch (error) {
      console.error("[siyuan-auto-directory] \u79FB\u52A8\u6587\u6863\u5931\u8D25", error);
      (0, import_siyuan3.showMessage)("\u79FB\u52A8\u6587\u6863\u5931\u8D25\uFF1A" + error.message);
    }
  }
  onChange(event) {
    const input = event.target;
    if (!input || !input.matches) {
      return;
    }
    if (input.matches("[data-sad-select-all]")) {
      const ids = allSelectableIds(this.tree);
      this.selection.clear();
      if (input.checked) {
        ids.forEach((id2) => this.selection.add(id2));
      }
      markSelectionOnElement(this.element, this.selection, ids);
      return;
    }
    if (!input.matches("[data-sad-select]")) {
      return;
    }
    const id = input.getAttribute("data-sad-select");
    setSelected(this.selection, id, input.checked);
    markSelectionOnElement(this.element, this.selection, allSelectableIds(this.tree));
  }
  async deleteSelected() {
    await this.confirmDelete(Array.from(this.selection));
  }
  async confirmDelete(ids) {
    const nodes = selectedNodes(this.tree, new Set((ids || []).filter(Boolean)));
    if (!nodes.length) {
      return;
    }
    const names = nodes.slice(0, 5).map((node) => `\u300C${node.title}\u300D`).join("\u3001");
    const extra = nodes.length > 5 ? ` \u7B49 ${nodes.length} \u7BC7` : "";
    (0, import_siyuan3.confirm)(
      "\u5220\u9664\u9009\u4E2D\u6587\u6863",
      `\u5C06\u5220\u9664 ${nodes.length} \u7BC7\u6587\u6863\uFF1A${names}${extra}\u3002\u5220\u9664\u540E\u65E0\u6CD5\u5728\u76EE\u5F55\u4E2D\u6062\u590D\uFF0C\u8BF7\u786E\u8BA4\u6587\u6863\u6811\u4E2D\u6CA1\u6709\u9700\u8981\u4FDD\u7559\u7684\u5185\u5BB9\u3002`,
      async () => {
        try {
          const paths = [];
          for (const node of nodes) {
            if (node.path) {
              paths.push(node.path);
              continue;
            }
            const data = await getDocPath(node.id);
            if (data && data.path) {
              paths.push(data.path);
            }
          }
          if (!paths.length) {
            (0, import_siyuan3.showMessage)("\u6CA1\u6709\u627E\u5230\u53EF\u5220\u9664\u7684\u6587\u6863\u8DEF\u5F84");
            return;
          }
          await removeDocuments(paths);
          this.selection.clear();
          (0, import_siyuan3.showMessage)(`\u5DF2\u5220\u9664 ${paths.length} \u7BC7\u6587\u6863`);
          this.signature = "";
          this.plugin.refresh(this.protyle, { force: true });
        } catch (error) {
          console.error("[siyuan-auto-directory] \u5220\u9664\u6587\u6863\u5931\u8D25", error);
          (0, import_siyuan3.showMessage)("\u5220\u9664\u6587\u6863\u5931\u8D25\uFF1A" + error.message);
        }
      }
    );
  }
  async removeLegacy() {
    const ids = Array.from(this.legacyIds);
    if (!ids.length) {
      return;
    }
    (0, import_siyuan3.confirm)(
      "\u6E05\u7406\u65E7\u7248\u76EE\u5F55\u5757",
      `\u5C06\u5220\u9664\u5F53\u524D\u6587\u6863\u4E2D\u7684 ${ids.length} \u4E2A\u65E7\u7248\u76EE\u5F55\u5757\u3002\u65B0\u76EE\u5F55\u4E0D\u4F1A\u5199\u5165\u6B63\u6587\uFF0C\u5220\u9664\u65E7\u5757\u4E0D\u4F1A\u5F71\u54CD\u6587\u6863\u6811\u3002`,
      async () => {
        try {
          await removeLegacyBlocks(ids);
          this.legacyIds.clear();
          this.syncLegacyVisibility();
          (0, import_siyuan3.showMessage)("\u65E7\u7248\u76EE\u5F55\u5757\u5DF2\u6E05\u7406");
          this.render();
          this.plugin.refresh(this.protyle, { force: true });
        } catch (error) {
          console.error("[siyuan-auto-directory] \u6E05\u7406\u65E7\u7248\u76EE\u5F55\u5757\u5931\u8D25", error);
          (0, import_siyuan3.showMessage)("\u6E05\u7406\u65E7\u7248\u76EE\u5F55\u5757\u5931\u8D25\uFF1A" + error.message);
        }
      }
    );
  }
  destroy() {
    this.destroyed = true;
    if (this.restoreTimer) {
      clearTimeout(this.restoreTimer);
      this.restoreTimer = null;
    }
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    this.observerContent = null;
    this.hiddenLegacyElements.forEach((element) => {
      element.classList.remove("sad-legacy-block");
    });
    this.hiddenLegacyElements.clear();
    this.element.removeEventListener("click", this.onClick);
    this.element.removeEventListener("change", this.onChange);
    this.element.removeEventListener("dragstart", this.onDragStart);
    this.element.removeEventListener("dragover", this.onDragOver);
    this.element.removeEventListener("dragleave", this.onDragLeave);
    this.element.removeEventListener("drop", this.onDrop);
    this.element.removeEventListener("dragend", this.onDragEnd);
    this.element.remove();
  }
};

// src/plugin.js
var AutoDirectoryPlugin = class extends import_siyuan5.Plugin {
  constructor(options) {
    super(options);
    this.config = { ...DEFAULT_CONFIG };
    this.panels = /* @__PURE__ */ new Map();
    this.timers = /* @__PURE__ */ new Map();
    this.busy = /* @__PURE__ */ new Set();
    this.pending = /* @__PURE__ */ new Set();
    this.protyles = /* @__PURE__ */ new Set();
    this.navigationStacks = /* @__PURE__ */ new Map();
    this.onProtyleEvent = this.onProtyleEvent.bind(this);
    this.onWsMain = this.onWsMain.bind(this);
  }
  async onload() {
    try {
      const stored = await this.loadData("config");
      this.config = normalizeConfig(stored);
    } catch (error) {
      console.warn("[siyuan-auto-directory] \u8BFB\u53D6\u914D\u7F6E\u5931\u8D25\uFF0C\u4F7F\u7528\u9ED8\u8BA4\u503C", error);
      this.config = { ...DEFAULT_CONFIG };
    }
    this.eventBus.on("loaded-protyle-static", this.onProtyleEvent);
    this.eventBus.on("switch-protyle", this.onProtyleEvent);
    this.eventBus.on("ws-main", this.onWsMain);
    this.addTopBar({
      icon: "iconList",
      title: "\u81EA\u52A8\u76EE\u5F55\u8BBE\u7F6E",
      position: "right",
      callback: () => this.openSetting()
    });
    try {
      (0, import_siyuan5.getAllEditor)().forEach((editor) => this.schedule(editor.protyle, 160));
    } catch (error) {
      console.warn("[siyuan-auto-directory] \u521D\u59CB\u5316\u7F16\u8F91\u5668\u5931\u8D25", error);
    }
  }
  onunload() {
    this.eventBus.off("loaded-protyle-static", this.onProtyleEvent);
    this.eventBus.off("switch-protyle", this.onProtyleEvent);
    this.eventBus.off("ws-main", this.onWsMain);
    this.timers.forEach((timer) => clearTimeout(timer));
    this.timers.clear();
    this.panels.forEach((panel) => panel.destroy());
    this.panels.clear();
    this.busy.clear();
    this.pending.clear();
    this.protyles.clear();
    this.navigationStacks.clear();
  }
  onProtyleEvent(event) {
    const protyle = event && event.detail && event.detail.protyle;
    if (!protyle || !isUsableProtyle(protyle)) {
      return;
    }
    this.protyles.add(protyle);
    const panel = this.panels.get(protyle);
    const currentId = documentIdOf(protyle);
    if (panel && currentId && panel.context.id !== currentId) {
      panel.showLoading(currentId);
    }
    this.schedule(protyle, 80);
  }
  onWsMain(event) {
    const detail = event && event.detail;
    if (!detail || !WS_COMMANDS.has(detail.cmd)) {
      return;
    }
    this.protyles.forEach((protyle) => {
      if (!protyle || !protyle.element || !protyle.element.isConnected) {
        this.disposeProtyle(protyle);
        return;
      }
      this.schedule(protyle, 280);
    });
  }
  disposeProtyle(protyle) {
    const timer = this.timers.get(protyle);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(protyle);
    }
    this.removePanel(protyle);
    this.protyles.delete(protyle);
  }
  schedule(protyle, delay = 120) {
    if (!protyle) {
      return;
    }
    this.protyles.add(protyle);
    const timer = this.timers.get(protyle);
    if (timer) {
      clearTimeout(timer);
    }
    this.timers.set(protyle, setTimeout(() => {
      this.timers.delete(protyle);
      this.refresh(protyle).catch((error) => {
        console.warn("[siyuan-auto-directory] \u5237\u65B0\u76EE\u5F55\u5931\u8D25", error);
      });
    }, delay));
  }
  async resolveContext(protyle) {
    const block = protyle && protyle.block || {};
    let id = documentIdOf(protyle);
    let notebook = text(protyle && protyle.notebookId || block.boxID || block.box);
    let path = text(protyle && protyle.path);
    if (!id) {
      return null;
    }
    if (!notebook || !path) {
      try {
        const info = await getDocPath(id);
        notebook = notebook || text(info && info.notebook);
        path = path || text(info && info.path);
      } catch (error) {
        console.warn("[siyuan-auto-directory] \u89E3\u6790\u6587\u6863\u4F4D\u7F6E\u5931\u8D25", error);
      }
    }
    if (!notebook) {
      return null;
    }
    return { id, notebook, path, protyle };
  }
  async refresh(protyle, options = {}) {
    if (!isUsableProtyle(protyle)) {
      return;
    }
    if (this.busy.has(protyle)) {
      this.pending.add(protyle);
      return;
    }
    const existing = this.panels.get(protyle);
    if (options.force && existing) {
      existing.signature = "";
    }
    const liveId = documentIdOf(protyle);
    if (existing && liveId && existing.context.id !== liveId) {
      existing.showLoading(liveId);
    }
    this.busy.add(protyle);
    try {
      const context = await this.resolveContext(protyle);
      if (!context) {
        this.removePanel(protyle);
        return;
      }
      if (!isCurrentDocument(protyle, context.id)) {
        if (existing) {
          existing.showLoading(documentIdOf(protyle));
        }
        this.schedule(protyle, 30);
        return;
      }
      if (existing && existing.context.id !== context.id) {
        existing.showLoading(context);
      }
      const loaded = await this.loadTree(context, protyle);
      if (!isUsableProtyle(protyle)) {
        return;
      }
      if (!isCurrentDocument(protyle, context.id)) {
        if (existing) {
          existing.showLoading(documentIdOf(protyle));
        }
        this.schedule(protyle, 30);
        return;
      }
      if (!hasDirectoryContent(loaded.tree)) {
        this.removePanel(protyle);
        return;
      }
      this.renderPanel(protyle, context, loaded);
    } finally {
      this.busy.delete(protyle);
      if (this.pending.delete(protyle)) {
        this.schedule(protyle, 50);
      }
    }
  }
  async loadTree(context, protyle) {
    const hpath = normalizePath(await getHPath(context.id));
    const notebookRoot = context.id === context.notebook;
    let rows = [];
    try {
      rows = await queryTreeRows(context.notebook, hpath, context.path, context.id, notebookRoot);
    } catch (error) {
      console.warn("[siyuan-auto-directory] SQL \u6587\u6863\u6811\u67E5\u8BE2\u5931\u8D25\uFF0C\u4F7F\u7528 filetree \u515C\u5E95", error);
    }
    if (!Array.isArray(rows) || !rows.some((row) => row && row.id === context.id)) {
      rows = await this.fallbackRows(context, hpath);
    }
    const tree = buildTree(rows, context.id, hpath, context.path, notebookRoot);
    await this.applyFileTreeOrder(context, tree);
    if (this.config.showReferencedDocs !== false) {
      await this.mergeReferencedDocs(tree, protyle);
    }
    const legacyIds = await loadLegacyBlocks(context.id);
    return { tree, legacyIds };
  }
  async applyFileTreeOrder(context, tree) {
    const orderMap = /* @__PURE__ */ new Map();
    const parentKeys = collectParentKeys(tree, context.notebook);
    for (const parentID of parentKeys) {
      try {
        let offset = 0;
        let total = Infinity;
        while (offset < total) {
          const data = await listDocTreeRange(context.notebook, parentID, offset, 500);
          const files = data && Array.isArray(data.files) ? data.files : [];
          files.forEach((file, index) => {
            if (file && file.id) {
              orderMap.set(file.id, offset + index);
            }
          });
          offset += files.length;
          total = data && Number.isFinite(Number(data.total)) ? Number(data.total) : offset;
          if (!files.length) {
            break;
          }
        }
      } catch (error) {
        console.warn("[siyuan-auto-directory] \u8BFB\u53D6\u76EE\u5F55\u987A\u5E8F\u5931\u8D25", parentID, error);
      }
    }
    if (orderMap.size) {
      applyTreeOrder(tree, orderMap);
    }
  }
  async mergeReferencedDocs(tree, protyle) {
    const sourceIds = Array.from(tree.index.keys());
    let rows = [];
    try {
      rows = await queryReferenceRows(sourceIds);
    } catch (error) {
      console.warn("[siyuan-auto-directory] \u67E5\u8BE2\u5F15\u7528\u6765\u6E90\u5931\u8D25", error);
    }
    rows.forEach((row) => {
      addReference(tree, row.source_id, {
        id: row.target_id,
        title: row.target_title,
        hpath: row.target_hpath,
        path: row.target_path,
        count: row.reference_count
      });
    });
    const root = tree.index.get(tree.id);
    if (root && !root.references.length) {
      await this.mergeDomReferences(tree, protyle);
    }
  }
  async mergeDomReferences(tree, protyle) {
    const root = tree.index.get(tree.id);
    if (!root) {
      return;
    }
    const referenced = collectReferencedIdsFromProtyle(protyle).filter((id) => id && id !== tree.id);
    if (!referenced.length) {
      return;
    }
    let rows = [];
    try {
      rows = await queryDocRows(referenced);
    } catch (error) {
      console.warn("[siyuan-auto-directory] \u67E5\u8BE2 DOM \u5F15\u7528\u6587\u6863\u5931\u8D25", error);
    }
    const byId = new Map(rows.map((row) => [row.id, row]));
    for (const id of referenced) {
      const row = byId.get(id);
      if (row) {
        addReference(tree, tree.id, {
          id: row.id,
          title: row.content,
          hpath: row.hpath,
          path: row.path
        });
        continue;
      }
      try {
        const [info, path] = await Promise.all([
          getDocInfo(id).catch(() => ({})),
          getDocPath(id).catch(() => ({}))
        ]);
        addReference(tree, tree.id, {
          id,
          title: info && (info.name || info.title) || "\u5F15\u7528\u6587\u6863",
          hpath: path && path.hpath,
          path: path && path.path
        });
      } catch (error) {
        console.warn("[siyuan-auto-directory] \u89E3\u6790\u5F15\u7528\u6587\u6863\u5931\u8D25", id, error);
      }
    }
  }
  async fallbackRows(context, hpath) {
    const data = await listDocTree(context.notebook, context.path, true).catch(() => []);
    const ids = [];
    const walk = (nodes) => {
      (nodes || []).forEach((node) => {
        if (node && node.id) {
          ids.push(node.id);
          walk(node.children);
        }
      });
    };
    walk(data);
    const unique = Array.from(new Set(ids));
    const lookupIds = Array.from(/* @__PURE__ */ new Set([...unique, context.id]));
    let metaRows = [];
    try {
      metaRows = await queryDocRows(lookupIds);
    } catch {
    }
    const metaById = new Map(metaRows.map((row) => [row.id, row]));
    const rows = await Promise.all(unique.map(async (id) => {
      const [info, path] = await Promise.all([
        getDocInfo(id).catch(() => ({})),
        getHPath(id).catch(() => "")
      ]);
      const meta = metaById.get(id) || {};
      return {
        id,
        content: info && (info.name || info.title) || "",
        hpath: normalizePath(path || ""),
        path: text(info && info.path),
        created: text(meta.created || info && info.created),
        updated: text(meta.updated || info && info.updated)
      };
    }));
    try {
      const info = await getDocInfo(context.id);
      const meta = metaById.get(context.id) || {};
      rows.push({
        id: context.id,
        content: text(info && info.name) || "\u5F53\u524D\u6587\u6863",
        hpath,
        path: context.path,
        created: text(meta.created || info && info.created),
        updated: text(meta.updated || info && info.updated)
      });
    } catch (error) {
      const meta = metaById.get(context.id) || {};
      rows.push({
        id: context.id,
        content: "\u5F53\u524D\u6587\u6863",
        hpath,
        path: context.path,
        created: text(meta.created),
        updated: text(meta.updated)
      });
    }
    return rows;
  }
  renderPanel(protyle, context, loaded) {
    const panel = this.panels.get(protyle);
    if (panel) {
      panel.update(context, loaded.tree, this.config, loaded.legacyIds);
      return;
    }
    const next = new DirectoryPanel(
      this,
      protyle,
      context,
      loaded.tree,
      this.config,
      loaded.legacyIds
    );
    next.signature = next.currentSignature();
    this.panels.set(protyle, next);
  }
  reloadPanels() {
    this.panels.forEach((panel) => panel.ensurePlacement());
    this.protyles.forEach((protyle) => this.schedule(protyle, 0));
  }
  rememberNavigation(context, title, targetId) {
    const target = text(targetId);
    if (!target) {
      return;
    }
    const stack = appendNavigationOrigin(
      this.navigationStacks.get(text(context && context.id)),
      { id: context && context.id, title },
      target
    );
    if (stack.length) {
      this.navigationStacks.set(target, stack);
    } else {
      this.navigationStacks.delete(target);
    }
  }
  navigationFor(documentId) {
    const stack = this.navigationStacks.get(text(documentId)) || [];
    return { trail: stack.slice(-4) };
  }
  removePanel(protyle) {
    const panel = this.panels.get(protyle);
    if (!panel) {
      return;
    }
    panel.destroy();
    this.panels.delete(protyle);
  }
  openDocument(id, options = {}) {
    const targetId = text(id);
    if (!targetId) {
      return;
    }
    if (!options.back && options.fromPanel && options.context) {
      this.rememberNavigation(options.context, options.title, targetId);
    }
    try {
      (0, import_siyuan5.openTab)({ app: this.app, doc: { id: targetId, action: ["cb-get-all"] } });
    } catch (error) {
      console.error("[siyuan-auto-directory] \u6253\u5F00\u6587\u6863\u5931\u8D25", error);
      (0, import_siyuan5.showMessage)("\u6253\u5F00\u6587\u6863\u5931\u8D25\uFF1A" + error.message);
    }
  }
  openSetting() {
    Promise.resolve().then(() => (init_settings(), settings_exports)).then(({ openSettingsDialog: openSettingsDialog2 }) => {
      openSettingsDialog2(this.config, async (next) => {
        await this.updateConfig(next);
        this.panels.forEach((panel) => {
          panel.signature = "";
        });
        (0, import_siyuan5.showMessage)("\u81EA\u52A8\u76EE\u5F55\u8BBE\u7F6E\u5DF2\u4FDD\u5B58");
        this.protyles.forEach((protyle) => this.schedule(protyle, 60));
      }, async () => {
        this.reloadPanels();
      });
    }).catch((error) => {
      console.error("[siyuan-auto-directory] \u6253\u5F00\u8BBE\u7F6E\u5931\u8D25", error);
      (0, import_siyuan5.showMessage)("\u6253\u5F00\u8BBE\u7F6E\u5931\u8D25\uFF1A" + error.message);
    });
  }
  async updateConfig(next) {
    const normalized = normalizeConfig(next);
    await this.saveData("config", normalized);
    this.config = normalized;
    this.panels.forEach((panel) => {
      panel.config = normalized;
    });
    return normalized;
  }
};

// src/entry.js
var entry_default = AutoDirectoryPlugin;
if (module.exports && module.exports.default) { module.exports = module.exports.default; }
