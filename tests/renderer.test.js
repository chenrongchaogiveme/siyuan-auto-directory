import test from "node:test";
import assert from "node:assert/strict";
import {renderPanelHtml} from "../src/renderer.js";
import {addReference, buildTree, markReferenced} from "../src/tree.js";

function tree() {
    return buildTree([
        {id: "root", hpath: "/Root", content: "Root"},
        {id: "a", hpath: "/Root/A", content: "A"},
        {id: "a1", hpath: "/Root/A/A1", content: "A1"},
    ], "root", "/Root");
}

test("renderer renders only expanded branches", () => {
    const model = tree();
    const state = {expanded: new Set(), selection: new Set(), page: new Map()};
    const closed = renderPanelHtml(model, state, {maxDepth: 0, defaultExpandedDepth: 4, showChildCount: true, showReferencedDocs: true});
    assert.match(closed, /data-sad-node="a"/);
    assert.doesNotMatch(closed, /data-sad-node="a1"/);
    assert.match(closed, /data-sad-select-all/);
    state.expanded.add("a");
    const opened = renderPanelHtml(model, state, {maxDepth: 0, defaultExpandedDepth: 4, showChildCount: true, showReferencedDocs: true});
    assert.match(opened, /data-sad-node="a1"/);
});

test("renderer includes selection and legacy controls", () => {
    const model = tree();
    const state = {expanded: new Set(), selection: new Set(["a"]), page: new Map()};
    const html = renderPanelHtml(model, state, {maxDepth: 0, defaultExpandedDepth: 4, showChildCount: true, showReferencedDocs: true}, ["legacy-1"]);
    assert.match(html, /删除选中 \(1\)/);
    assert.match(html, /删除旧块/);
    assert.match(html, /data-sad-select="a" checked/);
});

test("multiple document tags wrap below the title and can be hidden", () => {
    const model = tree();
    model.index.get("a").tags = ["读书笔记", "个人随笔", "工具", "摘录"];
    model.index.get("a").updated = "20261117154000";
    const state = {expanded: new Set(), selection: new Set(), page: new Map()};
    const config = {maxDepth: 0, defaultExpandedDepth: 4, showChildCount: true, showReferencedDocs: true, showDocumentTags: true};
    const html = renderPanelHtml(model, state, config);
    assert.match(html, /siyuan-auto-directory__tags--detail/);
    assert.match(html, /#读书笔记/);
    assert.match(html, /#个人随笔/);
    assert.match(html, /#工具/);
    assert.match(html, />#摘录</);
    assert.doesNotMatch(html, /\+1/);
    assert.match(html, /title="标签：#读书笔记 #个人随笔 #工具 #摘录"/);
    assert.ok(html.indexOf("siyuan-auto-directory__tags--detail") < html.indexOf("siyuan-auto-directory__time"));

    const hidden = renderPanelHtml(model, state, {...config, showDocumentTags: false});
    assert.doesNotMatch(hidden, /siyuan-auto-directory__tags/);
});

test("single document tag keeps the compact right-side layout", () => {
    const model = tree();
    model.index.get("a").tags = ["读书笔记"];
    model.index.get("a").updated = "20261117154000";
    const state = {expanded: new Set(), selection: new Set(), page: new Map()};
    const config = {maxDepth: 0, defaultExpandedDepth: 4, showChildCount: true, showReferencedDocs: true, showDocumentTags: true};
    const html = renderPanelHtml(model, state, config);
    assert.match(html, /siyuan-auto-directory__tags/);
    assert.doesNotMatch(html, /siyuan-auto-directory__tags--detail/);
    assert.match(html, /#读书笔记/);
    assert.ok(html.indexOf("siyuan-auto-directory__tags") < html.indexOf("siyuan-auto-directory__time"));
});

test("renderer exposes a pin toggle and marks pinned rows", () => {
    const model = tree();
    model.index.get("a").updated = "20261117154000";
    const state = {expanded: new Set(), selection: new Set(), page: new Map()};
    const config = {maxDepth: 0, defaultExpandedDepth: 4, showChildCount: true, showReferencedDocs: true};
    const before = renderPanelHtml(model, state, config);
    assert.match(before, /data-sad-pin="a"/);
    assert.match(before, /data-sad-pin="a"[^>]*aria-pressed="false"/);
    const pinIndex = before.indexOf('data-sad-pin="a"');
    assert.ok(pinIndex > before.indexOf("siyuan-auto-directory__row-main-title"));
    assert.ok(pinIndex < before.indexOf("siyuan-auto-directory__time"));
    assert.ok(pinIndex < before.indexOf('data-sad-delete="a"'));
    model.index.get("a").pinned = true;
    const after = renderPanelHtml(model, state, config);
    assert.match(after, /data-sad-pin="a"[^>]*aria-pressed="true"/);
    assert.match(after, /siyuan-auto-directory__pin is-active/);
    assert.match(after, /siyuan-auto-directory__row[^"]*is-pinned/);
});

test("renderer hides reference badges and reference count when disabled", () => {
    const model = tree();
    model.children[0].referenced = true;
    const state = {expanded: new Set(), selection: new Set(), page: new Map()};
    const html = renderPanelHtml(model, state, {maxDepth: 0, defaultExpandedDepth: 4, showChildCount: true, showReferencedDocs: false});
    assert.doesNotMatch(html, /引用 1 篇/);
    assert.doesNotMatch(html, /class="siyuan-auto-directory__badge"/);
});

test("references are rendered inline under the note that contains them", () => {
    const model = tree();
    addReference(model, "a", {
        id: "external",
        title: "Other doc",
        hpath: "/Other",
        path: "/other.sy",
    });
    const state = {expanded: new Set(["a"]), referenceExpanded: new Set(), selection: new Set(), page: new Map()};
    const html = renderPanelHtml(model, state, {maxDepth: 0, defaultExpandedDepth: 4, showChildCount: true, showReferencedDocs: true});
    assert.match(html, /引用了/);
    assert.match(html, /data-sad-open="external"/);
    assert.match(html, /\/Other/);
    assert.doesNotMatch(html, /siyuan-auto-directory__ref-section/);
});

test("root document references do not create a top summary banner", () => {
    const model = tree();
    addReference(model, "root", {
        id: "other",
        title: "Other",
        hpath: "/Other",
    });
    const state = {expanded: new Set(), referenceExpanded: new Set(), selection: new Set(), page: new Map()};
    const html = renderPanelHtml(model, state, {maxDepth: 0, defaultExpandedDepth: 4, showChildCount: true, showReferencedDocs: true});
    assert.doesNotMatch(html, /本文引用/);
    assert.doesNotMatch(html, /siyuan-auto-directory__root-refs/);
    assert.doesNotMatch(html, /data-sad-open="other"/);
    assert.match(html, /引用 1 篇/);
});

test("referenced child documents keep only the compact referenced badge", () => {
    const model = tree();
    markReferenced(model, ["a"], {id: "root", title: "Root", hpath: "/Root", path: "/Root.sy"});
    const state = {expanded: new Set(), referenceExpanded: new Set(), selection: new Set(), page: new Map()};
    const html = renderPanelHtml(model, state, {maxDepth: 0, defaultExpandedDepth: 4, showChildCount: true, showReferencedDocs: true});
    assert.match(html, /被引用/);
    assert.doesNotMatch(html, /引用自/);
    assert.doesNotMatch(html, /data-sad-open="root"/);
    assert.match(html, /data-sad-draggable="true"/);
});

test("inline references show two links first and expose the rest on demand", () => {
    const model = tree();
    for (let index = 1; index <= 5; index += 1) {
        addReference(model, "a", {
            id: `ref-${index}`,
            title: `Reference ${index}`,
            hpath: `/References/${index}`,
            path: `/references/${index}.sy`,
        });
    }
    const state = {expanded: new Set(["a"]), referenceExpanded: new Set(), selection: new Set(), page: new Map()};
    const config = {maxDepth: 0, defaultExpandedDepth: 4, showChildCount: true, showReferencedDocs: true};
    const collapsed = renderPanelHtml(model, state, config);
    assert.match(collapsed, /data-sad-open="ref-1"/);
    assert.match(collapsed, /data-sad-open="ref-2"/);
    assert.doesNotMatch(collapsed, /data-sad-open="ref-3"/);
    assert.match(collapsed, /data-sad-more-refs="out:a"/);
    assert.match(collapsed, />\+3</);

    state.referenceExpanded.add("out:a");
    const expanded = renderPanelHtml(model, state, config);
    assert.match(expanded, /data-sad-open="ref-3"/);
    assert.match(expanded, /data-sad-open="ref-5"/);
    assert.match(expanded, /data-sad-more-refs="out:a"[^>]*>收起</);
});

test("inline references can be disabled without leaving stale controls", () => {
    const model = tree();
    addReference(model, "a", {
        id: "external",
        title: "Other doc",
        hpath: "/Other",
        path: "/other.sy",
    });
    const state = {expanded: new Set(["a"]), referenceExpanded: new Set(), selection: new Set(), page: new Map()};
    const html = renderPanelHtml(model, state, {maxDepth: 0, defaultExpandedDepth: 4, showChildCount: true, showReferencedDocs: false});
    assert.doesNotMatch(html, /data-sad-open="external"/);
    assert.doesNotMatch(html, /data-sad-more-refs="out:a"/);
});

test("renderer exposes a back-to-directory trail after navigating into a document", () => {
    const model = tree();
    const state = {
        expanded: new Set(),
        referenceExpanded: new Set(),
        selection: new Set(),
        page: new Map(),
        navigation: {
            trail: [
                {id: "notebook", title: "数控机械"},
                {id: "parent", title: "和小继哥一起学数控车"},
            ],
        },
    };
    const html = renderPanelHtml(model, state, {maxDepth: 0, defaultExpandedDepth: 4, showChildCount: true, showReferencedDocs: true});
    assert.match(html, /返回上级/);
    assert.match(html, /data-sad-navigate-to="parent"/);
    assert.match(html, /data-sad-navigate-to="notebook"/);
    assert.match(html, /aria-current="page">Root</);
});

test("renderer omits directory navigation when no history exists", () => {
    const model = tree();
    const state = {expanded: new Set(), selection: new Set(), page: new Map()};
    const html = renderPanelHtml(model, state, {maxDepth: 0, defaultExpandedDepth: 4, showChildCount: true, showReferencedDocs: true});
    assert.doesNotMatch(html, /siyuan-auto-directory__navigation/);
});

test("renderer shows updated time by default and keeps created time in the title", () => {
    const model = buildTree([
        {id: "root", hpath: "/Root", content: "Root"},
        {
            id: "a",
            hpath: "/Root/A",
            content: "A",
            created: "20261117091200",
            updated: "20261117154000",
        },
    ], "root", "/Root");
    const state = {expanded: new Set(), selection: new Set(), page: new Map()};
    const html = renderPanelHtml(model, state, {
        maxDepth: 0,
        defaultExpandedDepth: 4,
        showChildCount: true,
        showReferencedDocs: true,
    });
    assert.match(html, /class="siyuan-auto-directory__time"[^>]*>修改 2026-11-17 15:40</);
    assert.doesNotMatch(html, /class="siyuan-auto-directory__meta"/);
    assert.match(html, /创建 2026-11-17 09:12 · 修改 2026-11-17 15:40/);
});

test("renderer can show created time and hide updated time", () => {
    const model = buildTree([
        {id: "root", hpath: "/Root", content: "Root"},
        {
            id: "a",
            hpath: "/Root/A",
            content: "A",
            created: "20261117091200",
            updated: "20261117154000",
        },
    ], "root", "/Root");
    const state = {expanded: new Set(), selection: new Set(), page: new Map()};
    const html = renderPanelHtml(model, state, {
        maxDepth: 0,
        defaultExpandedDepth: 4,
        showChildCount: true,
        showReferencedDocs: true,
        showCreatedTime: true,
        showUpdatedTime: false,
    });
    assert.match(html, /class="siyuan-auto-directory__meta"[^>]*>创建 2026-11-17 09:12</);
    assert.doesNotMatch(html, /class="siyuan-auto-directory__time"/);
});
