"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
import { createWorkflowBriefs, validateWorkspace } from "../lib/workflow-state.js";

const HISTORY_KEY = "sua-bai-history";
const SETTINGS_KEY = "sua-bai-settings";
const THEME_KEY = "sua-bai-theme";
const TUTORIAL_KEY = "sua-bai-tutorial-done";

const DEFAULT_SETTINGS = {
  providerId: "openai",
  model: "gpt-5.4-mini",
  baseUrl: "",
  apiKey: "",
};

const MODES = [
  { id: "entry", icon: "⚡", label: "Nháp nhanh", desc: "Một yêu cầu, một bản đầu tiên" },
  { id: "basic", icon: "🔥", label: "Dựng bài", desc: "Xây brief theo bốn chặng" },
  { id: "advanced", icon: "🔮", label: "Chỉ đạo", desc: "Kiểm soát lập luận và giọng" },
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

const IDEA_COUNTS = ["3 hướng", "5 hướng", "7 hướng", "10 hướng"];

const WRITE_TUTORIAL_STEPS = [
  {
    title: "Chọn cách bạn muốn bắt đầu",
    body: "Nháp nhanh nhận một yêu cầu gọn. Dựng bài dẫn bạn qua bốn chặng. Chỉ đạo cho phép kiểm soát lập luận và cách thể hiện.",
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

const WORKFLOW_TUTORIAL_STEPS = {
  improve: [
    { title: "Chọn đúng kiểu biên tập", body: "Dùng Chỉnh sửa khi đã có bản gốc. Dùng Viết theo mẫu khi muốn học cách diễn đạt từ một đoạn tham chiếu." },
    { title: "Giữ dữ kiện gốc", body: "Dán đầy đủ tên riêng, số liệu và nội dung bắt buộc. Hệ thống chỉ thay đổi những điểm bạn chọn." },
    { title: "Biên tập tiếp trên kết quả", body: "Kết quả có thể sửa trực tiếp, sao chép hoặc tạo lại trước khi đưa vào sử dụng." },
  ],
  ideas: [
    { title: "Xác định vùng cần khai phá", body: "Nêu rõ chủ thể và người đọc để các hướng đề xuất không bị chung chung." },
    { title: "Chọn quy mô khám phá", body: "Tạo ít hướng để đào sâu hoặc nhiều hướng để mở rộng phạm vi lựa chọn." },
    { title: "Đưa hướng tốt sang bàn soạn", body: "Sau khi có kết quả, dùng nút Đưa sang Soạn mới để tiếp tục phát triển thành bản hoàn chỉnh." },
  ],
};

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

function BriefBlock({ step, eyebrow, title, description, tone = "", children }) {
  return (
    <section className={`brief-block ${tone ? `brief-block-${tone}` : ""}`}>
      <header className="brief-block-head">
        <span className="brief-step" aria-hidden="true">{step}</span>
        <div>
          <span className="brief-eyebrow">{eyebrow}</span>
          <h3>{title}</h3>
          <p>{description}</p>
        </div>
      </header>
      <div className="brief-block-body">{children}</div>
    </section>
  );
}

function TextArea({ label, value, onChange, placeholder, required, optional, hint, rows = 4, children, fieldKey, fieldError }) {
  return (
    <label className={`form-field ${fieldError ? "field-invalid" : ""}`} data-field={fieldKey}>
      <FieldLabel required={required} optional={optional} hint={hint}>
        {label}
      </FieldLabel>
      <textarea aria-invalid={fieldError ? true : undefined} rows={rows} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
      {fieldError ? <span className="field-error">{fieldError}</span> : null}
      {children}
    </label>
  );
}

function TextInput({ label, value, onChange, placeholder, required, hint, children, fieldKey, fieldError, type = "text" }) {
  return (
    <label className={`form-field ${fieldError ? "field-invalid" : ""}`} data-field={fieldKey}>
      <FieldLabel required={required} hint={hint}>
        {label}
      </FieldLabel>
      <input type={type} aria-invalid={fieldError ? true : undefined} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
      {fieldError ? <span className="field-error">{fieldError}</span> : null}
      {children}
    </label>
  );
}

function PillGroup({ label, options, value, onChange, multi = false, required, optional, hint, maxItems, fieldKey, fieldError }) {
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
    <div className={`form-field ${fieldError ? "field-invalid" : ""}`} data-field={fieldKey}>
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
      {fieldError ? <span className="field-error">{fieldError}</span> : null}
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

function TutorialOverlay({ onDone, steps }) {
  const [step, setStep] = useState(0);
  const cardRef = useRef(null);
  const current = steps[step];

  useEffect(() => {
    cardRef.current?.focus();
    function closeOnEscape(event) {
      if (event.key === "Escape") onDone();
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onDone]);

  function finish() {
    window.localStorage.setItem(TUTORIAL_KEY, "1");
    onDone();
  }

  return (
    <div className="tutorial-overlay" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onDone()}>
      <div className="tutorial-card" role="dialog" aria-modal="true" aria-labelledby="tutorial-title" tabIndex={-1} ref={cardRef}>
        <div className="tutorial-meta">
          Bước {step + 1} / {steps.length}
        </div>
        <h3 className="tutorial-title" id="tutorial-title">{current.title}</h3>
        <p className="tutorial-body">{current.body}</p>
        <div className="tutorial-dots">
          {steps.map((item, index) => (
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
            onClick={() => (step < steps.length - 1 ? setStep(step + 1) : finish())}
          >
            {step < steps.length - 1 ? "Xem tiếp" : "Bắt đầu"}
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
          Trường không bắt buộc có thể để trống. Sửa Bài sẽ hoàn thiện trong phạm vi dữ kiện bạn cung cấp.
        </span>
        <button className="guide-btn" type="button" onClick={onGuide}>
          Cách sử dụng
        </button>
      </div>
    );
  }
  return <div className={`notice ${tone}`}>{children}</div>;
}

function ResultBlock({ title, text, onChange, onRegenerate, onUseAsDraft }) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState("");
  if (!text) return null;

  async function copyText() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setCopyError("");
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopyError("Không thể sao chép tự động. Hãy chọn nội dung và sao chép thủ công.");
    }
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
          {onUseAsDraft ? (
            <button type="button" className="result-action-btn primary" onClick={onUseAsDraft}>
              Đưa sang Soạn mới
            </button>
          ) : null}
        </div>
      </div>
      <label className="result-editor-label" htmlFor="result-editor">Có thể chỉnh sửa trực tiếp</label>
      <textarea id="result-editor" className="result-editor" value={text} onChange={(event) => onChange(event.target.value)} />
      {copyError ? <p className="result-feedback" role="alert">{copyError}</p> : null}
    </section>
  );
}

export default function GeneratorApp() {
  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState("basic");
  const [workflow, setWorkflow] = useState("write");
  const [improveSubmode, setImproveSubmode] = useState("improve");
  const [workflowBriefs, setWorkflowBriefs] = useState(() => createWorkflowBriefs());
  const [history, setHistory] = useState([]);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [theme, setTheme] = useState("light");
  const [showTutorial, setShowTutorial] = useState(false);
  const [output, setOutput] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [fieldError, setFieldError] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("");

  const brief = workflowBriefs[workflow];

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
  const tutorialSteps = workflow === "write" ? WRITE_TUTORIAL_STEPS : WORKFLOW_TUTORIAL_STEPS[workflow];

  function patchBrief(patch) {
    setWorkflowBriefs((current) => ({
      ...current,
      [workflow]: { ...current[workflow], ...patch },
    }));
    if (fieldError && Object.keys(patch).includes(fieldError.field)) {
      setFieldError(null);
      setError("");
    }
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

  function resetTransientState() {
    setOutput("");
    setError("");
    setFieldError(null);
    setStatus("");
  }

  function focusField(field) {
    requestAnimationFrame(() => {
      if (field === "apiKey") {
        const settingsPanel = document.querySelector(".ai-settings");
        if (settingsPanel) settingsPanel.open = true;
      }
      const target = document.querySelector(`[data-field="${field}"]`);
      target?.scrollIntoView({ behavior: "smooth", block: "center" });
      target?.querySelector("input, textarea, button")?.focus();
    });
  }

  async function generate() {
    const validationError = validateWorkspace({ settings, workflow, improveSubmode, mode, brief });
    setFieldError(validationError);
    setError(validationError?.message || "");
    if (validationError) {
      focusField(validationError.field);
      return;
    }

    setOutput("");
    setIsGenerating(true);
    setStatus("Đang tạo bản viết theo thông tin bạn cung cấp...");
    try {
      const prompt = compilePromptByWorkflow({ workflow, improveSubmode, mode, brief });
      const text = await callGenerate([
        { role: "system", content: prompt.system },
        { role: "user", content: prompt.user },
      ]);
      if (!text.trim()) throw new Error("Mô hình không trả về nội dung. Hãy thử lại hoặc chọn mô hình khác.");
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
    setWorkflowBriefs((current) => ({
      ...current,
      [item.workflow || "write"]: { ...createEmptyBrief(), ...item.brief },
    }));
    setOutput(item.output || "");
    setError("");
    setFieldError(null);
    setStatus("");
  }

  function selectMode(nextMode) {
    setMode(nextMode);
    setWorkflow("write");
    resetTransientState();
  }

  function selectWorkflow(nextWorkflow) {
    if (nextWorkflow === workflow) return;
    setWorkflow(nextWorkflow);
    resetTransientState();
  }

  function selectImproveSubmode(nextSubmode) {
    if (nextSubmode === improveSubmode) return;
    setImproveSubmode(nextSubmode);
    resetTransientState();
  }

  function useIdeasAsDraft() {
    setWorkflowBriefs((current) => ({
      ...current,
      write: {
        ...current.write,
        product: current.ideas.product,
        audience: current.ideas.audience,
        goals: current.ideas.goals,
        topic: "Phát triển một hướng phù hợp từ danh sách ý tưởng đã chọn",
        extra: `Các hướng đã khám phá:\n${output}`,
      },
    }));
    setWorkflow("write");
    setMode("basic");
    resetTransientState();
  }

  async function testConnection() {
    const validationError = validateWorkspace({
      settings,
      workflow: "ideas",
      improveSubmode: "improve",
      mode: "basic",
      brief: { ...createEmptyBrief(), product: "Kiểm tra kết nối", audience: "Người dùng" },
    });
    if (validationError?.field === "apiKey") {
      setConnectionStatus(validationError.message);
      return;
    }
    setConnectionStatus("Đang kiểm tra...");
    try {
      await callGenerate([
        { role: "system", content: "Chỉ trả lời đúng một từ: OK" },
        { role: "user", content: "Kiểm tra kết nối." },
      ]);
      setConnectionStatus("Kết nối thành công.");
    } catch (connectionError) {
      setConnectionStatus(connectionError.message);
    }
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
                onClick={() => selectWorkflow(item.id)}
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
                    onClick={() => {
                      setSettings((current) => applyModelPreset(current, preset));
                      setConnectionStatus("");
                    }}
                  >
                    <span>{preset.provider}</span>
                    <strong>{preset.label}</strong>
                    <code>{preset.model}</code>
                    <em>{preset.costLabel}</em>
                    <small>{preset.note}</small>
                  </button>
                );
              })}
            </div>
            <div className="settings-fields">
              <TextInput type="password" fieldKey="apiKey" fieldError={fieldError?.field === "apiKey" ? fieldError.message : ""} label="Khóa truy cập API" value={settings.apiKey} placeholder="Nhập khóa của nhà cung cấp..." onChange={(apiKey) => { setSettings((current) => ({ ...current, apiKey })); setConnectionStatus(""); setFieldError(null); setError(""); }} />
              <TextInput label="Mô hình" value={settings.model} placeholder="Tên mô hình AI" onChange={(model) => setSettings((current) => ({ ...current, model }))} />
              <div className="connection-check">
                <button type="button" onClick={testConnection}>Kiểm tra kết nối</button>
                {connectionStatus ? <span role="status">{connectionStatus}</span> : null}
              </div>
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
                  <WriteForm mode={mode} brief={brief} patchBrief={patchBrief} applyTemplate={applyTemplate} onGuide={() => setShowTutorial(true)} fieldError={fieldError} />
                ) : null}
                {workflow === "improve" ? (
                  <ImproveForm submode={improveSubmode} setSubmode={selectImproveSubmode} brief={brief} patchBrief={patchBrief} onGuide={() => setShowTutorial(true)} fieldError={fieldError} />
                ) : null}
                {workflow === "ideas" ? <IdeasForm brief={brief} patchBrief={patchBrief} onGuide={() => setShowTutorial(true)} fieldError={fieldError} /> : null}

                <div className="center-action">
                  <button className="main-cta" type="button" disabled={isGenerating} onClick={generate}>
                    {isGenerating ? "Đang xử lý..." : ctaLabel()}
                  </button>
                </div>
                {error ? <div role="alert"><Notice tone="error">⚠ {error}</Notice></div> : null}
                {status ? <div role="status" aria-live="polite"><Notice>Đang xử lý: {status}</Notice></div> : null}
              </div>

              <OutputSection
                output={output}
                setOutput={setOutput}
                workflow={workflow}
                briefSummary={briefSummary}
                history={history}
                setHistory={setHistory}
                loadHistory={loadHistory}
                regenerate={generate}
                useIdeasAsDraft={useIdeasAsDraft}
              />
            </div>
          </div>
        </div>
        {mounted && showTutorial ? <TutorialOverlay steps={tutorialSteps} onDone={() => setShowTutorial(false)} /> : null}
      </section>
    </main>
  );
}

function WriteForm({ mode, brief, patchBrief, applyTemplate, onGuide, fieldError }) {
  if (mode === "entry") {
    return (
      <section className="form-section">
        <Notice tone="blue">
          <strong>Bản nháp một lượt</strong>
          <br />
          Gửi một yêu cầu gọn và nhận bản đầu tiên để tiếp tục biên tập.
        </Notice>
        <Notice action onGuide={onGuide} />
        <TemplateStrip applyTemplate={applyTemplate} />
        <BriefBlock
          step="01"
          eyebrow="YÊU CẦU"
          title="Nói ngắn gọn điều bạn cần"
          description="Không cần viết thành brief. Chỉ cần nêu đúng việc và thông tin bắt buộc."
        >
          <TextArea
            label="Bạn muốn có một bản viết về điều gì?"
            fieldKey="topic"
            fieldError={fieldError?.field === "topic" ? fieldError.message : ""}
            required
            rows={4}
            value={brief.topic}
            placeholder="Ví dụ: Viết bài giới thiệu gói giao rau theo tuần, nhấn vào việc tiết kiệm thời gian cho gia đình trẻ..."
            onChange={(topic) => patchBrief({ topic })}
          />
          <TextArea
            label="Dữ kiện cần giữ đúng"
            optional
            rows={3}
            value={brief.product}
            placeholder="Tên sản phẩm, mức giá, ưu đãi, khu vực phục vụ hoặc thông tin không được tự suy diễn..."
            onChange={(product) => patchBrief({ product })}
          />
        </BriefBlock>
        <BriefBlock
          step="02"
          eyebrow="CÁCH DÙNG"
          title="Chọn ngữ cảnh cho bản nháp"
          description="Hai lựa chọn này giúp hệ thống điều chỉnh nhịp câu và độ dài."
        >
          <PillGroup
            label="Cảm giác khi đọc"
            fieldKey="feeling"
            fieldError={fieldError?.field === "feeling" ? fieldError.message : ""}
            required
            options={QUICK_FEELINGS}
            value={brief.feeling}
            onChange={(feeling) => patchBrief({ feeling })}
          />
          <PillGroup
            label="Nơi bạn sẽ dùng bản viết"
            fieldKey="channel"
            fieldError={fieldError?.field === "channel" ? fieldError.message : ""}
            required
            options={CHANNELS}
            value={brief.channel}
            onChange={(channel) => patchBrief({ channel, channels: [channel] })}
          />
          <ExtraPromptField mode={mode} brief={brief} patchBrief={patchBrief} />
          <PillGroup
            label="Số bản để lựa chọn"
            maxItems="Tối đa 10 bản trong một lần tạo"
            options={["1", "2", "3", "5", "10"]}
            value={brief.variantCount}
            onChange={(variantCount) => patchBrief({ variantCount })}
          />
        </BriefBlock>
      </section>
    );
  }

  if (mode === "advanced") {
    return (
      <section className="form-section">
        <Notice action onGuide={onGuide} />
        <div className="mode-intro mode-intro-advanced">
          <div>
            <div className="section-chip purple">CHỈ ĐẠO</div>
            <h2>Dựng đường đi của ý tưởng trước khi viết</h2>
            <p>Kiểm soát kết luận, nhịp lập luận, chất giọng và cơ sở thuyết phục của bản nội dung.</p>
          </div>
        </div>
        <AdvancedWriteFields brief={brief} patchBrief={patchBrief} />
        <BasicBriefFields mode={mode} brief={brief} patchBrief={patchBrief} fieldError={fieldError} />
      </section>
    );
  }

  return (
    <section className="form-section">
      <Notice action onGuide={onGuide} />
      <div className="mode-intro">
        <div>
          <div className="section-chip">DỰNG BÀI</div>
          <h2>Đi từ nguyên liệu thô đến một yêu cầu rõ ràng</h2>
          <p>Hoàn thiện lần lượt dữ kiện, ý định, thành phẩm và các giới hạn cần giữ.</p>
        </div>
      </div>
      <BasicBriefFields mode={mode} brief={brief} patchBrief={patchBrief} fieldError={fieldError} />
    </section>
  );
}

function BasicBriefFields({ mode, brief, patchBrief, fieldError }) {
  return (
    <>
      <BriefBlock
        step="01"
        eyebrow="NGUYÊN LIỆU"
        title="Cho hệ thống đủ chất liệu để viết"
        description="Ghi lại điều phải đúng và người sẽ đọc nội dung này."
      >
        <TextArea
          label="Thông tin không được viết sai"
          fieldKey="product"
          fieldError={fieldError?.field === "product" ? fieldError.message : ""}
          required
          rows={4}
          value={brief.product}
          placeholder="Sản phẩm, dịch vụ, sự kiện hoặc vấn đề; điểm khác biệt, mức giá, dữ kiện và giới hạn cần giữ đúng..."
          onChange={(product) => patchBrief({ product })}
        >
          <p className="field-hint">Ưu tiên dữ kiện thật. Hệ thống sẽ không tự tạo bằng chứng còn thiếu.</p>
        </TextArea>
        <TextArea
          label="Người sẽ đọc bản này"
          fieldKey="audience"
          fieldError={fieldError?.field === "audience" ? fieldError.message : ""}
          required
          rows={3}
          value={brief.audience}
          placeholder="Họ là ai, đang ở hoàn cảnh nào, đã biết gì và còn do dự điều gì?"
          onChange={(audience) => patchBrief({ audience })}
        />
      </BriefBlock>

      <BriefBlock
        step="02"
        eyebrow="Ý ĐỊNH"
        title="Chốt điều bài viết cần làm"
        description="Một trọng tâm rõ sẽ giúp bản viết bớt chung chung và không ôm quá nhiều ý."
      >
        <TextArea
          label="Ý trung tâm cần truyền đạt"
          fieldKey="topic"
          fieldError={fieldError?.field === "topic" ? fieldError.message : ""}
          required
          rows={3}
          value={brief.topic}
          placeholder="Ví dụ: Giúp quản lý nhận ra báo cáo thủ công đang lấy mất thời gian ra quyết định..."
          onChange={(topic) => patchBrief({ topic })}
        />
        <PillGroup fieldKey="goals" fieldError={fieldError?.field === "goals" ? fieldError.message : ""} label="Sau khi đọc, điều gì nên thay đổi?" required multi options={GOALS} value={brief.goals} onChange={(goals) => patchBrief({ goals })} />
        <PillGroup fieldKey="channels" fieldError={fieldError?.field === "channels" ? fieldError.message : ""} label="Bản viết sẽ được dùng trong ngữ cảnh nào?" required multi options={CHANNELS} value={brief.channels} onChange={(channels) => patchBrief({ channels })} />
      </BriefBlock>

      <BriefBlock
        step="03"
        eyebrow="THÀNH PHẨM"
        title="Mô tả thứ bạn muốn nhận lại"
        description="Chọn dạng đầu ra và quy mô phù hợp với nơi sử dụng."
      >
        <PillGroup fieldKey="formats" fieldError={fieldError?.field === "formats" ? fieldError.message : ""} label="Dạng nội dung" required multi options={FORMATS} value={brief.formats} onChange={(formats) => patchBrief({ formats })} />
        <div className="brief-inline-grid">
          <PillGroup label="Cấu trúc hiển thị" options={["Theo đoạn", "Theo bảng"]} value={brief.contentShape} onChange={(contentShape) => patchBrief({ contentShape })} />
          <PillGroup label="Đo độ dài bằng" options={["Số từ", "Thời lượng", "Số đoạn"]} value={brief.lengthType} onChange={(lengthType) => patchBrief({ lengthType })} />
        </div>
        <TextInput
          label={`Độ dài dự kiến (${(brief.lengthType || "Số từ").toLowerCase()})`}
          value={brief.lengthValue}
          placeholder={brief.lengthType === "Thời lượng" ? "Ví dụ: 60 giây" : brief.lengthType === "Số đoạn" ? "Ví dụ: 6 đoạn" : "Ví dụ: 400 từ"}
          onChange={(lengthValue) => patchBrief({ lengthValue })}
        />
      </BriefBlock>

      <BriefBlock
        step="04"
        eyebrow="RÀNG BUỘC"
        title="Đặt giới hạn cho quá trình biên tập"
        description="Nêu điều nên giữ, điều phải tránh và số bản cần so sánh."
      >
        <ExtraPromptField mode={mode} brief={brief} patchBrief={patchBrief} />
        <PillGroup
          label="Số bản để lựa chọn"
          maxItems="Tối đa 10 bản trong một lần tạo"
          options={["1", "2", "3", "5", "10"]}
          value={brief.variantCount}
          onChange={(variantCount) => patchBrief({ variantCount })}
        />
      </BriefBlock>
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
    <>
      <BriefBlock
        step="A"
        eyebrow="BẢN ĐỒ LẬP LUẬN"
        title="Quyết định cách dẫn người đọc đi qua nội dung"
        description="Thiết lập đường đi của ý tưởng trước khi chọn câu chữ."
        tone="advanced"
      >
        <PillGroup
          label="Bạn muốn kiểm soát định hướng đến đâu?"
          options={["Hệ thống dựng khung", "Đề xuất nhiều hướng", "Tôi tự quyết định"]}
          value={brief.advancedMode || "Hệ thống dựng khung"}
          onChange={(advancedMode) => patchBrief({ advancedMode })}
        />
        <PillGroup label="Cách mở rộng ý" optional multi options={CONTENT_LINES} value={brief.contentLines} onChange={(contentLines) => patchBrief({ contentLines })} />
        <TextArea label="Một câu người đọc cần nhớ" optional rows={3} value={brief.mainMessage} placeholder="Viết như một kết luận ngắn, hoặc để trống để Sửa Bài tự hoàn thiện" onChange={(mainMessage) => patchBrief({ mainMessage })} />
        <TextArea label="Các ý phải có để làm rõ kết luận" optional rows={3} value={brief.subMessage} placeholder="Liệt kê dữ kiện, lợi ích, phản biện hoặc ví dụ cần xuất hiện" onChange={(subMessage) => patchBrief({ subMessage })} />
      </BriefBlock>

      <BriefBlock
        step="B"
        eyebrow="CÁCH THỂ HIỆN"
        title="Điều chỉnh nhịp, giọng và sức nặng của bản viết"
        description="Các lựa chọn này tác động đến cách trình bày, không thay đổi dữ kiện gốc."
        tone="advanced"
      >
        <PillGroup label="Khung triển khai" multi options={FORMULAS} value={[brief.formula]} onChange={(values) => patchBrief({ formula: values.at(-1) || "Vấn đề → Hệ quả → Giải pháp" })} />
        <PillGroup label="Chất giọng" multi options={CONTENT_STYLES} value={[brief.style]} onChange={(values) => patchBrief({ style: values.at(-1) || "Rõ ràng trung tính" })} />
        <PillGroup
          label="Điểm kết của bản viết"
          options={["Mở trang thông tin", "Để lại liên hệ", "Nhận tài liệu", "Theo dõi cập nhật", "Gửi cho đồng nghiệp", "Phản hồi ý kiến", "Chia sẻ nội dung", "Xem phương án phù hợp"]}
          value={brief.cta}
          onChange={(cta) => patchBrief({ cta })}
        />
        <RatioSlider
          label="Cách nói"
          value={brief.vocabRatioValue ?? 50}
          onChange={(vocabRatioValue) => patchBrief({ vocabRatioValue })}
          leftLabel="Đời thường"
          rightLabel="Chuẩn mực"
        />
        <RatioSlider
          label="Cơ sở thuyết phục"
          value={brief.qualityRatioValue ?? 50}
          onChange={(qualityRatioValue) => patchBrief({ qualityRatioValue })}
          leftLabel="Trải nghiệm"
          rightLabel="Dữ kiện"
        />
        <TextArea label="Nguồn có thể viện dẫn" optional rows={3} value={brief.evidence} placeholder="Số liệu, nghiên cứu, phản hồi thật hoặc đường dẫn nguồn; để trống nếu không có" onChange={(evidence) => patchBrief({ evidence })} />
      </BriefBlock>
    </>
  );
}

function ImproveForm({ submode, setSubmode, brief, patchBrief, onGuide, fieldError }) {
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
        <BriefBlock
          step="01"
          eyebrow="BẢN GỐC"
          title="Đưa nội dung cần biên tập vào bàn làm việc"
          description="Hệ thống sẽ giữ dữ kiện và chủ đích, chỉ thay đổi những điểm bạn chọn."
        >
          <TextArea
            label="Nội dung hiện tại"
            fieldKey="sourceContent"
            fieldError={fieldError?.field === "sourceContent" ? fieldError.message : ""}
            required
            rows={7}
            value={brief.sourceContent}
            placeholder="Dán bài đăng, email, kịch bản hoặc đoạn văn cần biên tập..."
            onChange={(sourceContent) => patchBrief({ sourceContent })}
          />
          <PillGroup label="Tiêu chí cho lần biên tập này" optional multi options={IMPROVE_TYPES} value={brief.improveTypes} onChange={(improveTypes) => patchBrief({ improveTypes })} />
        </BriefBlock>
      ) : (
        <BriefBlock
          step="01"
          eyebrow="MẪU THAM CHIẾU"
          title="Tách cách viết khỏi nội dung mẫu"
          description="Sửa Bài chỉ học nhịp câu, cách dùng từ và sắc thái; không sao chép nội dung."
        >
          <TextArea
            label="Đoạn thể hiện rõ cách viết"
            fieldKey="styleSample"
            fieldError={fieldError?.field === "styleSample" ? fieldError.message : ""}
            required
            rows={7}
            value={brief.styleSample}
            placeholder="Dán một đoạn thể hiện rõ nhịp câu, cách dùng từ và sắc thái bạn muốn giữ lại..."
            onChange={(styleSample) => patchBrief({ styleSample })}
          />
          <TextArea
            label="Việc cần viết mới"
            fieldKey="styleTopic"
            fieldError={fieldError?.field === "styleTopic" ? fieldError.message : ""}
            required
            rows={4}
            value={brief.styleTopic}
            placeholder="Ví dụ: Thư giới thiệu chương trình đào tạo quản lý cho doanh nghiệp vừa..."
            onChange={(styleTopic) => patchBrief({ styleTopic })}
          />
          <TextArea
            label="Giới hạn cần tuân thủ"
            optional
            rows={4}
            value={brief.styleExtra}
            placeholder="Ví dụ: Tạo hai phương án, khoảng 300 từ, kết thúc bằng lời mời đăng ký tư vấn..."
            onChange={(styleExtra) => patchBrief({ styleExtra })}
          />
        </BriefBlock>
      )}
    </section>
  );
}

function IdeasForm({ brief, patchBrief, onGuide, fieldError }) {
  return (
    <section className="form-section">
      <Notice action onGuide={onGuide} />
      <BriefBlock
        step="01"
        eyebrow="VÙNG KHÁM PHÁ"
        title="Xác định vấn đề cần mở thêm hướng"
        description="Cho hệ thống biết đối tượng, người đọc và thay đổi bạn muốn tạo ra."
      >
        <TextInput
          label="Chủ thể cần khai phá"
          required
          fieldKey="product"
          fieldError={fieldError?.field === "product" ? fieldError.message : ""}
          value={brief.product}
          placeholder="Ví dụ: Ứng dụng quản lý chi tiêu dành cho người mới đi làm..."
          onChange={(product) => patchBrief({ product })}
        />
        <TextArea
          label="Người sẽ tiếp nhận nội dung"
          fieldKey="audience"
          fieldError={fieldError?.field === "audience" ? fieldError.message : ""}
          required
          rows={4}
          value={brief.audience}
          placeholder="Họ đang ở hoàn cảnh nào, muốn điều gì và vì sao chưa hành động?"
          onChange={(audience) => patchBrief({ audience })}
        />
        <PillGroup label="Ý tưởng nên dẫn đến thay đổi nào?" multi options={GOALS} value={brief.goals} onChange={(goals) => patchBrief({ goals })} />
        <PillGroup label="Số hướng muốn khám phá" maxItems="Tối đa 10 hướng trong một lần" options={IDEA_COUNTS} value={brief.ideaCount} onChange={(ideaCount) => patchBrief({ ideaCount })} />
      </BriefBlock>
    </section>
  );
}

function TemplateStrip({ applyTemplate }) {
  return (
    <section className="template-strip">
      <strong>Nạp một ví dụ gần với công việc</strong>
      <span>Dữ liệu mẫu chỉ dùng để điền nhanh form và có thể sửa lại toàn bộ.</span>
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

function OutputSection({ output, setOutput, workflow, briefSummary, history, setHistory, loadHistory, regenerate, useIdeasAsDraft }) {
  function removeHistory(id) {
    const next = history.filter((item) => item.id !== id);
    setHistory(next);
    writeJson(HISTORY_KEY, next);
  }

  return (
    <section className="output-zone">
      {!output ? (
        <div className="output-empty">
          <strong>Bản viết sẽ xuất hiện tại đây</strong>
          <span>Hoàn tất các thông tin cần thiết rồi chọn nút tạo nội dung ở cuối biểu mẫu.</span>
        </div>
      ) : null}
      <ResultBlock
        title={workflow === "ideas" ? "Danh sách hướng" : workflow === "improve" ? "Bản đã biên tập" : "Bản nội dung"}
        text={output}
        onChange={setOutput}
        onRegenerate={regenerate}
        onUseAsDraft={workflow === "ideas" ? useIdeasAsDraft : null}
      />
      <details className="brief-debug">
        <summary>Tóm tắt dữ liệu đầu vào</summary>
        <pre>{briefSummary || "Chưa có dữ liệu để tóm tắt."}</pre>
      </details>
      <details className="brief-debug">
        <summary>Các bản đã tạo trên thiết bị ({history.length})</summary>
        <div className="history-list">
          {history.map((item) => (
            <div className="history-item" key={item.id}>
              <button type="button" className="history-load" onClick={() => loadHistory(item)}>
                <strong>{item.title}</strong>
                <small>{new Date(item.createdAt).toLocaleString("vi-VN")}</small>
              </button>
              <button type="button" className="history-delete" aria-label={`Xóa ${item.title}`} onClick={() => removeHistory(item.id)}>Xóa</button>
            </div>
          ))}
        </div>
      </details>
    </section>
  );
}
