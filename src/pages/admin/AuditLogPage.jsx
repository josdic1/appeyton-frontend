import { useEffect, useState, useCallback } from "react";
import { api } from "../../utils/api";
import { safe } from "../../utils/safe";
import { AuditExplorer } from "../../components/admin/AuditExplorer";
import {
  History,
  Search,
  Filter,
  ShieldCheck,
  LogIn,
  AlertCircle,
  Database,
  RefreshCw,
} from "lucide-react";

export function AuditLogPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, auth, crud, error
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLog, setSelectedLog] = useState(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get("/admin/permissions/history");
      setLogs(safe.array(data));
    } catch (err) {
      console.error("Audit fetch failed", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(log.user_id).includes(searchTerm);
    if (filter === "all") return matchesSearch;
    if (filter === "auth") return matchesSearch && log.action.includes("login");
    if (filter === "security")
      return matchesSearch && log.action.includes("permission");
    return matchesSearch;
  });

  return (
    <div style={containerStyle}>
      <header style={headerStyle}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <History size={28} color="var(--black)" />
            <h1 style={{ margin: 0, fontSize: "2rem", fontWeight: 900 }}>
              System Audit Trail
            </h1>
          </div>
          <p style={{ margin: "4px 0 0", color: "#666", fontWeight: 600 }}>
            Forensic record of all administrative actions
          </p>
        </div>

        <button onClick={fetchLogs} style={refreshBtnStyle} disabled={loading}>
          <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
        </button>
      </header>

      {/* 1. Filters & Search */}
      <section data-ui="card" style={toolbarStyle}>
        <div style={searchBoxStyle}>
          <Search size={18} style={{ opacity: 0.4 }} />
          <input
            type="text"
            placeholder="Search by Action or User ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={inputStyle}
          />
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <FilterBtn active={filter === "all"} onClick={() => setFilter("all")}>
            All
          </FilterBtn>
          <FilterBtn
            active={filter === "auth"}
            onClick={() => setFilter("auth")}
          >
            Auth
          </FilterBtn>
          <FilterBtn
            active={filter === "security"}
            onClick={() => setFilter("security")}
          >
            Security
          </FilterBtn>
        </div>
      </section>

      {/* 2. Log Feed */}
      <div style={feedStyle}>
        {loading && logs.length === 0 ? (
          <div style={loadingStateStyle}>Loading system history...</div>
        ) : filteredLogs.length > 0 ? (
          filteredLogs.map((log) => (
            <LogItem
              key={log.id}
              log={log}
              onExplore={() => setSelectedLog(log)}
            />
          ))
        ) : (
          <div style={emptyStateStyle}>No matching logs found.</div>
        )}
      </div>

      {/* 3. Deep Dive Modal */}
      {selectedLog && (
        <AuditExplorer log={selectedLog} onClose={() => setSelectedLog(null)} />
      )}
    </div>
  );
}

// --- Sub-Components ---

function FilterBtn({ children, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        ...filterBtnBase,
        background: active ? "var(--black)" : "white",
        color: active ? "white" : "var(--black)",
      }}
    >
      {children}
    </button>
  );
}

function LogItem({ log, onExplore }) {
  const isSecurity = log.action?.includes("permission");
  const isAuth = log.action?.includes("login");

  return (
    <div data-ui="card" style={logItemStyle}>
      <div style={logIconStyle}>
        {isSecurity ? (
          <ShieldCheck color="#818cf8" />
        ) : isAuth ? (
          <LogIn color="#10b981" />
        ) : (
          <Database color="#666" />
        )}
      </div>

      <div style={{ flex: 1 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <div>
            <span style={actionLabelStyle}>
              {log.action?.replace(/_/g, " ")}
            </span>
            <div style={metaTextStyle}>
              <strong>User #{log.user_id}</strong> •{" "}
              {new Date(log.created_at).toLocaleString()}
            </div>
          </div>
          {log.details && (
            <button onClick={onExplore} style={exploreBtnStyle}>
              View Metadata
            </button>
          )}
        </div>
      </div>

      <div style={ipBadgeStyle}>{log.ip_address || "0.0.0.0"}</div>
    </div>
  );
}

// --- Styles ---

const containerStyle = {
  maxWidth: 1000,
  margin: "0 auto",
  padding: "40px 20px",
  display: "grid",
  gap: 24,
};
const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};
const toolbarStyle = {
  padding: "16px 24px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  background: "var(--cream)",
  border: "2px solid #000",
};
const searchBoxStyle = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  flex: 1,
  maxWidth: "400px",
};
const inputStyle = {
  border: "none",
  background: "transparent",
  width: "100%",
  fontWeight: 600,
  outline: "none",
};
const feedStyle = { display: "grid", gap: 12 };
const filterBtnBase = {
  padding: "6px 16px",
  borderRadius: "20px",
  border: "2px solid #000",
  fontWeight: 800,
  cursor: "pointer",
  fontSize: "0.8rem",
};
const refreshBtnStyle = {
  background: "white",
  border: "2px solid #000",
  padding: "10px",
  borderRadius: "8px",
  cursor: "pointer",
};

const logItemStyle = {
  display: "flex",
  alignItems: "center",
  gap: 20,
  padding: "20px",
  background: "white",
  border: "1px solid #eee",
  borderRadius: "12px",
};

const logIconStyle = {
  width: 48,
  height: 48,
  borderRadius: "12px",
  background: "#f8f8f8",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};
const actionLabelStyle = {
  fontWeight: 900,
  fontSize: "1rem",
  textTransform: "capitalize",
  color: "var(--black)",
};
const metaTextStyle = { fontSize: "0.8rem", color: "#666", marginTop: 4 };
const ipBadgeStyle = {
  fontSize: "0.7rem",
  fontWeight: 800,
  color: "#999",
  fontFamily: "monospace",
  background: "#f0f0f0",
  padding: "4px 8px",
  borderRadius: "4px",
};
const exploreBtnStyle = {
  background: "transparent",
  border: "1px solid #ddd",
  padding: "4px 12px",
  borderRadius: "6px",
  fontSize: "0.75rem",
  fontWeight: 800,
  cursor: "pointer",
};
const loadingStateStyle = {
  textAlign: "center",
  padding: "40px",
  opacity: 0.5,
  fontWeight: 700,
};
const emptyStateStyle = {
  textAlign: "center",
  padding: "40px",
  background: "#f9f9f9",
  borderRadius: "12px",
  color: "#999",
  fontWeight: 700,
};
