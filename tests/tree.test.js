import test from "node:test";
import assert from "node:assert/strict";
import {
    addReference,
    addExternalNode,
    applyTreeOrder,
    buildTree,
    canMoveNode,
    collectReferencedIds,
    createNode,
    hasDirectoryContent,
    isNodeUnder,
    markReferenced,
    signature,
} from "../src/tree.js";

const rows = [
    {id: "root", hpath: "/Projects", content: "Projects"},
    {id: "a", hpath: "/Projects/A", content: "A"},
    {id: "a1", hpath: "/Projects/A/A1", content: "A1"},
    {id: "b", hpath: "/Projects/B", content: "B"},
    {id: "other", hpath: "/Other", content: "Other"},
];

test("buildTree only keeps the current document subtree", () => {
    const tree = buildTree(rows, "root", "/Projects");
    assert.equal(tree.children.length, 2);
    assert.equal(tree.index.has("other"), false);
    assert.equal(tree.children[0].children[0].id, "a1");
    assert.equal(hasDirectoryContent(tree), true);
});

test("createNode keeps document created and updated timestamps", () => {
    const node = createNode({
        id: "doc",
        content: "Doc",
        created: "20261117091200",
        updated: "20261117154000",
    });
    assert.equal(node.created, "20261117091200");
    assert.equal(node.updated, "20261117154000");
});

test("buildTree falls back to the root for unparented rows", () => {
    const tree = buildTree([
        {id: "root", hpath: "/Projects", content: "Projects"},
        {id: "floating", hpath: "/Projects/F", content: "F"},
    ], "root", "/Projects");
    assert.equal(tree.children[0].id, "floating");
});

test("buildTree can include a notebook root's full document tree", () => {
    const tree = buildTree([
        {id: "notebook", hpath: "/Notebook", content: "Notebook"},
        {id: "a", hpath: "/A", content: "A"},
        {id: "a1", hpath: "/A/A1", content: "A1"},
        {id: "b", hpath: "/B", content: "B"},
    ], "notebook", "/", "/notebook.sy", true);
    assert.equal(tree.children.length, 2);
    assert.equal(tree.index.has("a1"), true);
});

test("referenced documents are marked and merged", () => {
    const tree = buildTree(rows, "root", "/Projects");
    const source = {id: "root", title: "Projects", hpath: "/Projects", path: "/Projects.sy"};
    markReferenced(tree, ["a"], source);
    addExternalNode(tree, {id: "external", title: "External", hpath: "/Other/External", path: "/external.sy"}, source);
    assert.equal(tree.index.get("a").referenced, true);
    assert.equal(tree.index.get("a").referenceSources[0].title, "Projects");
    assert.equal(tree.index.get("external").external, true);
    assert.equal(tree.index.get("external").referenceSources[0].hpath, "/Projects");
    assert.equal(tree.children.some((node) => node.id === "external"), true);
});

test("references are attached to the source document and mark the target", () => {
    const tree = buildTree(rows, "root", "/Projects");
    addReference(tree, "root", {
        id: "a",
        title: "A",
        hpath: "/Projects/A",
        path: "/Projects/A.sy",
        count: 2,
    });
    assert.equal(tree.index.get("root").references[0].id, "a");
    assert.equal(tree.index.get("root").references[0].count, 2);
    assert.equal(tree.index.get("a").referenced, true);
    assert.equal(tree.index.get("a").referenceSources[0].title, "Projects");
});

test("filetree order overrides the fallback title order", () => {
    const tree = buildTree(rows, "root", "/Projects");
    assert.deepEqual(tree.children.map((node) => node.id), ["a", "b"]);
    applyTreeOrder(tree, new Map([["a", 1], ["b", 0]]));
    assert.deepEqual(tree.children.map((node) => node.id), ["b", "a"]);
});

test("signature changes when referenced state changes", () => {
    const tree = buildTree(rows, "root", "/Projects");
    const config = {maxDepth: 0, defaultExpandedDepth: 4, autoExpand: true, showChildCount: true, showReferencedDocs: true};
    const before = signature(tree, {id: "root"}, config);
    markReferenced(tree, ["a"]);
    const after = signature(tree, {id: "root"}, config);
    assert.notEqual(before, after);
});

test("collectReferencedIds reads document block refs", () => {
    const editor = {
        querySelectorAll() {
            return [
                {getAttribute: (name) => name === "data-id" ? "doc-1" : name === "data-subtype" ? "d" : null},
                {getAttribute: (name) => name === "data-id" ? "block-1" : name === "data-subtype" ? "p" : null},
            ];
        },
    };
    assert.deepEqual(collectReferencedIds(editor), ["doc-1"]);
});

test("a node cannot be moved into its own subtree or an external reference", () => {
    const tree = buildTree(rows, "root", "/Projects");
    addExternalNode(tree, {id: "external", title: "External", hpath: "/Other/External"});
    assert.equal(isNodeUnder(tree, "a", "a1"), true);
    assert.equal(canMoveNode(tree, "a", "b"), true);
    assert.equal(canMoveNode(tree, "a", "a1"), false);
    assert.equal(canMoveNode(tree, "external", "a"), false);
    assert.equal(canMoveNode(tree, "a", "external"), false);
});
