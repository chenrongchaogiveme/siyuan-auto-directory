import test from "node:test";
import assert from "node:assert/strict";
import {contextsDiffer, documentIdOf, isCurrentDocument} from "../src/dom.js";

test("documentIdOf prefers the current protyle root document", () => {
    assert.equal(documentIdOf({block: {rootID: "doc-a", id: "block-b"}}), "doc-a");
    assert.equal(documentIdOf({block: {id: "block-b"}, blockId: "doc-c"}), "block-b");
    assert.equal(documentIdOf(null), "");
});

test("isCurrentDocument rejects stale asynchronous refreshes", () => {
    const protyle = {block: {rootID: "doc-new"}};
    assert.equal(isCurrentDocument(protyle, "doc-new"), true);
    assert.equal(isCurrentDocument(protyle, "doc-old"), false);
    assert.equal(isCurrentDocument({block: {}}, "doc-old"), true);
});

test("contextsDiffer only resets state for two known documents", () => {
    assert.equal(contextsDiffer({id: "doc-a"}, {id: "doc-b"}), true);
    assert.equal(contextsDiffer({id: "doc-a"}, {id: "doc-a"}), false);
    assert.equal(contextsDiffer(null, {id: "doc-a"}), false);
    assert.equal(contextsDiffer({id: "doc-a"}, null), false);
});
