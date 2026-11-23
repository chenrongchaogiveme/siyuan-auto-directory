import { fetchSyncPost } from "siyuan";
import { LEGACY_MARKER } from "./constants.js";
import { buildTreeScope } from "./sql.js";

export function responseData(response) {
    if (!response || response.code !== 0) {
        throw new Error((response && response.msg) || "思源 API 请求失败");
    }
    return response.data;
}

async function readPost(path, payload) {
    return post(path, payload, true);
}

export async function post(path, payload, silent = false) {
    const response = silent
        ? await fetchSyncPost(path, payload || {}, undefined, false)
        : await fetchSyncPost(path, payload || {});
    return responseData(response);
}

export function escapeSql(value) {
    return String(value == null ? "" : value).replace(/'/g, "''");
}

export function escapeLike(value) {
    return String(value == null ? "" : value).replace(/[\\%_]/g, (match) => "\\" + match);
}

export function getHPath(id) {
    return readPost("/api/filetree/getHPathByID", {id});
}

export function getDocInfo(id) {
    return readPost("/api/block/getDocInfo", {id});
}

export function getDocPath(id) {
    return readPost("/api/filetree/getPathByID", {id});
}

export async function queryDocRows(ids) {
    const unique = Array.from(new Set((ids || []).filter(Boolean)));
    if (!unique.length) {
        return [];
    }
    const quoted = unique.map((id) => `'${escapeSql(id)}'`).join(",");
    const rows = await readPost("/api/query/sql", {
        stmt: `SELECT id, hpath, path, content, created, updated FROM blocks WHERE type = 'd' AND id IN (${quoted})`,
    });
    return Array.isArray(rows) ? rows : [];
}

export async function queryTreeRows(notebook, hpath, path, rootId, includeAll = false) {
    const box = escapeSql(notebook);
    const scope = includeAll ? "" : buildTreeScope({rootId, hpath, path});
    const rows = await readPost("/api/query/sql", {
        stmt: `SELECT id, hpath, path, content, created, updated, sort FROM blocks WHERE type = 'd' AND box = '${box}' ${scope} ORDER BY hpath ASC`,
    });
    if (!Array.isArray(rows)) {
        throw new Error("SQL 返回格式异常");
    }
    return rows;
}

export async function queryReferenceRows(sourceIds) {
    const unique = Array.from(new Set((sourceIds || []).filter(Boolean)));
    if (!unique.length) {
        return [];
    }
    const rows = [];
    for (let index = 0; index < unique.length; index += 200) {
        const chunk = unique.slice(index, index + 200);
        const quoted = chunk.map((id) => `'${escapeSql(id)}'`).join(",");
        const result = await readPost("/api/query/sql", {
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
LIMIT 5000`,
        });
        if (Array.isArray(result)) {
            rows.push(...result);
        }
    }
    return rows;
}

export async function queryIncomingReferenceRows(targetIds) {
    const unique = Array.from(new Set((targetIds || []).filter(Boolean)));
    if (!unique.length) {
        return [];
    }
    const rows = [];
    for (let index = 0; index < unique.length; index += 200) {
        const chunk = unique.slice(index, index + 200);
        const quoted = chunk.map((id) => `'${escapeSql(id)}'`).join(",");
        const result = await readPost("/api/query/sql", {
            stmt: `SELECT
  r.root_id AS source_id,
  CASE
    WHEN r.def_block_root_id IS NOT NULL AND r.def_block_root_id <> '' THEN r.def_block_root_id
    ELSE r.def_block_id
  END AS target_id,
  COUNT(*) AS reference_count,
  MAX(COALESCE(b.content, r.content, '')) AS source_title,
  MAX(COALESCE(b.hpath, '')) AS source_hpath,
  MAX(COALESCE(b.path, r.def_block_path, '')) AS source_path
FROM refs r
LEFT JOIN blocks b ON b.id = r.root_id
WHERE CASE
    WHEN r.def_block_root_id IS NOT NULL AND r.def_block_root_id <> '' THEN r.def_block_root_id
    ELSE r.def_block_id
  END IN (${quoted})
GROUP BY r.root_id, target_id
ORDER BY target_id, source_hpath, source_title
LIMIT 5000`,
        });
        if (Array.isArray(result)) {
            rows.push(...result);
        }
    }
    return rows;
}
export async function queryTagRows(ids) {
    const unique = Array.from(new Set((ids || []).filter(Boolean)));
    if (!unique.length) {
        return [];
    }
    const rows = [];
    for (let index = 0; index < unique.length; index += 200) {
        const chunk = unique.slice(index, index + 200);
        const quoted = chunk.map((id) => `'${escapeSql(id)}'`).join(",");
        const result = await readPost("/api/query/sql", {
            stmt: `SELECT root_id, tag FROM blocks
WHERE root_id IN (${quoted}) AND tag IS NOT NULL AND tag <> ''
GROUP BY root_id, tag
ORDER BY root_id, MIN(id)
LIMIT 5000`,
        });
        if (Array.isArray(result)) {
            rows.push(...result);
        }
    }
    return rows;
}

export async function listDocTree(notebook, path, silent = false) {
    const data = await post("/api/filetree/listDocTree", {notebook, path}, silent);
    return Array.isArray(data) ? data : (data && Array.isArray(data.tree) ? data.tree : []);
}

export function listDocTreeRange(notebook, parentID, offset = 0, limit = 500) {
    return readPost("/api/filetree/listDocTreeRange", {notebook, parentID, offset, limit});
}

export async function findLegacyBlocks(docId) {
    const rows = await readPost("/api/query/sql", {
        stmt: `SELECT id FROM blocks WHERE root_id = '${escapeSql(docId)}' AND markdown LIKE '%${LEGACY_MARKER}%'`,
    });
    return Array.isArray(rows) ? rows.map((row) => row.id).filter(Boolean) : [];
}

export function removeDocuments(paths) {
    return post("/api/filetree/removeDocs", {paths});
}

export function moveDocsByID(fromIDs, toID) {
    return post("/api/filetree/moveDocsByID", {fromIDs, toID});
}

export function reorderDocs(sourceIDs, targetID, position) {
    return post("/api/filetree/reorderDocs", {
        sourceIDs,
        targetID,
        position,
        respectSort: true,
    });
}

export function deleteBlock(id) {
    return post("/api/block/deleteBlock", {id});
}

export function reloadUi() {
    return post("/api/ui/reloadUI", {});
}
