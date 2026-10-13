import test from "node:test";
import assert from "node:assert/strict";
import { createWorkflowBriefs, validateWorkspace } from "./workflow-state.js";

const settings = { apiKey: "test-key" };

test("createWorkflowBriefs gives every workflow an independent draft", () => {
  const briefs = createWorkflowBriefs();
  briefs.write.topic = "Bài mới";

  assert.equal(briefs.improve.topic, "");
  assert.equal(briefs.ideas.topic, "");
  assert.notEqual(briefs.write, briefs.improve);
});

test("validateWorkspace enforces all required structured write fields", () => {
  const brief = createWorkflowBriefs().write;
  brief.product = "Sản phẩm";
  brief.topic = "Ý trung tâm";

  assert.deepEqual(
    validateWorkspace({ settings, workflow: "write", improveSubmode: "improve", mode: "basic", brief }),
    { field: "audience", message: "Hãy mô tả người sẽ đọc bản viết." }
  );
});

test("validateWorkspace requires audience for idea exploration", () => {
  const brief = createWorkflowBriefs().ideas;
  brief.product = "Ứng dụng quản lý chi tiêu";

  assert.equal(
    validateWorkspace({ settings, workflow: "ideas", improveSubmode: "improve", mode: "basic", brief })?.field,
    "audience"
  );
});

test("validateWorkspace accepts a complete style-transfer request", () => {
  const brief = createWorkflowBriefs().improve;
  brief.styleSample = "Một đoạn mẫu đủ rõ.";
  brief.styleTopic = "Viết thư giới thiệu sản phẩm.";

  assert.equal(
    validateWorkspace({ settings, workflow: "improve", improveSubmode: "style", mode: "basic", brief }),
    null
  );
});
