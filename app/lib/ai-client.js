const VALID_CHAT_ROLES = new Set(["system", "user", "assistant"]);

export function toOpenAIInput(messages) {
  return normalizeMessages(messages);
}

export function toChatMessages(messages) {
  return normalizeMessages(messages).filter((message) =>
    VALID_CHAT_ROLES.has(message.role)
  );
}

function normalizeMessages(messages) {
  if (!Array.isArray(messages)) return [];
  return messages
    .map((message) => ({
      role: String(message?.role || "user"),
      content: String(message?.content || "").trim(),
    }))
    .filter((message) => message.content);
}

export async function generateText({ settings, messages }) {
  const apiKey = settings?.apiKey?.trim();
  const model = settings?.model?.trim() || "gpt-4.1-mini";
  const baseUrl = settings?.baseUrl?.trim();

  if (!apiKey) {
    throw new Error("Thiếu API key.");
  }

  if (baseUrl) {
    return generateWithChatCompletions({ apiKey, model, baseUrl, messages });
  }

  return generateWithOpenAIResponses({ apiKey, model, messages });
}

async function generateWithOpenAIResponses({ apiKey, model, messages }) {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      input: toOpenAIInput(messages),
      temperature: 0.72,
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      data?.error?.message || `OpenAI API lỗi ${response.status}.`
    );
  }

  return (
    data.output_text ||
    data.output
      ?.flatMap((item) => item.content || [])
      .map((item) => item.text || "")
      .join("")
      .trim() ||
    ""
  );
}

async function generateWithChatCompletions({ apiKey, model, baseUrl, messages }) {
  const url = `${baseUrl.replace(/\/$/, "")}/chat/completions`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: toChatMessages(messages),
      temperature: 0.72,
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error?.message || `AI API lỗi ${response.status}.`);
  }

  return data?.choices?.[0]?.message?.content?.trim() || "";
}
