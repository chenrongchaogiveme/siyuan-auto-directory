import test from "node:test";
import assert from "node:assert/strict";
import { buildTreeScope, isRowInScope } from "../src/sql.js";

test("root-level documents do not expand scope to the whole notebook", () => {
    const context = {
        rootId: "root",
        hpath: "/",
        path: "/root.sy",
    };
    assert.equal(isRowInScope({id: "root", path: "/root.sy"}, context), true);
    assert.equal(isRowInScope({id: "child", path: "/root/child.sy"}, context), true);
    assert.equal(isRowInScope({id: "other", path: "/other.sy", hpath: "/other"}, context), false);
    const scope = buildTreeScope(context);
    assert.match(scope, /id = 'root'/);
    assert.match(scope, /path = '\/root\.sy'/);
    assert.match(scope, /path LIKE '\/root\/%'/);
    assert.doesNotMatch(scope, /hpath = '\/'/);
});

test("hpath scope still includes real descendants", () => {
    const context = {
        rootId: "root",
        hpath: "/Parent",
        path: "/root.sy",
    };
    assert.equal(isRowInScope({id: "child", hpath: "/Parent/Child"}, context), true);
    assert.equal(isRowInScope({id: "other", hpath: "/Other"}, context), false);
    const scope = buildTreeScope(context);
    assert.match(scope, /hpath = '\/Parent'/);
    assert.match(scope, /hpath LIKE '\/Parent\/%'/);
});
