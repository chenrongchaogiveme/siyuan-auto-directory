import test from "node:test";
import assert from "node:assert/strict";
import {buildTree} from "../src/tree.js";

const calls = [];
let handleFetch = null;

function response(data) {
    return {code: 0, msg: "", data};
}

function handleApi(url, payload) {
    if (url === "/api/filetree/getHPathByID") {
        return response("/Leaf");
    }
    if (url === "/api/query/sql") {
        return response([]);
    }
    if (url === "/api/filetree/listDocTree") {
        return {
            code: -1,
            msg: `open ${payload.path}: The system cannot find the file specified.`,
            data: null,
        };
    }
    if (url === "/api/filetree/listDocTreeRange") {
        return response({files: [], total: 0});
    }
    if (url === "/api/block/getDocInfo") {
        return response({
            name: "Leaf",
            path: "/Leaf.sy",
            created: "20261117091200",
            updated: "20261117154000",
        });
    }
    return response({});
}

handleFetch = handleApi;
globalThis.__siyuanFetchSyncPost = async (url, payload, headers, process) => {
    calls.push({url, payload, headers, process});
    return handleFetch(url, payload);
};

const {AutoDirectoryPlugin} = await import("../src/plugin.js");

function createPlugin() {
    const plugin = new AutoDirectoryPlugin({});
    plugin.config.showReferencedDocs = false;
    return plugin;
}

function createProtyle() {
    return {
        block: {rootID: "leaf", boxID: "notebook"},
        path: "/leaf.sy",
        element: {isConnected: true},
        contentElement: {},
        wysiwyg: {element: {}},
        options: {},
    };
}

test("fallbackRows keeps the current document when listDocTree fails", async () => {
    calls.length = 0;
    const plugin = createPlugin();
    const rows = await plugin.fallbackRows({
        id: "leaf",
        notebook: "notebook",
        path: "/leaf.sy",
    }, "/Leaf");

    assert.deepEqual(rows, [{
        id: "leaf",
        content: "Leaf",
        hpath: "/Leaf",
        path: "/leaf.sy",
        created: "20261117091200",
        updated: "20261117154000",
    }]);
    const listCall = calls.find((call) => call.url === "/api/filetree/listDocTree");
    assert.ok(listCall);
    assert.equal(listCall.process, false);
    const treeQuery = calls.find((call) => call.url === "/api/query/sql" && call.payload.stmt.includes("FROM blocks"));
    assert.match(treeQuery.payload.stmt, /created, updated/);
});

test("refresh completes when a new leaf document is missing from the SQL index", async () => {
    calls.length = 0;
    const plugin = createPlugin();
    const protyle = createProtyle();

    await assert.doesNotReject(() => plugin.refresh(protyle));

    const listCall = calls.find((call) => call.url === "/api/filetree/listDocTree");
    assert.ok(listCall);
    assert.equal(listCall.process, false);
});

test("mergeDocumentTags attaches tags to tree nodes", async () => {
    const plugin = createPlugin();
    const previous = handleFetch;
    handleFetch = (url) => {
        if (url === "/api/query/sql") {
            return response([
                {root_id: "a", tag: "#读书#"},
                {root_id: "b", tag: "#工作# #项目#"},
            ]);
        }
        return response({});
    };
    try {
        const tree = buildTree([
            {id: "root", hpath: "/Root", content: "Root"},
            {id: "a", hpath: "/Root/A", content: "A"},
            {id: "b", hpath: "/Root/B", content: "B"},
        ], "root", "/Root");
        await plugin.mergeDocumentTags(tree);
        assert.deepEqual(tree.index.get("a").tags, ["读书"]);
        assert.deepEqual(tree.index.get("b").tags, ["工作", "项目"]);
        assert.deepEqual(tree.index.get("root").tags, []);
    } finally {
        handleFetch = previous;
    }
});

test("togglePin persists the pin list and keeps pinned rows on top", async () => {
    const plugin = createPlugin();
    const saved = [];
    plugin.saveData = async (name, data) => {
        saved.push({name, data});
    };
    const tree = buildTree([
        {id: "root", hpath: "/Root", content: "Root"},
        {id: "a", hpath: "/Root/A", content: "A"},
        {id: "b", hpath: "/Root/B", content: "B"},
    ], "root", "/Root");
    let renders = 0;
    plugin.panels.set("panel", {
        tree,
        signature: "stale",
        render() {
            renders += 1;
        },
    });

    assert.equal(await plugin.togglePin("b"), true);
    assert.deepEqual(saved[0], {name: "pins", data: ["b"]});
    assert.deepEqual(tree.children.map((node) => node.id), ["b", "a"]);
    assert.equal(renders, 1);

    assert.equal(await plugin.togglePin("b"), false);
    assert.deepEqual(saved[1], {name: "pins", data: []});
    assert.deepEqual(tree.children.map((node) => node.id), ["a", "b"]);
    assert.equal(renders, 2);
});
