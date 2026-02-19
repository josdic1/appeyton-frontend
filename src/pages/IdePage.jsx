// src/pages/IdePage.jsx
import { useState } from "react";
import Editor from "@monaco-editor/react";
import { Bug, Play, Trash2, Download, Monitor } from "lucide-react";

export function IdePage() {
  const [code, setCode] = useState(INITIAL_HTML);
  const [previewCode, setPreviewCode] = useState(INITIAL_HTML);
  const [language, setLanguage] = useState("html");
  const [shouldCrash, setShouldCrash] = useState(false);
  const [hovered, setHovered] = useState(null);

  // --- Resilience Testing Logic ---
  if (shouldCrash) {
    const explosion = null;
    return <div>{explosion.detonate()}</div>; // Triggers ErrorBoundary
  }

  // --- Handlers ---
  const handleRun = () => setPreviewCode(code);
  const handleClear = () => {
    setCode("");
    setPreviewCode("");
  };

  const handleDownload = () => {
    const ext =
      { html: "html", javascript: "js", css: "css", python: "py" }[language] ||
      "txt";
    const blob = new Blob([code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bagger-snippet.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={ideContainerStyle}>
      {/* 1. CRT Overlays */}
      <div style={scanlineWarbleStyle}></div>

      {/* 2. Control Toolbar */}
      <header style={toolbarStyle}>
        <div style={brandStyle}>PHOSPHOR_TERMINAL_v1.0.4</div>

        <div style={actionGroupStyle}>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            style={selectStyle}
          >
            <option value="html">HTML</option>
            <option value="javascript">JS</option>
            <option value="css">CSS</option>
            <option value="python">PY</option>
          </select>

          <button onClick={handleClear} style={btnCrt}>
            <Trash2 size={14} /> Clear
          </button>
          <button onClick={handleDownload} style={btnCrt}>
            <Download size={14} /> Save
          </button>
          {language === "html" && (
            <button onClick={handleRun} style={runBtnStyle}>
              <Play size={14} /> Execute
            </button>
          )}
          <button onClick={() => setShouldCrash(true)} style={crashBtnStyle}>
            <Bug size={14} /> Trigger Crash
          </button>
        </div>
      </header>

      {/* 3. Main Workspace */}
      <div style={workspaceStyle}>
        {/* Editor Pane */}
        <div style={paneStyle}>
          <div style={paneHeader}>SOURCE_CODE</div>
          <Editor
            height="100%"
            language={language}
            value={code}
            onChange={(val) => setCode(val || "")}
            theme="vs-dark"
            options={editorOptions}
          />
        </div>

        {/* Preview Pane */}
        <div style={paneStyle}>
          <div style={paneHeader}>VIRTUAL_DISPLAY</div>
          {language === "html" ? (
            <iframe
              key={previewCode}
              srcDoc={previewCode}
              title="IDE Preview"
              sandbox="allow-scripts"
              style={iframeStyle}
            />
          ) : (
            <div style={noPreviewStyle}>
              <Monitor size={48} opacity={0.2} />
              <p>PREVIEW_UNAVAILABLE_FOR_{language.toUpperCase()}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- INITIAL DATA & OPTIONS ---

const INITIAL_HTML = `<style>
  body { background: #000; color: #33ff00; font-family: monospace; padding: 20px; }
  .box { border: 2px solid #33ff00; padding: 10px; text-align: center; }
</style>
<div class="box">PHOSPHOR OUTPUT READY</div>`;

const editorOptions = {
  minimap: { enabled: false },
  fontSize: 14,
  fontFamily: "'JetBrains Mono', monospace",
  automaticLayout: true,
  scrollBeyondLastLine: false,
};

// --- STYLES (PHOSPHOR THEME) ---

const ideContainerStyle = {
  display: "flex",
  flexDirection: "column",
  height: "calc(100vh - 120px)",
  background: "#050a05",
  padding: "10px",
  position: "relative",
  overflow: "hidden",
};
const toolbarStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "10px",
  borderBottom: "2px solid #1a8000",
  fontFamily: "'VT323', monospace",
  color: "#33ff00",
};
const brandStyle = {
  fontSize: "1.2rem",
  fontWeight: 900,
  textShadow: "0 0 10px #33ff00",
};
const actionGroupStyle = { display: "flex", gap: "10px" };
const workspaceStyle = {
  flex: 1,
  display: "flex",
  gap: "10px",
  marginTop: "10px",
  overflow: "hidden",
};
const paneStyle = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  border: "2px solid #1a8000",
  background: "#000",
};
const paneHeader = {
  padding: "5px 10px",
  fontSize: "0.7rem",
  color: "#33ff00",
  borderBottom: "1px solid #1a8000",
  fontWeight: 900,
};
const iframeStyle = { flex: 1, border: "none", background: "#fff" };
const noPreviewStyle = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  color: "#1a8000",
  fontFamily: "'VT323', monospace",
};

// CRT Effects
const scanlineWarbleStyle = {
  position: "absolute",
  inset: 0,
  pointerEvents: "none",
  zIndex: 10,
  background:
    "linear-gradient(rgba(51, 255, 0, 0) 50%, rgba(51, 255, 0, 0.05) 50.5%, rgba(51, 255, 0, 0) 51%)",
  backgroundSize: "100% 4px",
  animation: "scanline 10s linear infinite",
  opacity: 0.3,
};

// Buttons
const btnBase = {
  background: "#000",
  color: "#33ff00",
  border: "1px solid #33ff00",
  padding: "5px 12px",
  borderRadius: "4px",
  cursor: "pointer",
  fontFamily: "'VT323', monospace",
  display: "flex",
  alignItems: "center",
  gap: 6,
};
const btnCrt = { ...btnBase };
const runBtnStyle = {
  ...btnBase,
  background: "#1a8000",
  color: "#000",
  fontWeight: 900,
};
const crashBtnStyle = { ...btnBase, color: "#ef4444", borderColor: "#ef4444" };
const selectStyle = {
  background: "#000",
  color: "#33ff00",
  border: "1px solid #33ff00",
  fontFamily: "'VT323', monospace",
  padding: "0 10px",
};
