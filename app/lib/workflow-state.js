import { createEmptyBrief } from "./prompt-engine.js";

export const WORKFLOW_IDS = ["write", "improve", "ideas"];

export function createWorkflowBriefs() {
  return Object.fromEntries(WORKFLOW_IDS.map((id) => [id, createEmptyBrief()]));
}

function missing(value) {
  return Array.isArray(value) ? value.length === 0 : !String(value || "").trim();
}

export function validateWorkspace({ settings, workflow, improveSubmode, mode, brief }) {
  if (missing(settings?.apiKey)) {
    return { field: "apiKey", message: "Hãy thêm khóa API trong mục Kết nối AI trước khi tạo nội dung." };
  }

  if (workflow === "write" && mode === "entry") {
    if (missing(brief.topic)) return { field: "topic", message: "Hãy cho biết chủ đề bạn muốn triển khai." };
    if (missing(brief.feeling)) return { field: "feeling", message: "Hãy chọn cảm giác chính của bản viết." };
    if (missing(brief.channel)) return { field: "channel", message: "Hãy chọn nơi bạn sẽ sử dụng bản viết." };
  }

  if (workflow === "write" && mode !== "entry") {
    if (missing(brief.product)) return { field: "product", message: "Hãy nhập các thông tin không được viết sai." };
    if (missing(brief.audience)) return { field: "audience", message: "Hãy mô tả người sẽ đọc bản viết." };
    if (missing(brief.topic)) return { field: "topic", message: "Hãy chốt một ý trung tâm cho bản viết." };
    if (missing(brief.goals)) return { field: "goals", message: "Hãy chọn thay đổi mong muốn sau khi người đọc xem nội dung." };
    if (missing(brief.channels)) return { field: "channels", message: "Hãy chọn ít nhất một ngữ cảnh sử dụng." };
    if (missing(brief.formats)) return { field: "formats", message: "Hãy chọn ít nhất một dạng nội dung đầu ra." };
  }

  if (workflow === "improve" && improveSubmode === "improve" && missing(brief.sourceContent)) {
    return { field: "sourceContent", message: "Hãy dán bản nội dung bạn muốn chỉnh sửa." };
  }

  if (workflow === "improve" && improveSubmode === "style") {
    if (missing(brief.styleSample)) return { field: "styleSample", message: "Hãy cung cấp một đoạn mẫu để nhận diện cách viết." };
    if (missing(brief.styleTopic)) return { field: "styleTopic", message: "Hãy nhập việc cần viết theo phong cách tham chiếu." };
  }

  if (workflow === "ideas") {
    if (missing(brief.product)) return { field: "product", message: "Hãy cho biết chủ thể cần phát triển ý tưởng." };
    if (missing(brief.audience)) return { field: "audience", message: "Hãy mô tả người sẽ tiếp nhận nội dung." };
  }

  return null;
}
