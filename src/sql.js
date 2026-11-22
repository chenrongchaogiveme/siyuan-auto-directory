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

export function buildTreeScope({rootId, hpath, path}) {
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

export function isRowInScope(row, {rootId, hpath, path}) {
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
        if (rowPath === docPath || (directory !== "/" && rowPath.startsWith(directory + "/"))) {
            return true;
        }
    }
    return false;
}
