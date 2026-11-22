import test from "node:test";
import assert from "node:assert/strict";
import {formatDateTime} from "../src/time.js";

test("formatDateTime formats compact SiYuan timestamps", () => {
    assert.equal(formatDateTime("20261117091200"), "2026-11-17 09:12");
});

test("formatDateTime formats separated timestamps", () => {
    assert.equal(formatDateTime("2026-11-17 09:12:34"), "2026-11-17 09:12");
});

test("formatDateTime formats millisecond timestamps", () => {
    const date = new Date(2026, 10, 17, 15, 40, 0);
    assert.equal(formatDateTime(String(date.getTime())), "2026-11-17 15:40");
});

test("formatDateTime ignores empty or invalid values", () => {
    assert.equal(formatDateTime(""), "");
    assert.equal(formatDateTime("not-a-time"), "");
});
