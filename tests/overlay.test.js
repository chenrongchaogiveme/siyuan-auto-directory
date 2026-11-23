import test from "node:test";
import assert from "node:assert/strict";
import {filterRows, flattenTree} from "../src/overlay.js";
import {addExternalNode, buildTree} from "../src/tree.js";

function tree() {
    return buildTree([
        {id: "root", hpath: "/Root", content: "Root"},
        {id: "a", hpath: "/Root/A", content: "A"},
        {id: "a1", hpath: "/Root/A/A1", content: "A1"},
        {id: "b", hpath: "/Root/B", content: "B"},
    ], "root", "/Root");
}

test("flattenTree lists real documents in order with depth", () => {
    const rows = flattenTree(tree());
    assert.deepEqual(rows.map((row) => row.id), ["a", "a1", "b"]);
    assert.deepEqual(rows.map((row) => row.depth), [0, 1, 0]);
    assert.equal(rows[1].hpath, "/Root/A/A1");
});

test("flattenTree skips external reference nodes", () => {
    const model = tree();
    addExternalNode(model, {id: "ext", title: "Ext", hpath: "/Other/Ext", path: "/Other/Ext.sy"});
    const rows = flattenTree(model);
    assert.equal(rows.some((row) => row.id === "ext"), false);
    assert.equal(rows.length, 3);
});

test("filterRows matches titles and paths", () => {
    const rows = flattenTree(tree());
    assert.deepEqual(filterRows(rows, "a1").map((row) => row.id), ["a1"]);
    assert.deepEqual(filterRows(rows, "/root/b").map((row) => row.id), ["b"]);
    assert.deepEqual(filterRows(rows, "  ").map((row) => row.id), ["a", "a1", "b"]);
    assert.equal(filterRows(rows, "zzz").length, 0);
});