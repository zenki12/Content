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
    goals: ["Thực hiện một hành động"],
    evidence: "Cam kết học lại miễn phí",
  });

  assert.match(summary, /Khoá IELTS 60 ngày/);
  assert.match(summary, /kẹt ở band 5\.5/);
  assert.match(summary, /Thực hiện một hành động/);
  assert.match(summary, /học lại miễn phí/);
});

test("compileWritePrompt adapts to advanced mode fields", () => {
  const prompt = compileWritePrompt({
    mode: "advanced",
    brief: {
      ...createEmptyBrief(),
      product: "Serum Vitamin C",
      formula: "Vấn đề → Hệ quả → Giải pháp",
      contentLines: ["Tình huống thực tế", "Điểm khác biệt"],
      vocabRatio: "50% Đời thường - 50% Chuẩn mực",
    },
  });

  assert.match(prompt.system, /biên tập viên nội dung tiếng Việt/);
  assert.match(prompt.user, /Mức biên tập: advanced/);
  assert.match(prompt.user, /Vấn đề → Hệ quả → Giải pháp/);
  assert.match(prompt.user, /50% Đời thường/);
});

test("compileImprovePrompt focuses on rewriting existing content", () => {
  const prompt = compileImprovePrompt({
    mode: "basic",
    brief: {
      ...createEmptyBrief(),
      sourceContent: "Bài viết cũ cần sửa",
      improveTypes: ["Rút gọn", "Sắp xếp lại"],
    },
  });

  assert.match(prompt.user, /Bài viết cũ cần sửa/);
  assert.match(prompt.user, /Rút gọn, Sắp xếp lại/);
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
