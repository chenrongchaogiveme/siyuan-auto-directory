English | [中文](https://github.com/chenrongchaogiveme/siyuan-auto-directory/blob/main/README.zh-CN.md)

# Auto Directory

Show a live directory of real child documents and documents referenced in the body above the current SiYuan document, without writing anything into the document.

## About this plugin

I built this plugin because, after switching from Obsidian to SiYuan, I never got used to SiYuan's document-tree workflow. SiYuan can create references when a document is created, similar to Notion, but documents created quickly with QuickAdd are not rendered as references on the document page, so they do not naturally form a directory tree there.

So I built Auto Directory around my own workflow: when you open a note, it shows the document structure and note details under the current note above the body, so you can see the hierarchy without constantly switching to the document tree.

## Why not write it into the document

SiYuan HTML blocks run inside the `protyle-html` Shadow DOM and are sanitized by DOMPurify:

- plugin CSS cannot enter the Shadow DOM, so the directory has no styles;
- click events are intercepted by `<protyle-html>`, so expand and open buttons do not work;
- writing a block also duplicates the old and new directories.

The plugin renders in the normal DOM above `.protyle-content`. It looks like it sits above the document, but it does not modify the document and does not appear in Markdown or PDF exports.

## Features

- Shows the directory whenever the current document has child documents or body references; it is no longer limited to empty documents.
- Renders the real child-document hierarchy in SiYuan document-tree order. References are attached to the note that contains them instead of being flattened to the top level.
- Temporarily sort the directory by name, created time, or updated time, ascending or descending, from the panel header. Sorting only changes the current view; choose "Document tree order" to restore SiYuan's order, and it resets automatically when you switch documents.
- Quick directory: press `Ctrl+Alt+D` (or the search icon in the top bar) to open a floating workspace-wide tree in SiYuan sidebar order. It auto-expands and highlights the current document; search spans all notebooks and shows breadcrumbs for duplicates. Use ↑↓ to move, ←→ to collapse/expand, Enter to open, Esc to close. Rebind it in SiYuan Settings → Shortcuts by searching for “Quick Directory”.
- Pin a document to the top of its current level with the pin button next to the title; pinned rows stay above newly added siblings and can be unpinned.
- Show each document's #tags: a single tag stays on the right side of the row, while multiple tags wrap below the title on the left.
- Shows the last-updated time on each row. Created time is available in the title tooltip by default and can be shown permanently in settings.
- Shows up to two referenced-document paths per note by default; click `+N` to expand the rest. Paths open the target document directly. Referenced documents also show a "referenced by" line naming their sources, including notes from other notebooks. References whose target already appears below as a child are omitted automatically.
- Directory rows show only real document structure, with no "referenced"/"external" badges; genuine outside references appear only in the inline "references" line.
- After opening a child document, the panel shows "Back" and a clickable breadcrumb to return to any parent or the notebook root.
- Expand/collapse, direct child count, inline reference links, and click a title to open a document.
- Drag to the top or bottom edge of a row to reorder siblings; drag to the middle to move into a target child document.
- Uses SiYuan's `reorderDocs` for sibling sorting and `moveDocsByID` for moving. Dragging into its own subtree or an external reference is rejected.
- Optional move confirmation. "Do not ask again" can be re-enabled in settings.
- Select-all checkbox plus per-row checkboxes; "Delete selected" in the header; hover a row to delete.
- Lazy rendering for large directories: 120 items per level, then "Load more".
- Optional default expansion; large directories can start collapsed.
- Refreshes automatically after child documents are added, deleted, renamed, moved, or references change.
- Detects directory blocks created by older versions, hides them, and offers cleanup in the panel.

## Related plugin

I also maintain [QuickAdd](https://github.com/chenrongchaogiveme/siyuan-quickadd): a SiYuan plugin inspired by Obsidian QuickAdd, with quick capture, template-based notes, macros, and action menus. QuickAdd handles fast note creation; Auto Directory keeps the resulting document structure visible. They work well together.

## Source layout

`index.js` is a build artifact, not the hand-written entry point. The source is split by responsibility:

- `src/api.js`: SiYuan kernel APIs
- `src/tree.js`: document tree building, pin sorting, tag merging, reference merging, and signatures
- `src/renderer.js`: renders only visible levels and a small number of inline references
- `src/panel.js`: overlay lifecycle, expand, open, and delete
- `src/move-dialog.js`: move confirmation and "do not ask again"
- `src/selection.js`: selection state
- `src/settings.js`: settings dialog
- `src/time.js`: SiYuan timestamp formatting
- `src/legacy.js`: legacy directory block detection and cleanup
- `src/plugin.js`: plugin lifecycle
- `src/entry.js`: build entry

Build:

```powershell
npm install
npm run build
```

`scripts/build.js` bundles with esbuild to `dist/index.js` and copies the result to the plugin root `index.js`. SiYuan only loads the root `index.js`.

## Install

### From the SiYuan marketplace

Open `Settings` -> `Marketplace` -> `Plugins`, search for "Auto Directory" or "自动目录", and install it.

### Manual

Copy this folder to the SiYuan plugin directory, for example:

`{workspace}/data/plugins/siyuan-auto-directory`

Then enable "Auto Directory" in SiYuan.

## Settings

Open settings from the list icon on the right side of the top bar:

- Maximum directory depth: `0` means unlimited
- Default expanded depth
- Expand directories by default (when off, large directories start collapsed)
- Show child-document count
- Show last-updated time
- Show created time (when off, it remains in the title tooltip)
- Show document tags (single tags on the right; multiple tags wrap below the title)
- Show documents referenced in the body (when off, only real child documents are shown)
- Confirm before moving (when off, drag-and-drop moves run immediately; you can also disable the prompt in the first move dialog)

The old "only show in empty documents" option has been removed.

Temporary sorting is controlled from the panel header and is not saved as a setting.

## Known limitations

- The directory is a reading aid overlay. It is not exported to Markdown or PDF and is not written into the document.
- References are read from SiYuan's `refs` index first, which covers notes inside the directory. If the index is temporarily unavailable, it falls back to the current editor DOM.
- If a sibling position conflicts with SiYuan's custom sorting, the plugin asks you to adjust the document-tree sorting rule instead of silently clearing your custom order.
- Temporary sorting is view-only and resets when you switch documents; it does not reorder the SiYuan document tree.

## Changelog

Newest version first.

### 1.2.0

- Added: temporary sorting from the panel header by name, created time, or updated time, ascending or descending. Pinned documents stay on top, and choosing "Document tree order" restores SiYuan's order. The sort resets when you switch documents and never reorders the real document tree.
- Added: inline references whose target already appears below as a child are omitted automatically, so "create and reference" documents are not listed twice; sibling and cross-branch references stay visible.

### 1.1.0

- Added: pin a document to the top of its current level from the pin button next to the title. New siblings no longer push it down; click again to unpin.
- Added: show document #tags. Single tags stay on the right side of the row; multiple tags wrap below the title on the left. Can be disabled in settings.

### 1.0.1

- Fixed: the settings dialog no longer overflows short windows; the options area now scrolls.

### 1.0.0

- First stable release.
- Shows the real child-document tree and body references above the current document without writing into it or affecting Markdown / PDF exports.
- Expand/collapse, direct child count, and last-updated time; created time is available in the tooltip or settings.
- Drag to reorder siblings or move into a child document, plus batch delete with row checkboxes.
- Breadcrumb navigation back to parents, `+N` inline reference expansion, lazy loading for large directories, and automatic refresh.
- Detects directory blocks written by older versions and offers cleanup in the panel.
