import { useState } from "react";
import Editor from "@monaco-editor/react";

export function IdePage() {
  const [code, setCode] = useState(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PHOSPHOR TERMINAL - Plain Talk Tech</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=VT323&display=swap');

    /* =========================================================
       ROOT CONTAINER
    ========================================================= */
    :root {
        --phosphor-main: #33ff00;
        --phosphor-dim: #1a8000;
        --bg-color: #050a05;
    }
    #root {
        max-width: 1400px;
        margin: 0 auto;
        padding: 20px 40px;
        min-height: 100vh;
        border-left: 2px solid var(--phosphor-dim);
        border-right: 2px solid var(--phosphor-dim);
        position: relative;
    }
    #root > * {
        position: relative;
        z-index: 5;
    }

    /* =========================================================
       GLOBAL RESET
    ========================================================= */
    * {
        box-sizing: border-box;
    }
    html, body {
        margin: 0;
        padding: 0;
        background-color: var(--bg-color);
        color: var(--phosphor-main);
        font-family: 'VT323', monospace;
        font-size: 20px;
        height: 100%;
        width: 100%;
        overflow-x: hidden;
        text-shadow: 0 0 1px var(--phosphor-main),
        0 0 6px rgba(51,255,0,0.45);
    }

    /* =========================================================
       PHOSPHOR DOT GRID
    ========================================================= */
    body::before {
        content: "";
        position: fixed;
        inset: 0;
        pointer-events: none;
        z-index: 9997;
        background-image: radial-gradient(rgba(51,255,0,0.04) 1px, transparent 1px);
        background-size: 4px 4px;
        opacity: 0.18;
        filter: blur(0.6px);
    }

    /* =========================================================
       STATIC SCANLINES (Horizontal bars)
    ========================================================= */
    body::after {
        content: "";
        position: fixed;
        inset: 0;
        pointer-events: none;
        z-index: 9998;
        background:
                repeating-linear-gradient(to bottom, rgba(0,0,0,0.28), rgba(0,0,0,0.28) 1px, rgba(0,0,0,0) 2px),
                linear-gradient(90deg, rgba(255,0,0,0.05), rgba(0,255,0,0.02), rgba(0,0,255,0.05));
        background-size: 100% 3px, 4px 100%;
        animation: crt-flicker 0.14s infinite;
    }

    /* =========================================================
       MOVING SCANLINE WARBLE (The thick line that moves)
    ========================================================= */
    #scanline-warble {
        position: fixed;
        inset: 0;
        pointer-events: none;
        z-index: 9999;
        background: linear-gradient(
          to bottom,
          transparent 0%,
          transparent 48%,
          rgba(51, 255, 0, 0.15) 49%,
          rgba(51, 255, 0, 0.25) 50%,
          rgba(51, 255, 0, 0.15) 51%,
          transparent 52%,
          transparent 100%
        );
        animation: scanline-move 8s linear infinite;
        opacity: 0.7;
    }

    @keyframes scanline-move {
        0% { transform: translateY(-100%); }
        100% { transform: translateY(100vh); }
    }

    @keyframes crt-flicker {
        0% { opacity: 0.94; }
        50% { opacity: 1; }
        100% { opacity: 0.96; }
    }

    #root::before {
        content: "";
        position: absolute;
        inset: 0;
        pointer-events: none;
        z-index: 2;
        background:
                radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(0,0,0,0.35) 100%),
                linear-gradient(to bottom, rgba(0,0,0,0.25), rgba(0,0,0,0), rgba(0,0,0,0.25));
        mix-blend-mode: multiply;
    }

    /* =========================================================
       ASCII TITLE
    ========================================================= */
    .ascii-title {
        font-family: 'Courier New', monospace;
        font-size: 0.5rem;
        line-height: 1;
        color: var(--phosphor-main);
        text-align: center;
        margin: 10px 0 20px;
        white-space: pre;
        text-shadow: 0 0 10px rgba(51,255,0,0.6),
        0 0 20px rgba(51,255,0,0.3);
        overflow-x: auto;
    }

    /* =========================================================
       FORMS, INPUTS & PANELS
    ========================================================= */
    .filter-panel, .login-card, .retro-panel {
        border: 4px double var(--phosphor-main);
        padding: 30px;
        margin-bottom: 20px;
        background: #000;
        border-image: repeating-linear-gradient(90deg, var(--phosphor-main), var(--phosphor-main) 2px, transparent 2px, transparent 6px) 2;
        box-shadow: 0 0 20px rgba(51,255,0,0.15);
        position: relative;
        z-index: 10;
    }

    .retro-panel h2 {
        margin-top: 0;
        margin-bottom: 20px;
        text-transform: uppercase;
        letter-spacing: 3px;
        font-size: 1.8rem;
    }

    input[type="text"],
    input[type="password"],
    input[type="email"],
    input[type="date"],
    select,
    textarea {
        background: #000;
        border: 2px solid var(--phosphor-main);
        color: var(--phosphor-main);
        padding: 10px;
        font-family: 'VT323', monospace;
        font-size: 1.1rem;
        width: 100%;
        margin-bottom: 15px;
        box-shadow: inset 0 0 10px rgba(51,255,0,0.1);
    }

    input:focus,
    select:focus,
    textarea:focus {
        outline: none;
        box-shadow: 0 0 15px rgba(51,255,0,0.4);
    }

    label {
        display: block;
        margin-bottom: 5px;
        text-transform: uppercase;
        letter-spacing: 2px;
        font-size: 0.9rem;
    }

    button {
        background: var(--phosphor-main);
        color: #000;
        border: none;
        padding: 12px 30px;
        font-family: 'VT323', monospace;
        font-size: 1.2rem;
        cursor: pointer;
        text-transform: uppercase;
        letter-spacing: 2px;
        box-shadow: 0 0 20px rgba(51,255,0,0.3);
        transition: all 0.2s;
    }

    button:hover {
        background: #fff;
        box-shadow: 0 0 30px rgba(51,255,0,0.6);
    }

    button:active {
        transform: scale(0.98);
    }

    /* =========================================================
       TABLE STYLES
    ========================================================= */
    table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 20px;
    }

    th, td {
        border: 1px solid var(--phosphor-dim);
        padding: 12px;
        text-align: left;
    }

    th {
        background: rgba(51,255,0,0.1);
        text-transform: uppercase;
        letter-spacing: 2px;
        font-size: 0.9rem;
    }

    tr:hover {
        background: rgba(51,255,0,0.05);
    }

    /* =========================================================
       UTILITIES
    ========================================================= */
    .text-center {
        text-align: center;
    }

    .mb-20 {
        margin-bottom: 20px;
    }

    .grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 20px;
        margin-bottom: 20px;
    }

    .status-active {
        color: var(--phosphor-main);
        font-weight: bold;
    }

    .status-pending {
        color: #ffff00;
        font-weight: bold;
    }

    .blink {
        animation: blink 1s infinite;
    }

    @keyframes blink {
        0%, 50%, 100% { opacity: 1; }
        25%, 75% { opacity: 0; }
    }
  </style>
</head>
<body>
  
  <!-- MOVING SCANLINE WARBLE EFFECT -->
  <div id="scanline-warble"></div>

  <div id="root">
    
    <!-- ASCII ART TITLE -->
    <pre class="ascii-title">
 ██████╗ ██╗      █████╗ ██╗███╗   ██╗    ████████╗ █████╗ ██╗     ██╗  ██╗
 ██╔══██╗██║     ██╔══██╗██║████╗  ██║    ╚══██╔══╝██╔══██╗██║     ██║ ██╔╝
 ██████╔╝██║     ███████║██║██╔██╗ ██║       ██║   ███████║██║     █████╔╝ 
 ██╔═══╝ ██║     ██╔══██║██║██║╚██╗██║       ██║   ██╔══██║██║     ██╔═██╗ 
 ██║     ███████╗██║  ██║██║██║ ╚████║       ██║   ██║  ██║███████╗██║  ██╗
 ╚═╝     ╚══════╝╚═╝  ╚═╝╚═╝╚═╝  ╚═══╝       ╚═╝   ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝
                    ████████╗███████╗ ██████╗██╗  ██╗                        
                    ╚══██╔══╝██╔════╝██╔════╝██║  ██║                        
                       ██║   █████╗  ██║     ███████║                        
                       ██║   ██╔══╝  ██║     ██╔══██║                        
                       ██║   ███████╗╚██████╗██║  ██║                        
                       ╚═╝   ╚══════╝ ╚═════╝╚═╝  ╚═╝                        
    </pre>

    <p class="text-center mb-20">
      SYSTEM INITIALIZED <span class="blink">█</span> TERMINAL READY
    </p>

    <!-- DASHBOARD STATS -->
    <div class="grid">
      <div class="retro-panel">
        <h2>System Status</h2>
        <p>UPTIME: 99.87%</p>
        <p>USERS ONLINE: <span class="status-active">42</span></p>
        <p>ACTIVE TASKS: <span class="status-active">8</span></p>
      </div>

      <div class="retro-panel">
        <h2>Quick Stats</h2>
        <p>RESERVATIONS TODAY: 12</p>
        <p>PENDING APPROVAL: <span class="status-pending">3</span></p>
        <p>REVENUE: $2,450</p>
      </div>

      <div class="retro-panel">
        <h2>Database</h2>
        <p>CONNECTION: <span class="status-active">ONLINE</span></p>
        <p>LAST BACKUP: 2 HRS AGO</p>
        <p>RECORDS: 1,847</p>
      </div>
    </div>

    <!-- LOGIN FORM -->
    <div class="login-card">
      <h2>USER AUTHENTICATION</h2>
      <form>
        <label for="username">USERNAME:</label>
        <input type="text" id="username" placeholder="Enter username">

        <label for="password">PASSWORD:</label>
        <input type="password" id="password" placeholder="Enter password">

        <button type="submit">ACCESS SYSTEM</button>
      </form>
    </div>

    <!-- RESERVATION FORM -->
    <div class="filter-panel">
      <h2>New Reservation</h2>
      <form>
        <label for="client">Client Name:</label>
        <input type="text" id="client" placeholder="Enter client name">

        <label for="date">Date:</label>
        <input type="date" id="date">

        <label for="guests">Number of Guests:</label>
        <select id="guests">
          <option>SELECT...</option>
          <option>1-5 GUESTS</option>
          <option>6-10 GUESTS</option>
          <option>11-20 GUESTS</option>
        </select>

        <label for="notes">Special Requests:</label>
        <textarea id="notes" rows="4" placeholder="Dietary restrictions, preferences..."></textarea>

        <button type="submit">SUBMIT RESERVATION</button>
      </form>
    </div>

    <!-- DATA TABLE -->
    <div class="retro-panel">
      <h2>Recent Reservations</h2>
      <table>
        <thead>
          <tr>
            <th>DATE</th>
            <th>CLIENT</th>
            <th>GUESTS</th>
            <th>STATUS</th>
            <th>FEE</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>2026-02-15</td>
            <td>JOHNSON FAMILY</td>
            <td>8</td>
            <td class="status-active">CONFIRMED</td>
            <td>$250</td>
          </tr>
          <tr>
            <td>2026-02-16</td>
            <td>SMITH CORP</td>
            <td>12</td>
            <td class="status-active">CONFIRMED</td>
            <td>$375</td>
          </tr>
          <tr>
            <td>2026-02-18</td>
            <td>WILLIAMS ESTATE</td>
            <td>6</td>
            <td class="status-pending">PENDING</td>
            <td>$200</td>
          </tr>
          <tr>
            <td>2026-02-20</td>
            <td>DAVIS GROUP</td>
            <td>15</td>
            <td class="status-active">CONFIRMED</td>
            <td>$450</td>
          </tr>
        </tbody>
      </table>
    </div>

    <p class="text-center" style="margin-top: 40px; font-size: 0.9rem; color: var(--phosphor-dim);">
      PLAIN TALK TECH © 2026 | SYSTEM v1.0.0 | ALL SYSTEMS OPERATIONAL
    </p>

  </div>

</body>
</html>`);

  const [previewCode, setPreviewCode] = useState(code); // Separate state for preview
  const [language, setLanguage] = useState("html");

  const handleRun = () => {
    setPreviewCode(code);
  };

  const handleClear = () => {
    setCode("");
    if (language === "html") setPreviewCode("");
  };

  const monacoLang = {
    html: "html",
    javascript: "javascript",
    css: "css",
    python: "python",
  };

  const handleDownload = () => {
    const extensions = {
      html: "html",
      javascript: "js",
      css: "css",
      python: "py",
    };
    const ext = extensions[language] || "txt";
    const filename = `bagger-code.${ext}`;

    const blob = new Blob([code], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();

    URL.revokeObjectURL(url);
  };

  const btnCrt = {
    background: "#000",
    color: "#33ff00",
    border: "2px solid #33ff00",
    padding: "8px 16px",
    borderRadius: "4px",
    cursor: "pointer",
    fontFamily: "'VT323', monospace",
    fontWeight: "bold",
    fontSize: "16px",
    textTransform: "uppercase",
    letterSpacing: "2px",
    boxShadow:
      "0 0 18px rgba(51,255,0,0.25), inset 0 0 10px rgba(51,255,0,0.12)",
    textShadow: "0 0 1px #33ff00, 0 0 10px rgba(51,255,0,0.35)",
  };

  const btnCrtHover = {
    background: "#33ff00",
    color: "#000",
    boxShadow: "0 0 28px rgba(51,255,0,0.55), inset 0 0 12px rgba(0,0,0,0.35)",
    textShadow: "none",
  };

  const selectCrt = {
    background: "#000",
    color: "#33ff00",
    border: "2px solid #33ff00",
    padding: "6px 10px",
    borderRadius: "4px",
    fontFamily: "'VT323', monospace",
    cursor: "pointer",
    textTransform: "uppercase",
    letterSpacing: "2px",
    boxShadow: "inset 0 0 10px rgba(51,255,0,0.12)",
    textShadow: "0 0 1px #33ff00, 0 0 8px rgba(51,255,0,0.25)",
  };

  const [hovered, setHovered] = useState(null);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "calc(100vh - 100px)",
        width: "100%",
        padding: "1rem",
        boxSizing: "border-box",
        background: "#050a05",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "10px",
          background: "#050a05",
          color: "#33ff00",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "2px solid #1a8000",
          fontFamily: "'VT323', monospace",
          letterSpacing: "2px",
          textShadow: "0 0 1px #33ff00, 0 0 10px rgba(51,255,0,0.35)",
          boxShadow: "0 0 20px rgba(51,255,0,0.10)",
        }}
      >
        <strong style={{ textTransform: "uppercase", fontSize: "20px" }}>
          Phosphor IDE
        </strong>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            style={selectCrt}
          >
            <option value="html">HTML</option>
            <option value="javascript">JavaScript</option>
            <option value="css">CSS</option>
            <option value="python">Python</option>
          </select>

          <button
            onClick={handleClear}
            onMouseEnter={() => setHovered("clear")}
            onMouseLeave={() => setHovered(null)}
            style={{ ...btnCrt, ...(hovered === "clear" ? btnCrtHover : {}) }}
          >
            Clear
          </button>

          <button
            onClick={handleDownload}
            onMouseEnter={() => setHovered("dl")}
            onMouseLeave={() => setHovered(null)}
            style={{ ...btnCrt, ...(hovered === "dl" ? btnCrtHover : {}) }}
          >
            Download
          </button>

          {language === "html" && (
            <button
              onClick={handleRun}
              onMouseEnter={() => setHovered("run")}
              onMouseLeave={() => setHovered(null)}
              style={{ ...btnCrt, ...(hovered === "run" ? btnCrtHover : {}) }}
            >
              Run Code
            </button>
          )}
        </div>
      </div>

      {/* Split View: Editor + Preview */}
      <div
        style={{
          flex: 1,
          display: "flex",
          gap: "1rem",
          overflow: "hidden",
        }}
      >
        {/* Editor Panel */}
        <div
          style={{
            flex: 1,
            border: "2px solid #1a8000",
            display: "flex",
            flexDirection: "column",
            background: "#000",
            boxShadow: "0 0 18px rgba(51,255,0,0.10)",
          }}
        >
          <div
            style={{
              background: "#000",
              color: "#33ff00",
              padding: "8px 12px",
              fontSize: "14px",
              borderBottom: "2px solid #1a8000",
              fontWeight: "bold",
              letterSpacing: "2px",
              fontFamily: "'VT323', monospace",
              textShadow: "0 0 1px #33ff00, 0 0 10px rgba(51,255,0,0.25)",
            }}
          >
            CODE
          </div>
          <Editor
            height="100%"
            width="100%"
            language={monacoLang[language] || "plaintext"}
            value={code}
            onChange={(value) => setCode(value || "")}
            theme="vs-dark"
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              automaticLayout: true,
              wordWrap: "on",
              scrollBeyondLastLine: false,
              lineNumbers: "on",
              renderLineHighlight: "all",
              cursorBlinking: "smooth",
            }}
          />
        </div>

        {/* Preview Panel */}
        <div
          style={{
            flex: 1,
            border: "2px solid #1a8000",
            display: "flex",
            flexDirection: "column",
            background: "#000",
            boxShadow: "0 0 18px rgba(51,255,0,0.10)",
          }}
        >
          <div
            style={{
              background: "#000",
              color: "#33ff00",
              padding: "8px 12px",
              fontSize: "14px",
              borderBottom: "2px solid #1a8000",
              fontWeight: "bold",
              letterSpacing: "2px",
              fontFamily: "'VT323', monospace",
              textShadow: "0 0 1px #33ff00, 0 0 10px rgba(51,255,0,0.25)",
            }}
          >
            PREVIEW {language !== "html" && "(HTML only)"}
          </div>

          {language === "html" ? (
            <iframe
              key={previewCode}
              srcDoc={previewCode}
              title="preview"
              sandbox="allow-scripts allow-modals"
              style={{
                flex: 1,
                border: "none",
                background: "white",
                width: "100%",
                height: "100%",
              }}
            />
          ) : (
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                color: "#1a8000",
                fontFamily: "'VT323', monospace",
                fontSize: "18px",
                background: "#050a05",
                gap: "10px",
                textTransform: "uppercase",
                letterSpacing: "2px",
                textShadow: "0 0 1px #33ff00, 0 0 10px rgba(51,255,0,0.15)",
              }}
            >
              <div>Preview only available for HTML</div>
              <div style={{ fontSize: "16px", color: "#33ff00", opacity: 0.6 }}>
                Switch to HTML to see live preview
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
