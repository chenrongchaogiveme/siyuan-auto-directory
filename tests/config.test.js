import test from "node:test";
import assert from "node:assert/strict";
import {normalizeConfig} from "../src/config.js";

test("normalizeConfig keeps supported settings", () => {
    assert.deepEqual(normalizeConfig({
        maxDepth: "3",
        defaultExpandedDepth: 7,
        autoExpand: false,
        showChildCount: false,
        showReferencedDocs: false,
        showCreatedTime: true,
        showUpdatedTime: false,
        confirmMove: false,
        onlyWhenEmpty: false,
    }), {
        maxDepth: 3,
        defaultExpandedDepth: 7,
        autoExpand: false,
        showChildCount: false,
        showReferencedDocs: false,
        showCreatedTime: true,
        showUpdatedTime: false,
        confirmMove: false,
    });
});

test("normalizeConfig clamps bad values", () => {
    assert.deepEqual(normalizeConfig({
        maxDepth: -9,
        defaultExpandedDepth: 999,
        autoExpand: 0,
        showChildCount: 0,
        showReferencedDocs: 0,
        showCreatedTime: 0,
        showUpdatedTime: 0,
        confirmMove: 0,
    }), {
        maxDepth: 0,
        defaultExpandedDepth: 50,
        autoExpand: true,
        showChildCount: true,
        showReferencedDocs: true,
        showCreatedTime: false,
        showUpdatedTime: true,
        confirmMove: true,
    });
});

test("normalizeConfig enables move confirmation when the value is missing", () => {
    assert.equal(normalizeConfig({}).confirmMove, true);
    assert.equal(normalizeConfig({confirmMove: null}).confirmMove, true);
});

test("normalizeConfig shows only the updated time by default", () => {
    const config = normalizeConfig({});
    assert.equal(config.showUpdatedTime, true);
    assert.equal(config.showCreatedTime, false);
});
