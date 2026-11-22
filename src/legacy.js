import { deleteBlock, findLegacyBlocks } from "./api.js";

export async function loadLegacyBlocks(docId) {
    try {
        return await findLegacyBlocks(docId);
    } catch (error) {
        console.warn("[siyuan-auto-directory] 检查旧版目录块失败", error);
        return [];
    }
}

export async function removeLegacyBlocks(ids) {
    const unique = Array.from(new Set((ids || []).filter(Boolean)));
    for (const id of unique) {
        await deleteBlock(id);
    }
    return unique.length;
}
