import { Dialog, showMessage } from "siyuan";
import { clampInt, normalizeConfig } from "./config.js";

export function openSettingsDialog(config, saveConfig, reloadPanels) {
    const content = `<div class="b3-dialog__content sad-settings">
  <label class="sad-settings__field">
    <span class="sad-settings__label">最大目录层级</span>
    <span class="sad-settings__hint">0 = 不限制</span>
    <input class="b3-text-field fn__block" id="sad-max-depth" type="number" min="0" max="50" value="${config.maxDepth}">
  </label>
  <label class="sad-settings__field">
    <span class="sad-settings__label">默认展开层级</span>
    <span class="sad-settings__hint">仅在开启“默认展开目录”时生效</span>
    <input class="b3-text-field fn__block" id="sad-expanded-depth" type="number" min="0" max="50" value="${config.defaultExpandedDepth}">
  </label>
  <div class="sad-settings__divider"></div>
  <label class="sad-settings__toggle">
    <span class="sad-settings__toggle-text">
      <span class="sad-settings__label">默认展开目录</span>
      <span class="sad-settings__hint">关闭后首次显示全部收起，适合文档很多或层级很深的情况。</span>
    </span>
    <input id="sad-auto-expand" type="checkbox" class="b3-switch" ${config.autoExpand !== false ? "checked" : ""}>
  </label>
  <label class="sad-settings__toggle">
    <span class="sad-settings__toggle-text">
      <span class="sad-settings__label">显示子文档数量</span>
      <span class="sad-settings__hint">在每个可展开目录项右侧显示直接子文档数。</span>
    </span>
    <input id="sad-show-count" type="checkbox" class="b3-switch" ${config.showChildCount ? "checked" : ""}>
  </label>
  <label class="sad-settings__toggle">
    <span class="sad-settings__toggle-text">
      <span class="sad-settings__label">显示最后修改时间</span>
      <span class="sad-settings__hint">在目录行右侧显示文档最后修改时间。</span>
    </span>
    <input id="sad-show-updated-time" type="checkbox" class="b3-switch" ${config.showUpdatedTime !== false ? "checked" : ""}>
  </label>
  <label class="sad-settings__toggle">
    <span class="sad-settings__toggle-text">
      <span class="sad-settings__label">显示创建时间</span>
      <span class="sad-settings__hint">关闭时仍可在标题悬停提示中查看；开启后显示在标题下方。</span>
    </span>
    <input id="sad-show-created-time" type="checkbox" class="b3-switch" ${config.showCreatedTime === true ? "checked" : ""}>
  </label>
  <label class="sad-settings__toggle">
    <span class="sad-settings__toggle-text">
      <span class="sad-settings__label">显示正文引用的文档</span>
      <span class="sad-settings__hint">关闭后只显示真实子文档；开启时引用按来源笔记行内展示，默认仅显示两条。</span>
    </span>
    <input id="sad-show-references" type="checkbox" class="b3-switch" ${config.showReferencedDocs !== false ? "checked" : ""}>
  </label>
  <label class="sad-settings__toggle">
    <span class="sad-settings__toggle-text">
      <span class="sad-settings__label">移动前确认</span>
      <span class="sad-settings__hint">拖拽移动时先确认；可在确认框中勾选“不再提示”，再从这里重新开启。</span>
    </span>
    <input id="sad-confirm-move" type="checkbox" class="b3-switch" ${config.confirmMove !== false ? "checked" : ""}>
  </label>
  <div class="sad-settings__note">
    有子文档或正文引用文档时自动显示，不再区分空白文档。<br>
    目录是阅读辅助浮层，不会写入正文；旧版目录块可在面板顶部清理。
  </div>
</div>
<div class="b3-dialog__action">
  <button class="b3-button b3-button--outline" data-sad-reload>重载目录</button>
  <div class="fn__space"></div>
  <button class="b3-button b3-button--cancel" data-sad-cancel>取消</button>
  <div class="fn__space"></div>
  <button class="b3-button b3-button--text" data-sad-save>保存</button>
</div>`;
    const dialog = new Dialog({
        title: "自动目录设置",
        content,
        width: "500px",
        height: "auto",
    });
    const close = dialog.element.querySelector("[data-sad-cancel]");
    const save = dialog.element.querySelector("[data-sad-save]");
    const reload = dialog.element.querySelector("[data-sad-reload]");
    if (close) {
        close.addEventListener("click", () => dialog.destroy());
    }
    if (reload && reloadPanels) {
        reload.addEventListener("click", async () => {
            reload.disabled = true;
            try {
                await reloadPanels();
                showMessage("目录已重新加载");
            } catch (error) {
                console.error("[siyuan-auto-directory] 重载目录失败", error);
                showMessage("重载目录失败：" + error.message);
            } finally {
                reload.disabled = false;
            }
        });
    }
    if (!save) {
        return dialog;
    }
    const autoExpand = dialog.element.querySelector("#sad-auto-expand");
    const expandedDepth = dialog.element.querySelector("#sad-expanded-depth");
    const syncDepthState = () => {
        if (autoExpand && expandedDepth) {
            expandedDepth.disabled = !autoExpand.checked;
        }
    };
    if (autoExpand) {
        autoExpand.addEventListener("change", syncDepthState);
        syncDepthState();
    }
    save.addEventListener("click", async () => {
        const number = (selector, fallback) => {
            const input = dialog.element.querySelector(selector);
            return input ? clampInt(input.value, 0, 50, fallback) : fallback;
        };
        const count = dialog.element.querySelector("#sad-show-count");
        const updatedTime = dialog.element.querySelector("#sad-show-updated-time");
        const createdTime = dialog.element.querySelector("#sad-show-created-time");
        const references = dialog.element.querySelector("#sad-show-references");
        const moveConfirm = dialog.element.querySelector("#sad-confirm-move");
        const next = normalizeConfig({
            maxDepth: number("#sad-max-depth", config.maxDepth),
            defaultExpandedDepth: number("#sad-expanded-depth", config.defaultExpandedDepth),
            autoExpand: autoExpand ? autoExpand.checked : config.autoExpand,
            showChildCount: count ? count.checked : config.showChildCount,
            showUpdatedTime: updatedTime ? updatedTime.checked : config.showUpdatedTime,
            showCreatedTime: createdTime ? createdTime.checked : config.showCreatedTime,
            showReferencedDocs: references ? references.checked : config.showReferencedDocs,
            confirmMove: moveConfirm ? moveConfirm.checked : config.confirmMove,
        });
        try {
            await saveConfig(next);
            dialog.destroy();
        } catch (error) {
            console.error("[siyuan-auto-directory] 保存设置失败", error);
            showMessage("保存设置失败：" + error.message);
        }
    });
    return dialog;
}
