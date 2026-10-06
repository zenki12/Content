import test from "node:test";
import assert from "node:assert/strict";
import {
  compileIdeasPrompt,
  compileImprovePrompt,
  compilePromptByWorkflow,
  compileStyleTransferPrompt,
  compileWritePrompt,
  createEmptyBrief,
  summarizeBrief,
} from "./prompt-engine.js";

test("summarizeBrief includes core marketing context", () => {
  const summary = summarizeBrief({
    ...createEmptyBrief(),
    product: "Khoá IELTS 60 ngày",
    audience: "Người đi làm kẹt ở band 5.5",
    goals: ["Tạo khách hàng tiềm năng"],
    evidence: "Cam kết học lại miễn phí",
  });

  assert.match(summary, /Khoá IELTS 60 ngày/);
  assert.match(summary, /kẹt ở band 5\.5/);
  assert.match(summary, /Tạo khách hàng tiềm năng/);
  assert.match(summary, /học lại miễn phí/);
});

test("compileWritePrompt adapts to advanced mode fields", () => {
  const prompt = compileWritePrompt({
    mode: "advanced",
    brief: {
      ...createEmptyBrief(),
      product: "Serum Vitamin C",
      formula: "AIDA",
      contentLines: ["Tình huống thực tế", "Điểm khác biệt"],
      vocabRatio: "50% Định tính - 50% Định lượng",
    },
  });

  assert.match(prompt.system, /biên tập viên nội dung tiếng Việt/);
  assert.match(prompt.user, /Mức biên tập: advanced/);
  assert.match(prompt.user, /AIDA/);
  assert.match(prompt.user, /50% Định tính/);
});

test("compileImprovePrompt focuses on rewriting existing content", () => {
  const prompt = compileImprovePrompt({
    mode: "basic",
    brief: {
      ...createEmptyBrief(),
      sourceContent: "Bài viết cũ cần sửa",
      improveTypes: ["Rút gọn ý", "Sắp xếp lập luận"],
    },
  });

  assert.match(prompt.user, /Bài viết cũ cần sửa/);
  assert.match(prompt.user, /Rút gọn ý, Sắp xếp lập luận/);
  assert.match(prompt.user, /bản đã biên tập hoàn chỉnh/);
});

test("compileStyleTransferPrompt learns voice before writing new content", () => {
  const prompt = compileStyleTransferPrompt({
    mode: "advanced",
    brief: {
      ...createEmptyBrief(),
      styleSample: "Đây là mẫu văn phong cần học.",
      styleTopic: "Viết bài mới về khoá học marketing.",
    },
  });

  assert.match(prompt.user, /mẫu văn phong cần học/);
  assert.match(prompt.user, /Viết bài mới về khoá học marketing/);
  assert.match(prompt.user, /Tóm tắt đặc điểm phong cách/);
});

test("compilePromptByWorkflow routes ideas workflow", () => {
  const prompt = compilePromptByWorkflow({
    workflow: "ideas",
    improveSubmode: "improve",
    mode: "basic",
    brief: {
      ...createEmptyBrief(),
      product: "Kem chống nắng",
      ideaCount: "5 hướng",
    },
  });

  assert.match(prompt.user, /Đề xuất các hướng triển khai nội dung/);
  assert.match(prompt.user, /Kem chống nắng/);
  assert.match(prompt.user, /5 hướng/);
});

test("compileIdeasPrompt includes opening and approach requirements", () => {
  const prompt = compileIdeasPrompt({
    mode: "basic",
    brief: { ...createEmptyBrief(), product: "App học tiếng Anh" },
  });

  assert.match(prompt.user, /Câu mở đầu gợi ý/);
  assert.match(prompt.user, /Góc tiếp cận/);
  assert.match(prompt.user, /Hành động mong muốn/);
});
