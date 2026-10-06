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

const HISTORY_KEY = "sua-bai-history";
const SETTINGS_KEY = "sua-bai-settings";
const THEME_KEY = "sua-bai-theme";
const TUTORIAL_KEY = "sua-bai-tutorial-done";

const DEFAULT_SETTINGS = {
  model: "gpt-5.4-mini",
  baseUrl: "",
  apiKey: "",
};

const MODES = [
  { id: "entry", icon: "⚡", label: "Tạo nhanh", desc: "Ít bước, có bản nháp ngay" },
  { id: "basic", icon: "🔥", label: "Biên soạn", desc: "Điều khiển các yếu tố chính" },
  { id: "advanced", icon: "🔮", label: "Chuyên sâu", desc: "Thiết kế nội dung có chủ đích" },
];

const WORKFLOWS = [
  {
    id: "write",
    code: "VN",
    title: "Soạn mới",
    desc: "Tạo bài đăng, kịch bản hoặc dàn ý",
  },
  {
    id: "improve",
    code: "CT",
    title: "Chỉnh sửa",
    desc: "Nâng chất lượng một bản viết có sẵn",
  },
  {
    id: "ideas",
    code: "YT",
    title: "Mở hướng",
    desc: "Tìm góc tiếp cận và ý tưởng triển khai",
  },
];

const QUICK_FEELINGS = [
  "😄 Tươi vui, gần gũi",
  "🥰 Chân thành, thấu hiểu",
  "🦉 Chắc chắn, đáng tin",
  "🔥 Khẩn trương, thôi thúc",
];

const BRAND_PURPOSES = [
  "📢 Giới thiệu giải pháp",
  "📚 Nuôi dưỡng cộng đồng",
  "🌟 Tạo dấu ấn cá nhân",
];

const IDEA_COUNTS = ["3 hướng", "5 hướng", "7 hướng", "10 hướng"];

const TUTORIAL_STEPS = [
  {
    title: "Chọn cách bạn muốn bắt đầu",
    body: "Tạo nhanh dành cho một yêu cầu gọn. Biên soạn giúp kiểm soát các yếu tố chính. Chuyên sâu phù hợp với nội dung cần định hướng chiến lược.",
  },
  {
    title: "Cung cấp đúng dữ liệu đầu vào",
    body: "Hãy ưu tiên thông tin về giải pháp, người đọc, mục tiêu và kênh đăng. Hệ thống sẽ dựa vào đó để đưa ra bản viết phù hợp.",
  },
  {
    title: "Chốt tiêu chuẩn cho bản viết",
    body: "Tại mục Yêu cầu riêng, bạn có thể quy định cách xưng hô, độ dài, lời kêu gọi hành động và những điều cần tránh.",
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
  return <b className="required-badge">CẦN NHẬP</b>;
}

function OptionalHint() {
  return <span className="optional-hint">(không bắt buộc)</span>;
}

function FieldLabel({ children, required, optional, hint }) {
  return (
    <div className="field-label">
      <span>{children}</span>
      {required ? <RequiredBadge /> : null}
      {optional ? <OptionalHint /> : null}
      {hint ? (
        <button className="suggest-mini" type="button">
          Gợi mở
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
          Thêm lựa chọn
        </button>
      </div>
      {showCustom ? (
        <div className="custom-pill-input">
          <input
            value={customValue}
            placeholder="Nhập lựa chọn khác..."
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
            Xác nhận
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
          Đóng hướng dẫn
          </button>
          <button
            type="button"
            className="tutorial-next"
            onClick={() => (step < TUTORIAL_STEPS.length - 1 ? setStep(step + 1) : finish())}
          >
            {step < TUTORIAL_STEPS.length - 1 ? "Xem tiếp" : "Bắt đầu"}
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
          Chưa có đủ thông tin? Nhập <b className="highlight-keyword">&quot;để hệ thống đề xuất&quot;</b> tại trường tương ứng.
        </span>
        <button className="guide-btn" type="button" onClick={onGuide}>
          Cách sử dụng
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
            {copied ? "Đã sao chép" : "Sao chép"}
          </button>
          <button type="button" className="result-action-btn regen" onClick={onRegenerate}>
            Tạo lại
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
  const [theme, setTheme] = useState("light");
  const [showTutorial, setShowTutorial] = useState(false);
  const [output, setOutput] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      const storedSettings = readJson(SETTINGS_KEY, {});
      const storedHistory = readJson(HISTORY_KEY, []);
      const storedTheme = window.localStorage.getItem(THEME_KEY) || "light";

      setSettings({ ...DEFAULT_SETTINGS, ...storedSettings });
      setHistory(storedHistory);
      setTheme(storedTheme);
      setShowTutorial(false);
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
      throw new Error(data?.error || "Hệ thống chưa kết nối được với mô hình AI. Vui lòng kiểm tra cấu hình và thử lại.");
    }
    return data.text || "";
  }

  function validate() {
    if (!settings.apiKey.trim()) return "Hãy thêm API key trong mục Kết nối AI trước khi tạo nội dung.";
    if (workflow === "write") {
      if (mode === "entry" && !brief.topic.trim()) return "Hãy cho biết chủ đề bạn muốn triển khai.";
      if (mode !== "entry" && !brief.product.trim()) return "Hãy mô tả sản phẩm, dịch vụ hoặc vấn đề cần truyền đạt.";
    }
    if (workflow === "improve" && improveSubmode === "improve" && !brief.sourceContent.trim()) {
      return "Hãy dán bản nội dung bạn muốn chỉnh sửa.";
    }
    if (workflow === "improve" && improveSubmode === "style") {
      if (!brief.styleSample.trim()) return "Hãy cung cấp một đoạn mẫu để hệ thống nhận diện cách viết.";
      if (!brief.styleTopic.trim()) return "Hãy nhập chủ đề cần viết theo phong cách vừa phân tích.";
    }
    if (workflow === "ideas" && !brief.product.trim()) return "Hãy cho biết đối tượng hoặc giải pháp cần phát triển ý tưởng.";
    return "";
  }

  async function generate() {
    const validationError = validate();
    setError(validationError);
    if (validationError) return;

    setOutput("");
    setIsGenerating(true);
    setStatus("Đang tạo bản viết theo thông tin bạn cung cấp...");
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
        title: brief.topic || brief.product || brief.styleTopic || "Bản viết chưa đặt tên",
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
    if (workflow === "improve" && improveSubmode === "style") return "Tạo bản viết theo mẫu";
    if (workflow === "improve") return "Chỉnh sửa bản viết";
    if (workflow === "ideas") return "Mở danh sách ý tưởng";
    if (mode === "entry") return "Tạo bản nháp";
    return "Tạo bản nội dung";
  }

  return (
    <main className="sua-bai-page">
      <section className="sua-bai-workspace">
        <aside className="workspace-rail">
          <header className="brand-head">
            <div className="brand-lockup">
              <div className="logo-mark">SB</div>
              <div>
                <h1>Sửa Bài</h1>
                <p>Không gian biên tập cùng AI</p>
              </div>
            </div>
          </header>

          <div className="rail-group-label">Mức độ kiểm soát</div>
          <nav className="mode-tabs" aria-label="Mức độ kiểm soát nội dung">
            {MODES.map((item) => (
              <button type="button" key={item.id} className={mode === item.id ? "active" : ""} onClick={() => selectMode(item.id)}>
                <span className="mode-glyph" aria-hidden="true">{item.icon}</span>
                <span className="nav-copy">
                  <strong>{item.label}</strong>
                  <small>{item.desc}</small>
                </span>
              </button>
            ))}
          </nav>

          <div className="rail-group-label">Bạn muốn làm gì?</div>
          <nav className="workflow-tabs" aria-label="Tác vụ nội dung">
            {WORKFLOWS.map((item) => (
              <button
                type="button"
                key={item.id}
                className={workflow === item.id ? "active" : ""}
                onClick={() => setWorkflow(item.id)}
              >
                <span className="workflow-code" aria-hidden="true">{item.code}</span>
                <span className="nav-copy">
                  <strong>{item.title}</strong>
                  <small>{item.desc}</small>
                </span>
              </button>
            ))}
          </nav>

          <details className="ai-settings">
            <summary>Kết nối AI</summary>
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
              <TextInput label="Khóa truy cập API" value={settings.apiKey} placeholder="Nhập khóa của nhà cung cấp..." onChange={(apiKey) => setSettings((current) => ({ ...current, apiKey }))} />
              <TextInput label="Mô hình" value={settings.model} placeholder="Tên mô hình AI" onChange={(model) => setSettings((current) => ({ ...current, model }))} />
              <TextInput label="Địa chỉ API tùy chỉnh" value={settings.baseUrl} placeholder="Có thể để trống khi dùng OpenAI" onChange={(baseUrl) => setSettings((current) => ({ ...current, baseUrl }))} />
            </div>
          </details>

          <div className="rail-foot">Từ thông tin thô đến một bản viết có mục tiêu.</div>
        </aside>

        <div className="workspace-main">
          <div className="top-bar">
            <div className="top-context">
              <span>Sửa Bài</span>
              <strong>Bàn biên tập</strong>
            </div>
            <div className="top-actions">
              <button className="intro-btn" type="button" onClick={() => setShowTutorial(true)}>Cách dùng</button>
              <button className="theme-toggle" type="button" aria-label="Đổi giao diện" onClick={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}>
                {theme === "dark" ? "Nền sáng" : "Nền tối"}
              </button>
              <button className="service-btn" type="button">Nâng cấp</button>
              <button className="login-btn" type="button">Tài khoản</button>
            </div>
          </div>

          <div className="workspace-content">
            <header className="page-heading">
              <div>
                <span className="page-kicker">BÀN BIÊN TẬP</span>
                <h2>{workflow === "write" ? "Tạo một bản viết mới" : workflow === "improve" ? "Làm tốt hơn bản hiện có" : "Tìm hướng triển khai"}</h2>
                <p>Đưa thông tin vào, chọn mức kiểm soát và nhận bản nội dung phù hợp với mục tiêu sử dụng.</p>
              </div>
              <span className="mode-status">{MODES.find((item) => item.id === mode)?.label}</span>
            </header>

            <div className="editor-layout">
              <div className="editor-column">
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
                {error ? <div role="alert"><Notice tone="error">⚠ {error}</Notice></div> : null}
                {status ? <div role="status" aria-live="polite"><Notice>Đang xử lý: {status}</Notice></div> : null}
              </div>

              <OutputSection output={output} briefSummary={briefSummary} history={history} loadHistory={loadHistory} regenerate={generate} />
            </div>
          </div>
        </div>
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
          ⚡ <strong>Tạo nhanh</strong>
          <br />
          Đi thẳng từ ý định đến bản nháp đầu tiên.
        </Notice>
        <p className="center-note">Cung cấp bối cảnh ngắn, chủ đề, sắc thái và nơi đăng. Phần còn lại sẽ được hệ thống đề xuất.</p>
        <Notice action onGuide={onGuide} />
        <TemplateStrip applyTemplate={applyTemplate} />
        <TextArea
          label="Bạn đang muốn giới thiệu điều gì, cho ai?"
          optional
          rows={4}
          value={brief.product}
          placeholder="Ví dụ: Dịch vụ giao rau sạch theo tuần dành cho gia đình trẻ bận rộn tại TP.HCM..."
          onChange={(product) => patchBrief({ product })}
        />
        <TextInput
          label="Trọng tâm của bản viết là gì?"
          required
          value={brief.topic}
          placeholder="Ví dụ: Vì sao đặt rau theo tuần giúp gia đình tiết kiệm thời gian và hạn chế lãng phí"
          onChange={(topic) => patchBrief({ topic })}
        />
        <PillGroup
          label="Người đọc nên cảm nhận điều gì?"
          required
          options={QUICK_FEELINGS}
          value={brief.feeling}
          onChange={(feeling) => patchBrief({ feeling })}
        />
        <PillGroup
          label="Nội dung sẽ xuất hiện ở đâu?"
          required
          options={["Facebook", "TikTok (kịch bản video ngắn)", "Instagram", "Website/Blog"]}
          value={brief.channel}
          onChange={(channel) => patchBrief({ channel, channels: [channel] })}
        />
        <ExtraPromptField mode={mode} brief={brief} patchBrief={patchBrief} />
        <PillGroup
          label="Số phương án cần nhận"
          maxItems="Bạn có thể tạo tối đa 10 phương án"
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
            <div className="section-chip purple">CHUYÊN SÂU</div>
            <h2>Thiết kế logic truyền đạt trước khi viết</h2>
            <p>Xác lập góc tiếp cận, thông điệp, cấu trúc thuyết phục, giọng điệu và hành động mong muốn.</p>
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
          <div className="section-chip">BIÊN SOẠN</div>
          <h2>Xây bản viết từ những dữ liệu quan trọng</h2>
          <p>Mô tả điều cần truyền đạt, người cần thuyết phục, mục tiêu sử dụng và hình thức đầu ra.</p>
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
        label="Vai trò của nội dung này"
        required
        options={BRAND_PURPOSES}
        value={brief.goals?.[0] || BRAND_PURPOSES[0]}
        onChange={(goal) => patchBrief({ goals: [goal] })}
      />
      <TextArea
        label="Thông tin nền cần đưa vào bản viết"
        required
        rows={4}
        value={brief.product}
        placeholder="Mô tả giải pháp, điểm khác biệt, mức giá, ưu đãi và điều người đọc cần hiểu..."
        onChange={(product) => patchBrief({ product })}
      >
        <p className="field-hint">Thông tin càng cụ thể, bản viết càng ít chung chung.</p>
      </TextArea>
      <PillGroup
        label="Bạn đã có câu mở đầu hoặc góc tiếp cận chưa?"
        options={["Tôi đã có hướng", "Để hệ thống đề xuất"]}
        value={brief.hasHook}
        onChange={(hasHook) => patchBrief({ hasHook })}
      />
      <PillGroup label="Nơi nội dung được sử dụng" required multi options={CHANNELS} value={brief.channels} onChange={(channels) => patchBrief({ channels })} />
      <TextArea
        label="Người đọc bạn muốn tác động"
        required
        hint
        rows={4}
        value={brief.audience}
        placeholder="Ví dụ: Quản lý nhóm 28-40 tuổi, thường thiếu thời gian tổng hợp báo cáo và ngại thay đổi công cụ..."
        onChange={(audience) => patchBrief({ audience })}
      >
        <p className="field-hint">Nêu hoàn cảnh, nhu cầu, rào cản và điều khiến họ cân nhắc hành động.</p>
      </TextArea>
      <PillGroup label="Kết quả truyền thông mong muốn" required multi options={GOALS} value={brief.goals} onChange={(goals) => patchBrief({ goals })} />
      <PillGroup label="Loại bản thảo cần tạo" required multi options={FORMATS} value={brief.formats} onChange={(formats) => patchBrief({ formats })} />
      <PillGroup label="Cách trình bày" options={["Văn bản", "Bảng thông tin"]} value={brief.contentShape} onChange={(contentShape) => patchBrief({ contentShape })} />
      <PillGroup label="Đơn vị đo độ dài" options={["Số từ", "Thời lượng", "Số đoạn"]} value={brief.lengthType} onChange={(lengthType) => patchBrief({ lengthType })} />
      <ExtraPromptField mode={mode} brief={brief} patchBrief={patchBrief} />
      <PillGroup
        label="Số phương án cần nhận"
        maxItems="Bạn có thể tạo tối đa 10 phương án"
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
        label="Yêu cầu riêng cho bản viết"
        optional
        rows={mode === "advanced" ? 4 : 3}
        value={brief.extra}
        placeholder={`Ví dụ:
- Xưng "chúng tôi", gọi người đọc là "bạn"
- Không dùng lời hứa tuyệt đối hoặc số liệu chưa được cung cấp
- Mở đầu bằng một tình huống quen thuộc
- Mỗi đoạn không quá ba câu`}
        onChange={(extra) => patchBrief({ extra })}
      />
      <p className="power-hint">
        <strong>Tiêu chuẩn biên tập:</strong> Những yêu cầu tại đây sẽ được ưu tiên khi tạo bản viết.
      </p>
    </>
  );
}

function AdvancedWriteFields({ brief, patchBrief }) {
  return (
    <section className="advanced-panel">
      <PillGroup
        label="Cách xác định chiến lược triển khai"
        options={["Hệ thống đề xuất", "Khám phá phương án mới", "Tôi tự thiết lập"]}
        value={brief.advancedMode || "Hệ thống đề xuất"}
        onChange={(advancedMode) => patchBrief({ advancedMode })}
      />
      <Notice>Hệ thống có thể đề xuất góc tiếp cận, cấu trúc, giọng điệu và lời kêu gọi hành động dựa trên dữ liệu nền.</Notice>
      <PillGroup label="Góc triển khai" optional multi options={CONTENT_LINES} value={brief.contentLines} onChange={(contentLines) => patchBrief({ contentLines })} />
      <TextArea label="Ý chính người đọc cần nhớ" optional rows={3} value={brief.mainMessage} placeholder="Để hệ thống đề xuất" onChange={(mainMessage) => patchBrief({ mainMessage })} />
      <TextArea label="Ý bổ trợ cần đưa vào" optional rows={3} value={brief.subMessage} placeholder="Để hệ thống đề xuất" onChange={(subMessage) => patchBrief({ subMessage })} />
      <PillGroup label="Khung thuyết phục" multi options={FORMULAS} value={[brief.formula]} onChange={(values) => patchBrief({ formula: values.at(-1) || "AIDA" })} />
      <PillGroup label="Giọng thể hiện" multi options={CONTENT_STYLES} value={[brief.style]} onChange={(values) => patchBrief({ style: values.at(-1) || "Kể chuyện" })} />
      <PillGroup
        label="Hành động mong muốn sau khi đọc"
        options={["Tìm hiểu sản phẩm", "Để lại thông tin", "Nhận tài liệu", "Theo dõi kênh", "Gửi cho người quen", "Tham gia thảo luận", "Chia sẻ bài viết", "Xem ưu đãi"]}
        value={brief.cta}
        onChange={(cta) => patchBrief({ cta })}
      />
      <RatioSlider
        label="Mức độ hội thoại và trang trọng"
        value={brief.vocabRatioValue ?? 50}
        onChange={(vocabRatioValue) => patchBrief({ vocabRatioValue })}
        leftLabel="Gần lời nói"
        rightLabel="Trang trọng"
      />
      <RatioSlider
        label="Mức độ cảm nhận và dữ liệu"
        value={brief.qualityRatioValue ?? 50}
        onChange={(qualityRatioValue) => patchBrief({ qualityRatioValue })}
        leftLabel="Cảm nhận"
        rightLabel="Dữ liệu"
      />
      <TextArea label="Thông tin kiểm chứng có thể sử dụng" optional hint rows={3} value={brief.evidence} placeholder="Nêu nguồn, số liệu hoặc để hệ thống bỏ qua mục này" onChange={(evidence) => patchBrief({ evidence })} />
    </section>
  );
}

function ImproveForm({ submode, setSubmode, brief, patchBrief, onGuide }) {
  return (
    <section className="form-section">
      <Notice action onGuide={onGuide} />
      <div className="submode-tabs">
        <button type="button" className={submode === "improve" ? "active" : ""} onClick={() => setSubmode("improve")}>
          Chỉnh sửa bản hiện có
        </button>
        <button type="button" className={submode === "style" ? "active" : ""} onClick={() => setSubmode("style")}>
          Viết mới theo mẫu tham chiếu
        </button>
      </div>
      {submode === "improve" ? (
        <>
          <TextArea
            label="Bản nội dung cần chỉnh sửa"
            required
            rows={7}
            value={brief.sourceContent}
            placeholder="Dán bài đăng, email, kịch bản hoặc đoạn văn bạn muốn làm rõ và nâng chất lượng..."
            onChange={(sourceContent) => patchBrief({ sourceContent })}
          />
          <PillGroup label="Bạn muốn thay đổi điều gì?" optional multi options={IMPROVE_TYPES} value={brief.improveTypes} onChange={(improveTypes) => patchBrief({ improveTypes })} />
        </>
      ) : (
        <>
          <TextArea
            label="Mẫu viết dùng để tham chiếu phong cách"
            required
            rows={7}
            value={brief.styleSample}
            placeholder="Dán một đoạn thể hiện rõ nhịp câu, cách dùng từ và sắc thái bạn muốn giữ lại..."
            onChange={(styleSample) => patchBrief({ styleSample })}
          />
          <TextArea
            label="Nội dung mới cần triển khai"
            required
            rows={4}
            value={brief.styleTopic}
            placeholder="Ví dụ: Thư giới thiệu chương trình đào tạo quản lý cho doanh nghiệp vừa..."
            onChange={(styleTopic) => patchBrief({ styleTopic })}
          />
          <TextArea
            label="Điều kiện bổ sung"
            optional
            rows={4}
            value={brief.styleExtra}
            placeholder="Ví dụ: Tạo hai phương án, khoảng 300 từ, kết thúc bằng lời mời đăng ký tư vấn..."
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
        label="Chủ thể cần phát triển ý tưởng"
        hint
        value={brief.product}
        placeholder="Ví dụ: Ứng dụng quản lý chi tiêu dành cho người mới đi làm..."
        onChange={(product) => patchBrief({ product })}
      />
      <TextArea
        label="Nhóm người bạn muốn tiếp cận"
        required
        hint
        rows={4}
        value={brief.audience}
        placeholder="Ví dụ: Người mới đi làm 22-28 tuổi, thu nhập chưa ổn định, muốn quản lý tiền nhưng ngại ghi chép..."
        onChange={(audience) => patchBrief({ audience })}
      >
        <p className="field-hint">Mô tả hoàn cảnh, nhu cầu, rào cản và điều họ đang quan tâm.</p>
      </TextArea>
      <PillGroup label="Kết quả muốn hướng tới" multi options={GOALS} value={brief.goals} onChange={(goals) => patchBrief({ goals })} />
      <PillGroup label="Số hướng triển khai" maxItems="Có thể yêu cầu tối đa 50 hướng" options={IDEA_COUNTS} value={brief.ideaCount} onChange={(ideaCount) => patchBrief({ ideaCount })} />
    </section>
  );
}

function TemplateStrip({ applyTemplate }) {
  return (
    <section className="template-strip">
      <strong>Dùng tình huống mẫu</strong>
      <span>Chọn một ngành gần với nhu cầu của bạn, sau đó thay lại thông tin cho phù hợp.</span>
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
      {!output ? (
        <div className="output-empty">
          <strong>Bản viết sẽ xuất hiện tại đây</strong>
          <span>Hoàn tất các thông tin cần thiết rồi chọn nút tạo nội dung ở cuối biểu mẫu.</span>
        </div>
      ) : null}
      <ResultBlock title="Bản nội dung" text={output} onRegenerate={regenerate} />
      <details className="brief-debug">
        <summary>Tóm tắt dữ liệu đầu vào</summary>
        <pre>{briefSummary || "Chưa có dữ liệu để tóm tắt."}</pre>
      </details>
      <details className="brief-debug">
        <summary>Các bản đã tạo trên thiết bị ({history.length})</summary>
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
