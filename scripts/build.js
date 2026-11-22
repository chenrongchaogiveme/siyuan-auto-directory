import {build} from "esbuild";
import {copyFile, mkdir, readFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");

await mkdir(dist, {recursive: true});
await build({
    entryPoints: [path.join(root, "src", "entry.js")],
    outfile: path.join(dist, "index.js"),
    bundle: true,
    format: "cjs",
    platform: "browser",
    target: "es2020",
    external: ["siyuan"],
    legalComments: "none",
    sourcemap: false,
    footer: {
        js: "if (module.exports && module.exports.default) { module.exports = module.exports.default; }",
    },
});

const generated = await readFile(path.join(dist, "index.js"), "utf8");
if (!generated.includes('require("siyuan")')) {
    throw new Error("构建产物没有保留 siyuan 外部依赖，请检查 esbuild 配置");
}

await copyFile(path.join(dist, "index.js"), path.join(root, "index.js"));
await copyFile(path.join(root, "index.css"), path.join(dist, "index.css"));
await copyFile(path.join(root, "plugin.json"), path.join(dist, "plugin.json"));
await copyFile(path.join(root, "README.md"), path.join(dist, "README.md"));
await copyFile(path.join(root, "README.zh-CN.md"), path.join(dist, "README.zh-CN.md"));
await copyFile(path.join(root, "LICENSE"), path.join(dist, "LICENSE"));
await copyFile(path.join(root, "icon.png"), path.join(dist, "icon.png"));
await copyFile(path.join(root, "preview.png"), path.join(dist, "preview.png"));

console.log("built dist/index.js and plugin root index.js");
