const VALID_CHAT_ROLES = new Set(["system", "user", "assistant"]);
const PROVIDER_BASE_URLS = new Map([
  ["gemini", "https://generativelanguage.googleapis.com/v1beta/openai"],
  ["openrouter", "https://openrouter.ai/api/v1"],
]);
const REQUEST_TIMEOUT_MS = 60000;

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
  const providerId = settings?.providerId || "openai";
  const baseUrl = settings?.baseUrl?.trim();

  if (!apiKey) {
    throw new Error("Bạn chưa nhập khóa API.");
  }

  if (!model || model.length > 120) {
    throw new Error("Tên mô hình không hợp lệ.");
  }

  const normalizedMessages = normalizeMessages(messages);
  const totalLength = normalizedMessages.reduce((sum, message) => sum + message.content.length, 0);
  if (!normalizedMessages.length || totalLength > 120000) {
    throw new Error("Nội dung gửi tới AI đang trống hoặc vượt quá giới hạn cho phép.");
  }

  if (providerId !== "openai") {
    const allowedBaseUrl = PROVIDER_BASE_URLS.get(providerId);
    if (!allowedBaseUrl || baseUrl !== allowedBaseUrl) {
      throw new Error("Nhà cung cấp AI hoặc địa chỉ API không được hỗ trợ.");
    }
    return generateWithChatCompletions({ apiKey, model, baseUrl: allowedBaseUrl, messages: normalizedMessages });
  }

  if (baseUrl) throw new Error("OpenAI không sử dụng địa chỉ API tùy chỉnh trong cấu hình này.");

  return generateWithOpenAIResponses({ apiKey, model, messages: normalizedMessages });
}

function fetchWithTimeout(url, options) {
  return fetch(url, { ...options, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
}

async function generateWithOpenAIResponses({ apiKey, model, messages }) {
  const response = await fetchWithTimeout("https://api.openai.com/v1/responses", {
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
      data?.error?.message || `OpenAI API phản hồi lỗi ${response.status}.`
    );
  }

  const text = (
    data.output_text ||
    data.output
      ?.flatMap((item) => item.content || [])
      .map((item) => item.text || "")
      .join("")
      .trim() ||
    ""
  );
  if (!text) throw new Error("Mô hình không trả về nội dung. Hãy thử lại hoặc chọn mô hình khác.");
  return text;
}

async function generateWithChatCompletions({ apiKey, model, baseUrl, messages }) {
  const url = `${baseUrl.replace(/\/$/, "")}/chat/completions`;
  const response = await fetchWithTimeout(url, {
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
    throw new Error(data?.error?.message || `Dịch vụ AI phản hồi lỗi ${response.status}.`);
  }

  const text = data?.choices?.[0]?.message?.content?.trim() || "";
  if (!text) throw new Error("Mô hình không trả về nội dung. Hãy thử lại hoặc chọn mô hình khác.");
  return text;
}
