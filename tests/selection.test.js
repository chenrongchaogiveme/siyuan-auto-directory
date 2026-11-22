import test from "node:test";
import assert from "node:assert/strict";
import {allSelectableIds, pruneSelection, selectedNodes, setSelected} from "../src/selection.js";
import {buildTree} from "../src/tree.js";

test("selection keeps valid non-root ids", () => {
    const tree = buildTree([
        {id: "root", hpath: "/Root", content: "Root"},
        {id: "a", hpath: "/Root/A", content: "A"},
    ], "root", "/Root");
    const selection = new Set(["root", "a", "missing"]);
    pruneSelection(selection, tree);
    assert.deepEqual(Array.from(selection), ["a"]);
    assert.deepEqual(selectedNodes(tree, selection).map((node) => node.id), ["a"]);
});

test("selection toggles on and off", () => {
    const selection = new Set();
    setSelected(selection, "a", true);
    setSelected(selection, "b", true);
    setSelected(selection, "a", false);
    assert.deepEqual(Array.from(selection), ["b"]);
});

test("select-all excludes the current root document", () => {
    const tree = buildTree([
        {id: "root", hpath: "/Root", content: "Root"},
        {id: "a", hpath: "/Root/A", content: "A"},
        {id: "b", hpath: "/Root/B", content: "B"},
    ], "root", "/Root");
    assert.deepEqual(allSelectableIds(tree).sort(), ["a", "b"]);
});
