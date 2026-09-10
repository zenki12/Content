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
    goals: ["Thu thập khách hàng tiềm năng"],
    evidence: "Cam kết học lại miễn phí",
  });

  assert.match(summary, /Khoá IELTS 60 ngày/);
  assert.match(summary, /kẹt ở band 5\.5/);
  assert.match(summary, /Thu thập khách hàng tiềm năng/);
  assert.match(summary, /học lại miễn phí/);
});

test("compileWritePrompt adapts to advanced mode fields", () => {
  const prompt = compileWritePrompt({
    mode: "advanced",
    brief: {
      ...createEmptyBrief(),
      product: "Serum Vitamin C",
      formula: "AIDA",
      contentLines: ["Insight trigger", "USPs"],
      vocabRatio: "50% Định tính - 50% Định lượng",
    },
  });

  assert.match(prompt.system, /direct-response copywriter/);
  assert.match(prompt.user, /Chế độ: advanced/);
  assert.match(prompt.user, /AIDA/);
  assert.match(prompt.user, /50% Định tính/);
});

test("compileImprovePrompt focuses on rewriting existing content", () => {
  const prompt = compileImprovePrompt({
    mode: "basic",
    brief: {
      ...createEmptyBrief(),
      sourceContent: "Bài viết cũ cần sửa",
      improveTypes: ["Hàm súc hơn", "Logic hơn"],
    },
  });

  assert.match(prompt.user, /Bài viết cũ cần sửa/);
  assert.match(prompt.user, /Hàm súc hơn, Logic hơn/);
  assert.match(prompt.user, /Viết lại phiên bản tốt hơn/);
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
  assert.match(prompt.user, /Tóm tắt DNA văn phong/);
});

test("compilePromptByWorkflow routes ideas workflow", () => {
  const prompt = compilePromptByWorkflow({
    workflow: "ideas",
    improveSubmode: "improve",
    mode: "basic",
    brief: {
      ...createEmptyBrief(),
      product: "Kem chống nắng",
      ideaCount: "5 ý tưởng",
    },
  });

  assert.match(prompt.user, /Gợi ý hook \/ ý tưởng/);
  assert.match(prompt.user, /Kem chống nắng/);
  assert.match(prompt.user, /5 ý tưởng/);
});

test("compileIdeasPrompt includes hook and angle output requirements", () => {
  const prompt = compileIdeasPrompt({
    mode: "basic",
    brief: { ...createEmptyBrief(), product: "App học tiếng Anh" },
  });

  assert.match(prompt.user, /Hook/);
  assert.match(prompt.user, /Angle/);
  assert.match(prompt.user, /CTA phù hợp/);
});
