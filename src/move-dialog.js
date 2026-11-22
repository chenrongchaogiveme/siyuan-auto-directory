import { Dialog } from "siyuan";
import { escapeHtml } from "./dom.js";

export function showMoveConfirm(options, onConfirm) {
    const sourceTitle = options && options.sourceTitle ? options.sourceTitle : "文档";
    const targetTitle = options && options.targetTitle ? options.targetTitle : "目标文档";
    const relation = options && options.relation ? options.relation : "";
    const dialog = new Dialog({
        title: "移动文档",
        content: `<div class="b3-dialog__content sad-move-confirm">
  <div class="sad-move-confirm__message">
    将「${escapeHtml(sourceTitle)}」移动到「${escapeHtml(targetTitle)}」${escapeHtml(relation)}。
  </div>
  <label class="sad-move-confirm__option">
    <span class="sad-move-confirm__option-text">
      <span class="sad-move-confirm__option-title">之后不再提示</span>
      <span class="sad-move-confirm__option-hint">需要恢复时，可在“自动目录设置”中重新开启“移动前确认”。</span>
    </span>
    <input id="sad-move-dont-ask" type="checkbox" class="b3-switch">
  </label>
</div>
<div class="b3-dialog__action">
  <button class="b3-button b3-button--cancel" data-sad-move-cancel>取消</button>
  <div class="fn__space"></div>
  <button class="b3-button b3-button--text" data-sad-move-confirm>移动</button>
</div>`,
        width: "460px",
        height: "auto",
    });
    const cancel = dialog.element.querySelector("[data-sad-move-cancel]");
    const confirm = dialog.element.querySelector("[data-sad-move-confirm]");
    const dontAsk = dialog.element.querySelector("#sad-move-dont-ask");
    if (cancel) {
        cancel.addEventListener("click", () => dialog.destroy());
    }
    if (confirm) {
        confirm.addEventListener("click", () => {
            confirm.disabled = true;
            const skipNextTime = Boolean(dontAsk && dontAsk.checked);
            dialog.destroy();
            onConfirm({dontAsk: skipNextTime});
        });
    }
    return dialog;
}
