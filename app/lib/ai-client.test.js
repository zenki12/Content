import test from "node:test";
import assert from "node:assert/strict";
import { generateText, toOpenAIInput, toChatMessages } from "./ai-client.js";

test("toOpenAIInput preserves system and user messages for Responses API", () => {
  const input = toOpenAIInput([
    { role: "system", content: "System rule" },
    { role: "user", content: "Write post" },
  ]);

  assert.deepEqual(input, [
    { role: "system", content: "System rule" },
    { role: "user", content: "Write post" },
  ]);
});

test("toChatMessages filters invalid messages for compatible chat APIs", () => {
  const messages = toChatMessages([
    { role: "system", content: "A" },
    { role: "assistant", content: "" },
    { role: "user", content: "B" },
    { role: "tool", content: "C" },
  ]);

  assert.deepEqual(messages, [
    { role: "system", content: "A" },
    { role: "user", content: "B" },
  ]);
});

test("generateText rejects arbitrary provider endpoints before sending credentials", async () => {
  await assert.rejects(
    generateText({
      settings: {
        apiKey: "secret-key",
        providerId: "custom",
        model: "custom-model",
        baseUrl: "https://example.com/v1",
      },
      messages: [{ role: "user", content: "Hello" }],
    }),
    /không được hỗ trợ/
  );
});
