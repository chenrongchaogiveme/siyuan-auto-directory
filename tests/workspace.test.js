import test from "node:test";
import assert from "node:assert/strict";
import {
    buildWorkspaceForest,
    countDocuments,
    findAncestorKeys,
    searchWorkspaceRows,
} from "../src/workspace.js";
import { collectVisibleRows } from "../src/overlay.js";

const rows = [
    {id: "d1", box: "box1", hpath: "/其他学习", content: "其他学习"},
    {id: "d2", box: "box1", hpath: "/其他学习/this is demo5", content: "this is demo5"},
    {id: "d3", box: "box1", hpath: "/其他学习/this is demo5/this is demo5-1", content: "this is demo5-1"},
    {id: "d4", box: "box1", hpath: "/其他学习/Latex g公式", content: "Latex g公式"},
    {id: "d5", box: "box2", hpath: "/收集箱/灵感", content: "灵感"},
];

const notebooks = [
    {id: "box1", name: "学习库"},
    {id: "box2", name: "收集箱"},
];

test("buildWorkspaceForest groups documents by notebook and nests by hpath", () => {
    const forest = buildWorkspaceForest(rows, notebooks);
    assert.deepEqual(forest.map((box) => box.title), ["学习库", "收集箱"]);
    const study = forest[0];
    const group = study.children[0];
    assert.equal(group.title, "其他学习");
    assert.equal(group.children[0].title, "Latex g公式");
    const demo5 = group.children.find((node) => node.id === "d2");
    assert.equal(demo5.children[0].id, "d3");
    assert.equal(demo5.children[0].depth, 3);
});

test("documents without a parent document stay at notebook root", () => {
    const forest = buildWorkspaceForest([
        {id: "x1", box: "box1", hpath: "/缺失父级/子文档", content: "子文档"},
    ], notebooks);
    assert.equal(forest[0].children[0].id, "x1");
    assert.equal(forest[0].children[0].depth, 1);
});

test("same-title documents with different paths are kept and attached by path", () => {
    const forest = buildWorkspaceForest([
        {id: "p", box: "box1", hpath: "/A", path: "/p.sy", content: "A"},
        {id: "c1", box: "box1", hpath: "/A/A", path: "/p/c1.sy", content: "A"},
        {id: "c2", box: "box1", hpath: "/A/A", path: "/p/c2.sy", content: "A"},
        {id: "dup", box: "box1", hpath: "/B", path: "/dup.sy", content: "B"},
        {id: "dup2", box: "box1", hpath: "/B", path: "/dup2.sy", content: "B"},
    ], notebooks);
    assert.equal(countDocuments(forest), 5);
    const parent = forest[0].children.find((node) => node.id === "p");
    assert.deepEqual(parent.children.map((node) => node.id), ["c1", "c2"]);
    assert.equal(forest[0].children.filter((node) => node.title === "B").length, 2);
});

test("countDocuments counts real documents only", () => {
    assert.equal(countDocuments(buildWorkspaceForest(rows, notebooks)), 5);
});

test("findAncestorKeys returns notebook and parent chain for the current document", () => {
    const forest = buildWorkspaceForest(rows, notebooks);
    assert.deepEqual(findAncestorKeys(forest, "d3"), ["box:box1", "d1", "d2"]);
    assert.deepEqual(findAncestorKeys(forest, "missing"), []);
});

test("collectVisibleRows expands only the opened chain and marks the current document", () => {
    const forest = buildWorkspaceForest(rows, notebooks);
    const expanded = new Set(findAncestorKeys(forest, "d3"));
    const visible = collectVisibleRows(forest, expanded, "d3");
    assert.deepEqual(visible.map((row) => row.key), ["box:box1", "d1", "d4", "d2", "d3", "box:box2"]);
    assert.equal(visible.find((row) => row.current).title, "this is demo5-1");
    assert.equal(visible.some((row) => row.sub), false);
});

test("searchWorkspaceRows matches titles and paths with notebook breadcrumbs", () => {
    const forest = buildWorkspaceForest(rows, notebooks);
    const matches = searchWorkspaceRows(forest, "demo5-1");
    assert.deepEqual(matches.map((row) => row.id), ["d3"]);
    assert.equal(matches[0].sub, "学习库 / 其他学习 / this is demo5");
    assert.deepEqual(searchWorkspaceRows(forest, "/收集箱").map((row) => row.id), ["d5"]);
    assert.equal(searchWorkspaceRows(forest, "zzz").length, 0);
    assert.equal(searchWorkspaceRows(forest, "this", 2).length, 2);
});