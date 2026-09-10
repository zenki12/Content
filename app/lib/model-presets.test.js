import test from "node:test";
import assert from "node:assert/strict";
import { MODEL_PRESETS, applyModelPreset } from "./model-presets.js";

test("model presets clearly label payment expectations", () => {
  assert.ok(MODEL_PRESETS.length >= 4);
  for (const preset of MODEL_PRESETS) {
    assert.match(preset.costLabel, /Trả phí|Free tier|Local|Có model free/);
    assert.ok(preset.model);
  }
});

test("applyModelPreset fills model and baseUrl while preserving apiKey", () => {
  const gemini = MODEL_PRESETS.find((preset) => preset.id === "gemini-flash");
  const settings = applyModelPreset(
    { apiKey: "keep-me", model: "old", baseUrl: "old-url" },
    gemini
  );

  assert.equal(settings.apiKey, "keep-me");
  assert.equal(settings.model, "gemini-3.5-flash");
  assert.equal(
    settings.baseUrl,
    "https://generativelanguage.googleapis.com/v1beta/openai"
  );
});
