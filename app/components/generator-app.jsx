"use client";

import { useEffect, useMemo, useState } from "react";
import { MODEL_PRESETS, applyModelPreset } from "../lib/model-presets.js";
import {
  CHANNELS,
  CONTENT_LINES,
  CONTENT_STYLES,
  FORMATS,
  FORMULAS,
  GOALS,
  IMPROVE_TYPES,
  TEMPLATE_PRESETS,
  compilePromptByWorkflow,
  createEmptyBrief,
  summarizeBrief,
} from "../lib/prompt-engine.js";

const HISTORY_KEY = "local-1prompt-history";
const SETTINGS_KEY = "local-1prompt-settings";
const THEME_KEY = "aica-theme";
const TUTORIAL_KEY = "local-1prompt-tutorial-done";

const DEFAULT_SETTINGS = {
  model: "gpt-5.4-mini",
  baseUrl: "",
  apiKey: "",
};

const MODES = [
  { id: "entry", icon: "⚡", label: "Siêu tốc" },
  { id: "basic", icon: "🔥", label: "Cơ bản" },
  { id: "advanced", icon: "🔮", label: "Nâng cao" },
];

const WORKFLOWS = [
  {
    id: "write",
    icon: "✍️",
    title: "Viết nhanh",
    desc: "Khi cần ngay nội dung, ý tưởng, dàn ý, kế hoạch sơ lược,...",
  },
  {
    id: "improve",
    icon: "✨",
    title: "Đánh giá, cải thiện, viết lại nội dung",
    desc: "Khi đã có bản cũ",
  },
  {
    id: "ideas",
    icon: "💡",
    title: "Gợi ý hook / ý tưởng",
    desc: "Khi chưa biết làm gì",
  },
];

const QUICK_FEELINGS = [
  "😄 Vui vẻ, hài hước",
  "🥰 Chia sẻ, đồng cảm",
  "🦉 Chuyên nghiệp, đáng tin cậy",
  "🔥 Thúc giục, tạo sự khan hiếm",
];

const BRAND_PURPOSES = [
  "📢 Quảng bá sản phẩm / dịch vụ",
  "📚 Tạo cộng đồng cho doanh nghiệp",
  "🌟 Xây dựng thương hiệu cá nhân",
];

const IDEA_COUNTS = ["3 ý tưởng", "5 ý tưởng", "7 ý tưởng", "10 ý tưởng"];

const TUTORIAL_STEPS = [
  {
    title: "Chào mừng đến với 1Prompt",
    body: "Bạn có thể chọn chế độ Siêu tốc, Cơ bản hoặc Nâng cao, sau đó chọn đúng workflow để AI tạo nội dung theo brief.",
  },
  {
    title: "Điền brief càng rõ, output càng tốt",
    body: "Các ô sản phẩm, khách hàng mục tiêu, kênh triển khai và mục tiêu marketing là phần quan trọng nhất.",
  },
  {
    title: "Prompt bổ sung là nơi đặt luật chơi",
    body: "Bạn có thể yêu cầu giọng văn, độ dài, cách xưng hô, CTA, hoặc những điều tuyệt đối không được dùng.",
  },
];

function readJson(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Local storage may be unavailable in private or restricted contexts.
  }
}

function updateArray(current, value) {
  return current.includes(value) ? current.filter((item) => item !== value) : [...current, value];
}

function RequiredBadge() {
  return <b className="required-badge">BẮT BUỘC</b>;
}

function OptionalHint() {
  return <span className="optional-hint">(tùy chọn)</span>;
}

function FieldLabel({ children, required, optional, hint }) {
  return (
    <div className="field-label">
      <span>{children}</span>
      {required ? <RequiredBadge /> : null}
      {optional ? <OptionalHint /> : null}
      {hint ? (
        <button className="suggest-mini" type="button">
          💡 Gợi ý
        </button>
      ) : null}
    </div>
  );
}

function TextArea({ label, value, onChange, placeholder, required, optional, hint, rows = 4, children }) {
  return (
    <label className="form-field">
      <FieldLabel required={required} optional={optional} hint={hint}>
        {label}
      </FieldLabel>
      <textarea rows={rows} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
      {children}
    </label>
  );
}

function TextInput({ label, value, onChange, placeholder, required, hint, children }) {
  return (
    <label className="form-field">
      <FieldLabel required={required} hint={hint}>
        {label}
      </FieldLabel>
      <input value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
      {children}
    </label>
  );
}

function PillGroup({ label, options, value, onChange, multi = false, required, optional, hint, maxItems }) {
  const [showCustom, setShowCustom] = useState(false);
  const [customValue, setCustomValue] = useState("");
  const selected = Array.isArray(value) ? value : [value].filter(Boolean);

  function addCustom() {
    const nextValue = customValue.trim();
    if (!nextValue) return;
    onChange(multi ? [...new Set([...selected, nextValue])] : nextValue);
    setCustomValue("");
    setShowCustom(false);
  }

  return (
    <div className="form-field">
      <FieldLabel required={required} optional={optional} hint={hint}>
        {label}
      </FieldLabel>
      {maxItems ? <p className="micro-hint">{maxItems}</p> : null}
      <div className="pill-row">
        {options.map((option) => (
          <button
            type="button"
            key={option}
            className={selected.includes(option) ? "choice-pill active" : "choice-pill"}
            onClick={() => onChange(multi ? updateArray(selected, option) : option)}
          >
            {option}
          </button>
        ))}
        {selected
          .filter((item) => !options.includes(item))
          .map((item) => (
            <button
              type="button"
              key={item}
              className="choice-pill active"
              onClick={() => onChange(multi ? selected.filter((selectedItem) => selectedItem !== item) : "")}
            >
              {item} ×
            </button>
          ))}
        <button type="button" className="choice-pill muted" onClick={() => setShowCustom((current) => !current)}>
          ➕ Khác
        </button>
      </div>
      {showCustom ? (
        <div className="custom-pill-input">
          <input
            value={customValue}
            placeholder="Nhập tùy chọn của bạn..."
            onChange={(event) => setCustomValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addCustom();
              }
            }}
            autoFocus
          />
          <button type="button" className="add-custom-btn" onClick={addCustom}>
            Thêm
          </button>
        </div>
      ) : null}
    </div>
  );
}

function RatioSlider({ label, value, onChange, leftLabel, rightLabel }) {
  return (
    <div className="form-field">
      <div className="ratio-slider-header">
        <span className="field-label-text">{label}</span>
        <span className="ratio-value-badge">
          {value}% {leftLabel} – {100 - value}% {rightLabel}
        </span>
      </div>
      <div className="ratio-slider-wrap">
        <span className="ratio-edge-label">100% {leftLabel}</span>
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          className="ratio-slider"
        />
        <span className="ratio-edge-label">100% {rightLabel}</span>
      </div>
    </div>
  );
}

function TutorialOverlay({ onDone }) {
  const [step, setStep] = useState(0);
  const current = TUTORIAL_STEPS[step];

  function finish() {
    window.localStorage.setItem(TUTORIAL_KEY, "1");
    onDone();
  }

  return (
    <div className="tutorial-overlay">
      <div className="tutorial-card">
        <div className="tutorial-meta">
          Bước {step + 1} / {TUTORIAL_STEPS.length}
        </div>
        <h3 className="tutorial-title">{current.title}</h3>
        <p className="tutorial-body">{current.body}</p>
        <div className="tutorial-dots">
          {TUTORIAL_STEPS.map((item, index) => (
            <span key={item.title} className={index === step ? "tutorial-dot active" : "tutorial-dot"} />
          ))}
        </div>
        <div className="tutorial-actions">
          <button type="button" className="tutorial-skip" onClick={finish}>
            Bỏ qua
          </button>
          <button
            type="button"
            className="tutorial-next"
            onClick={() => (step < TUTORIAL_STEPS.length - 1 ? setStep(step + 1) : finish())}
          >
            {step < TUTORIAL_STEPS.length - 1 ? "Tiếp →" : "Hoàn tất ✓"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Notice({ tone = "purple", children, action = false, onGuide }) {
  if (action) {
    return (
      <div className={`notice ${tone} notice-with-action`}>
        <span>
          💡 Ô nào không rõ thông tin, nhập chữ: <b className="highlight-keyword">&quot;ngẫu nhiên&quot;</b>, AI sẽ tự đề
          xuất.
        </span>
        <button className="guide-btn" type="button" onClick={onGuide}>
          📖 Xem hướng dẫn
        </button>
      </div>
    );
  }
  return <div className={`notice ${tone}`}>{children}</div>;
}

function ResultBlock({ title, text, onRegenerate }) {
  const [copied, setCopied] = useState(false);
  if (!text) return null;

  async function copyText() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  return (
    <section className="result-block">
      <div className="result-header">
        <div className="section-chip">{title}</div>
        <div className="result-actions">
          <button type="button" className="result-action-btn" onClick={copyText}>
            {copied ? "✓ Đã copy" : "📋 Copy"}
          </button>
          <button type="button" className="result-action-btn regen" onClick={onRegenerate}>
            🔁 Tạo lại
          </button>
        </div>
      </div>
      <pre>{text}</pre>
    </section>
  );
}

export default function GeneratorApp() {
  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState("basic");
  const [workflow, setWorkflow] = useState("write");
  const [improveSubmode, setImproveSubmode] = useState("improve");
  const [brief, setBrief] = useState(() => createEmptyBrief());
  const [history, setHistory] = useState([]);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [theme, setTheme] = useState("dark");
  const [showTutorial, setShowTutorial] = useState(false);
  const [output, setOutput] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      const storedSettings = readJson(SETTINGS_KEY, {});
      const storedHistory = readJson(HISTORY_KEY, []);
      const storedTheme = window.localStorage.getItem(THEME_KEY) || "dark";

      setSettings({ ...DEFAULT_SETTINGS, ...storedSettings });
      setHistory(storedHistory);
      setTheme(storedTheme);
      setShowTutorial(!window.localStorage.getItem(TUTORIAL_KEY));
      setMounted(true);
    });
  }, []);

  useEffect(() => {
    if (!mounted) return;
    writeJson(SETTINGS_KEY, settings);
  }, [mounted, settings]);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.setAttribute("data-theme", theme);
    window.localStorage.setItem(THEME_KEY, theme);
  }, [mounted, theme]);

  const briefSummary = useMemo(() => summarizeBrief(brief), [brief]);

  function patchBrief(patch) {
    setBrief((current) => ({ ...current, ...patch }));
  }

  function applyTemplate(template) {
    patchBrief({
      product: template.product,
      audience: template.audience,
      topic: template.topic,
    });
  }

  async function callGenerate(messages) {
    const response = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ settings, messages }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.error || "Không gọi được AI backend local.");
    }
    return data.text || "";
  }

  function validate() {
    if (!settings.apiKey.trim()) return "Bạn cần nhập API key trong Cấu hình AI.";
    if (workflow === "write") {
      if (mode === "entry" && !brief.topic.trim()) return "Chế độ Siêu tốc cần ít nhất chủ đề bài viết.";
      if (mode !== "entry" && !brief.product.trim()) return "Bạn cần nhập thông tin sản phẩm / dịch vụ.";
    }
    if (workflow === "improve" && improveSubmode === "improve" && !brief.sourceContent.trim()) {
      return "Bạn cần dán nội dung cần cải thiện.";
    }
    if (workflow === "improve" && improveSubmode === "style") {
      if (!brief.styleSample.trim()) return "Bạn cần dán văn bản mẫu để AI học văn phong.";
      if (!brief.styleTopic.trim()) return "Bạn cần nhập chủ đề muốn triển khai theo văn phong.";
    }
    if (workflow === "ideas" && !brief.product.trim()) return "Bạn cần nhập sản phẩm / dịch vụ.";
    return "";
  }

  async function generate() {
    const validationError = validate();
    setError(validationError);
    if (validationError) return;

    setOutput("");
    setIsGenerating(true);
    setStatus("Đang sản xuất nội dung...");
    try {
      const prompt = compilePromptByWorkflow({ workflow, improveSubmode, mode, brief });
      const text = await callGenerate([
        { role: "system", content: prompt.system },
        { role: "user", content: prompt.user },
      ]);
      setOutput(text);
      const item = {
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        mode,
        workflow,
        improveSubmode,
        brief,
        output: text,
        title: brief.topic || brief.product || brief.styleTopic || "Nội dung mới",
      };
      const next = [item, ...history].slice(0, 40);
      setHistory(next);
      writeJson(HISTORY_KEY, next);
      setStatus("");
    } catch (generateError) {
      setError(generateError.message);
      setStatus("");
    } finally {
      setIsGenerating(false);
    }
  }

  function loadHistory(item) {
    setMode(item.mode || "basic");
    setWorkflow(item.workflow || "write");
    setImproveSubmode(item.improveSubmode || "improve");
    setBrief({ ...createEmptyBrief(), ...item.brief });
    setOutput(item.output || "");
  }

  function selectMode(nextMode) {
    setMode(nextMode);
    setWorkflow("write");
    setOutput("");
    setError("");
    setStatus("");
  }

  function ctaLabel() {
    if (workflow === "improve" && improveSubmode === "style") return "Viết Theo Văn Phong 🧬";
    if (workflow === "improve") return "Cải Thiện Ngay ✨";
    if (workflow === "ideas") return "Gợi ý hook / ý tưởng 💡";
    if (mode === "entry") return "Tạo Nội Dung Ngay 🚀";
    return "Sản Xuất Nội Dung 🚀";
  }

  return (
    <main className="oneprompt-page">
      <section className="oneprompt-card">
        <div className="top-bar">
          <button
            className="theme-toggle"
            type="button"
            aria-label="Đổi giao diện"
            onClick={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
          >
            <span>{theme === "dark" ? "☾" : "☀️"}</span>
            <strong>{theme === "dark" ? "☀️" : "☾"}</strong>
          </button>
          <div className="top-actions">
            <button className="service-btn" type="button">
              💎 Gói dịch vụ
            </button>
            <button className="login-btn" type="button">
              ↪ Đăng nhập
            </button>
          </div>
        </div>

        <header className="brand-head">
          <div className="logo-mark">1prompt</div>
          <h1>1Prompt - Trợ lý Sáng tạo</h1>
          <p>1 Lệnh Ăn Ngay - Sản xuất nội dung siêu tốc cho Nhà sáng tạo</p>
        </header>

        <div className="divider" />

        <div className="mode-bar">
          <button className="intro-btn" type="button" onClick={() => setShowTutorial(true)}>
            📖 Giới thiệu
          </button>
          <nav className="mode-tabs">
            {MODES.map((item) => (
              <button type="button" key={item.id} className={mode === item.id ? "active" : ""} onClick={() => selectMode(item.id)}>
                {item.icon} {item.label}
              </button>
            ))}
          </nav>
        </div>

        <nav className="workflow-tabs">
          {WORKFLOWS.map((item) => (
            <button
              type="button"
              key={item.id}
              className={workflow === item.id ? "active" : ""}
              onClick={() => setWorkflow(item.id)}
            >
              <strong>
                {item.icon} {item.title}
              </strong>
              <small>{item.desc}</small>
            </button>
          ))}
        </nav>

        <details className="ai-settings">
          <summary>⚙️ Cấu hình AI</summary>
          <div className="model-grid">
            {MODEL_PRESETS.map((preset) => {
              const active = settings.model === preset.model && (settings.baseUrl || "") === preset.baseUrl;
              return (
                <button
                  key={preset.id}
                  type="button"
                  className={active ? "model-option active" : "model-option"}
                  onClick={() => setSettings((current) => applyModelPreset(current, preset))}
                >
                  <span>{preset.provider}</span>
                  <strong>{preset.label}</strong>
                  <code>{preset.model}</code>
                  <em>{preset.costLabel}</em>
                </button>
              );
            })}
          </div>
          <div className="settings-fields">
            <TextInput
              label="API key"
              value={settings.apiKey}
              placeholder="Dán API key của provider bạn chọn..."
              onChange={(apiKey) => setSettings((current) => ({ ...current, apiKey }))}
            />
            <TextInput
              label="Model"
              value={settings.model}
              placeholder="Tên model"
              onChange={(model) => setSettings((current) => ({ ...current, model }))}
            />
            <TextInput
              label="Base URL"
              value={settings.baseUrl}
              placeholder="Để trống nếu dùng OpenAI"
              onChange={(baseUrl) => setSettings((current) => ({ ...current, baseUrl }))}
            />
          </div>
        </details>

        {workflow === "write" ? (
          <WriteForm mode={mode} brief={brief} patchBrief={patchBrief} applyTemplate={applyTemplate} onGuide={() => setShowTutorial(true)} />
        ) : null}
        {workflow === "improve" ? (
          <ImproveForm submode={improveSubmode} setSubmode={setImproveSubmode} brief={brief} patchBrief={patchBrief} onGuide={() => setShowTutorial(true)} />
        ) : null}
        {workflow === "ideas" ? <IdeasForm brief={brief} patchBrief={patchBrief} onGuide={() => setShowTutorial(true)} /> : null}

        <div className="center-action">
          <button className="main-cta" type="button" disabled={isGenerating} onClick={generate}>
            {isGenerating ? "Đang xử lý..." : ctaLabel()}
          </button>
        </div>

        {error ? <Notice tone="error">⚠️ {error}</Notice> : null}
        {status ? <Notice>⏳ {status}</Notice> : null}

        <OutputSection output={output} briefSummary={briefSummary} history={history} loadHistory={loadHistory} regenerate={generate} />
        {mounted && showTutorial && (mode === "basic" || mode === "advanced") ? <TutorialOverlay onDone={() => setShowTutorial(false)} /> : null}
      </section>
    </main>
  );
}

function WriteForm({ mode, brief, patchBrief, applyTemplate, onGuide }) {
  if (mode === "entry") {
    return (
      <section className="form-section">
        <Notice tone="blue">
          ⚡ <strong>Chế độ Siêu Tốc</strong>
          <br />
          Dành cho người mới bắt đầu!
        </Notice>
        <p className="center-note">Chỉ cần trả lời vài câu hỏi, có ngay bài viết / kịch bản bán hàng hoặc review sản phẩm.</p>
        <Notice action onGuide={onGuide} />
        <TemplateStrip applyTemplate={applyTemplate} />
        <TextArea
          label="1. Sản phẩm của bạn là gì? Hướng đến đối tượng khách hàng nào?"
          optional
          rows={4}
          value={brief.product}
          placeholder="Ví dụ: Son dưỡng môi hữu cơ, dành cho Gen Z, giá tầm 150k, đang muốn quảng bá trên TikTok..."
          onChange={(product) => patchBrief({ product })}
        />
        <TextInput
          label="2. Hôm nay, bạn muốn viết về chủ đề gì?"
          required
          value={brief.topic}
          placeholder='Ví dụ: "son dưỡng môi cho da nhạy cảm", "review quán cafe mới mở"...'
          onChange={(topic) => patchBrief({ topic })}
        />
        <PillGroup
          label="3. Bạn muốn bài viết này mang lại cảm giác gì?"
          required
          options={QUICK_FEELINGS}
          value={brief.feeling}
          onChange={(feeling) => patchBrief({ feeling })}
        />
        <PillGroup
          label="4. Bạn sẽ đăng bài viết này ở đâu?"
          required
          options={["Facebook", "TikTok (kịch bản video ngắn)", "Instagram", "Website/Blog"]}
          value={brief.channel}
          onChange={(channel) => patchBrief({ channel, channels: [channel] })}
        />
        <ExtraPromptField mode={mode} brief={brief} patchBrief={patchBrief} />
        <PillGroup
          label="Số phiên bản nội dung"
          maxItems="Tối đa 10 phiên bản"
          options={["1", "2", "3", "5", "10"]}
          value={brief.variantCount}
          onChange={(variantCount) => patchBrief({ variantCount })}
        />
      </section>
    );
  }

  if (mode === "advanced") {
    return (
      <section className="form-section">
        <Notice action onGuide={onGuide} />
        <div className="mode-intro mode-intro-advanced">
          <div>
            <div className="section-chip purple">NÂNG CAO</div>
            <h2>Brief chiến lược cho nội dung cần kiểm soát sâu</h2>
            <p>Chọn tuyến nội dung, thông điệp, công thức, văn phong, CTA và tỷ lệ diễn đạt trước khi điền brief chung.</p>
          </div>
        </div>
        <AdvancedWriteFields brief={brief} patchBrief={patchBrief} />
        <BasicBriefFields mode={mode} brief={brief} patchBrief={patchBrief} />
      </section>
    );
  }

  return (
    <section className="form-section">
      <Notice action onGuide={onGuide} />
      <div className="mode-intro">
        <div>
          <div className="section-chip">CƠ BẢN</div>
          <h2>Brief chuẩn để tạo nội dung nhanh</h2>
          <p>Điền những thông tin cốt lõi về sản phẩm, khách hàng, kênh triển khai và mục tiêu đầu ra.</p>
        </div>
      </div>
      <BasicBriefFields mode={mode} brief={brief} patchBrief={patchBrief} />
    </section>
  );
}

function BasicBriefFields({ mode, brief, patchBrief }) {
  return (
    <>
      <PillGroup
        label="Thương hiệu / Sản phẩm & Mục đích"
        required
        options={BRAND_PURPOSES}
        value={brief.goals?.[0] || BRAND_PURPOSES[0]}
        onChange={(goal) => patchBrief({ goals: [goal] })}
      />
      <TextArea
        label="Thông tin sản phẩm / dịch vụ"
        required
        rows={4}
        value={brief.product}
        placeholder="Ví dụ: Tôi cần quảng bá sản phẩm phần mềm quản lý Fanpage tự động F-Manager..."
        onChange={(product) => patchBrief({ product })}
      >
        <p className="field-hint">💡 Nhập USP, điểm khác biệt, giá, ưu đãi hoặc file tham khảo nếu có.</p>
      </TextArea>
      <PillGroup
        label="Bạn đã có ý tưởng / Hook chưa?"
        options={["Đã có", "Chưa (Để AI ngẫu nhiên)"]}
        value={brief.hasHook}
        onChange={(hasHook) => patchBrief({ hasHook })}
      />
      <PillGroup label="Kênh triển khai" required multi options={CHANNELS} value={brief.channels} onChange={(channels) => patchBrief({ channels })} />
      <TextArea
        label="Khách hàng mục tiêu / khán giả mục tiêu"
        required
        hint
        rows={4}
        value={brief.audience}
        placeholder="Ví dụ: Minh Anh, 24 tuổi, ở TP.HCM... Insight: cô ấy không chỉ sợ thuyết trình..."
        onChange={(audience) => patchBrief({ audience })}
      >
        <p className="field-hint">💡 Bao gồm: chân dung khách hàng, insight, nỗi đau, vấn đề. Càng chi tiết càng tốt.</p>
      </TextArea>
      <PillGroup label="Mục tiêu kinh doanh / marketing" required multi options={GOALS} value={brief.goals} onChange={(goals) => patchBrief({ goals })} />
      <PillGroup label="Mục tiêu đầu ra" required multi options={FORMATS} value={brief.formats} onChange={(formats) => patchBrief({ formats })} />
      <PillGroup label="Định dạng nội dung" options={["Text trơn", "Bảng"]} value={brief.contentShape} onChange={(contentShape) => patchBrief({ contentShape })} />
      <PillGroup label="Độ dài nội dung" options={["Số từ", "Số giây", "Số đoạn"]} value={brief.lengthType} onChange={(lengthType) => patchBrief({ lengthType })} />
      <ExtraPromptField mode={mode} brief={brief} patchBrief={patchBrief} />
      <PillGroup
        label="Số phiên bản nội dung"
        maxItems="Tối đa 10 phiên bản"
        options={["1", "2", "3", "5", "10"]}
        value={brief.variantCount}
        onChange={(variantCount) => patchBrief({ variantCount })}
      />
    </>
  );
}

function ExtraPromptField({ mode, brief, patchBrief }) {
  return (
    <>
      <TextArea
        label="Prompt bổ sung"
        optional
        rows={mode === "advanced" ? 4 : 3}
        value={brief.extra}
        placeholder={`Ví dụ:
- Không dùng từ sáo rỗng
- Tác giả xưng "mình", gọi người đọc là "các bạn"
- Đoạn mở đầu bắt buộc là một câu hỏi gây sốc hoặc tò mò
- Không viết câu nào dài quá 20 chữ`}
        onChange={(extra) => patchBrief({ extra })}
      />
      <p className="power-hint">
        💡 <strong>Quyền lực tối đa:</strong> Đây là nơi bạn thiết lập luật chơi riêng với hệ thống.
      </p>
    </>
  );
}

function AdvancedWriteFields({ brief, patchBrief }) {
  return (
    <section className="advanced-panel">
      <PillGroup
        label="AI gợi ý / Ngẫu nhiên / Tự chọn"
        options={["AI gợi ý", "Ngẫu nhiên", "Tự chọn"]}
        value={brief.advancedMode || "AI gợi ý"}
        onChange={(advancedMode) => patchBrief({ advancedMode })}
      />
      <Notice>💡 AI sẽ tự động chọn tuyến nội dung, thông điệp, công thức, văn phong và CTA phù hợp nhất cho nội dung của bạn.</Notice>
      <PillGroup label="Tuyến nội dung" optional multi options={CONTENT_LINES} value={brief.contentLines} onChange={(contentLines) => patchBrief({ contentLines })} />
      <TextArea label="Thông điệp chính" optional rows={3} value={brief.mainMessage} placeholder="Ngẫu nhiên" onChange={(mainMessage) => patchBrief({ mainMessage })} />
      <TextArea label="Thông điệp phụ" optional rows={3} value={brief.subMessage} placeholder="Ngẫu nhiên" onChange={(subMessage) => patchBrief({ subMessage })} />
      <PillGroup label="Công thức nội dung" multi options={FORMULAS} value={[brief.formula]} onChange={(values) => patchBrief({ formula: values.at(-1) || "AIDA" })} />
      <PillGroup label="Văn phong" multi options={CONTENT_STYLES} value={[brief.style]} onChange={(values) => patchBrief({ style: values.at(-1) || "Kể chuyện" })} />
      <PillGroup
        label="Bạn muốn khách hàng / độc giả làm gì?"
        options={["Mua ngay", "Để lại thông tin", "Đăng ký nhận tài liệu", "Follow kênh", "Tag bạn bè", "Bình luận", "Chia sẻ nội dung", "Săn sale ngay"]}
        value={brief.cta}
        onChange={(cta) => patchBrief({ cta })}
      />
      <RatioSlider
        label="Tỷ lệ Văn nói – Văn viết"
        value={brief.vocabRatioValue ?? 50}
        onChange={(vocabRatioValue) => patchBrief({ vocabRatioValue })}
        leftLabel="Văn nói"
        rightLabel="Văn viết"
      />
      <RatioSlider
        label="Tỷ lệ Định tính – Định lượng"
        value={brief.qualityRatioValue ?? 50}
        onChange={(qualityRatioValue) => patchBrief({ qualityRatioValue })}
        leftLabel="Định tính"
        rightLabel="Định lượng"
      />
      <TextArea label="Số liệu - bằng chứng uy tín" optional hint rows={3} value={brief.evidence} placeholder="Ngẫu nhiên" onChange={(evidence) => patchBrief({ evidence })} />
    </section>
  );
}

function ImproveForm({ submode, setSubmode, brief, patchBrief, onGuide }) {
  return (
    <section className="form-section">
      <Notice action onGuide={onGuide} />
      <div className="submode-tabs">
        <button type="button" className={submode === "improve" ? "active" : ""} onClick={() => setSubmode("improve")}>
          ✨ Đánh giá, cải thiện nội dung
        </button>
        <button type="button" className={submode === "style" ? "active" : ""} onClick={() => setSubmode("style")}>
          🧬 Học văn phong → viết bài mới
        </button>
      </div>
      {submode === "improve" ? (
        <>
          <TextArea
            label="Dán nội dung cần cải thiện vào đây"
            required
            rows={7}
            value={brief.sourceContent}
            placeholder="Dán nội dung bạn đã có ở đây... Ví dụ: bài đăng Facebook cũ, chú thích bài đăng, kịch bản video..."
            onChange={(sourceContent) => patchBrief({ sourceContent })}
          />
          <PillGroup label="Bạn muốn cải thiện phần nào?" optional multi options={IMPROVE_TYPES} value={brief.improveTypes} onChange={(improveTypes) => patchBrief({ improveTypes })} />
        </>
      ) : (
        <>
          <TextArea
            label="Dán văn bản gốc để AI phân tích cấu trúc, giọng điệu và từ vựng"
            required
            rows={7}
            value={brief.styleSample}
            placeholder="Dán bài viết mẫu có văn phong (DNA) bạn muốn AI học theo..."
            onChange={(styleSample) => patchBrief({ styleSample })}
          />
          <TextArea
            label="Nhập chủ đề bạn muốn tôi triển khai theo văn phong / DNA trên"
            required
            rows={4}
            value={brief.styleTopic}
            placeholder="Ví dụ: Giới thiệu khoá học Marketing, review serum Vitamin C..."
            onChange={(styleTopic) => patchBrief({ styleTopic })}
          />
          <TextArea
            label="Đưa ra yêu cầu khác"
            optional
            rows={4}
            value={brief.styleExtra}
            placeholder='Ví dụ: "Viết 2 phiên bản", "Độ dài khoảng 300 chữ", "Thêm CTA cuối bài"...'
            onChange={(styleExtra) => patchBrief({ styleExtra })}
          />
        </>
      )}
    </section>
  );
}

function IdeasForm({ brief, patchBrief, onGuide }) {
  return (
    <section className="form-section">
      <Notice action onGuide={onGuide} />
      <TextInput
        label="Sản phẩm / Dịch vụ"
        hint
        value={brief.product}
        placeholder="Ví dụ: Kem chống nắng Hàn Quốc, Khoá học Marketing..."
        onChange={(product) => patchBrief({ product })}
      />
      <TextArea
        label="Khách hàng mục tiêu / khán giả mục tiêu"
        required
        hint
        rows={4}
        value={brief.audience}
        placeholder="Ví dụ: Minh Anh, 24 tuổi... Insight: cô ấy không chỉ sợ thuyết trình..."
        onChange={(audience) => patchBrief({ audience })}
      >
        <p className="field-hint">💡 Bao gồm: chân dung khách hàng, insight, nỗi đau, vấn đề. Càng chi tiết càng tốt.</p>
      </TextArea>
      <PillGroup label="Mục tiêu kinh doanh / marketing" multi options={GOALS} value={brief.goals} onChange={(goals) => patchBrief({ goals })} />
      <PillGroup label="Số lượng ý tưởng" maxItems="Tối đa 50" options={IDEA_COUNTS} value={brief.ideaCount} onChange={(ideaCount) => patchBrief({ ideaCount })} />
    </section>
  );
}

function TemplateStrip({ applyTemplate }) {
  return (
    <section className="template-strip">
      <strong>⚡ Bắt đầu nhanh</strong>
      <span>Chọn 1 template - toàn bộ form sẽ tự điền, bạn chỉ cần chỉnh nhẹ.</span>
      <div>
        {TEMPLATE_PRESETS.map((template) => (
          <button key={template.id} type="button" onClick={() => applyTemplate(template)}>
            {template.label}
          </button>
        ))}
      </div>
    </section>
  );
}

function OutputSection({ output, briefSummary, history, loadHistory, regenerate }) {
  return (
    <section className="output-zone">
      <ResultBlock title="Kết quả" text={output} onRegenerate={regenerate} />
      <details className="brief-debug">
        <summary>Brief đang dùng</summary>
        <pre>{briefSummary || "Chưa có brief."}</pre>
      </details>
      <details className="brief-debug">
        <summary>Lịch sử local ({history.length})</summary>
        <div className="history-list">
          {history.map((item) => (
            <button key={item.id} type="button" onClick={() => loadHistory(item)}>
              <strong>{item.title}</strong>
              <small>{new Date(item.createdAt).toLocaleString("vi-VN")}</small>
            </button>
          ))}
        </div>
      </details>
    </section>
  );
}
