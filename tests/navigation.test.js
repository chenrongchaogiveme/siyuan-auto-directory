import test from "node:test";
import assert from "node:assert/strict";
import {appendNavigationOrigin} from "../src/navigation.js";

test("navigation keeps the notebook and parent directory trail", () => {
    const first = appendNavigationOrigin([], {id: "notebook", title: "数控机械"}, "parent");
    const second = appendNavigationOrigin(first, {id: "parent", title: "和小继哥一起学数控车"}, "child");
    assert.deepEqual(second, [
        {id: "notebook", title: "数控机械"},
        {id: "parent", title: "和小继哥一起学数控车"},
    ]);
});

test("navigation avoids duplicate or cyclic entries", () => {
    const first = appendNavigationOrigin([], {id: "a", title: "A"}, "b");
    const back = appendNavigationOrigin(first, {id: "b", title: "B"}, "a");
    assert.deepEqual(back, [{id: "b", title: "B"}]);
    assert.deepEqual(appendNavigationOrigin([], {id: "a", title: "A"}, "a"), []);
});

test("navigation is capped to a compact trail", () => {
    let stack = [];
    for (let index = 1; index <= 12; index += 1) {
        stack = appendNavigationOrigin(stack, {id: `doc-${index}`, title: `Doc ${index}`}, `target-${index}`);
    }
    assert.equal(stack.length, 10);
    assert.equal(stack[0].id, "doc-3");
    assert.equal(stack[9].id, "doc-12");
});
