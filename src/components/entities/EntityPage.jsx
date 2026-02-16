// src/pages/EntityPage.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useData } from "../hooks/useData";
import { RefreshCw, Search, Plus } from "lucide-react";
import { EntityItem } from "../components/entities/EntityItem";
import { EntityModal } from "../components/entities/EntityModal";
import { EntityViewModal } from "../components/entities/EntityViewModal";
import { EntitySkeleton } from "../components/entities/EntitySkeleton";

const PAGE_SIZE = 10;

export function EntityPage() {
  const {
    loading,
    refreshing,
    entities = [],
    deleteEntity,
    refresh,
  } = useData();

  const [q, setQ] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [page, setPage] = useState(1);

  const [editOpen, setEditOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [viewOpen, setViewOpen] = useState(false);
  const [viewingId, setViewingId] = useState(null);

  const isBusy = loading || refreshing;
  const searchRef = useRef(null);

  useEffect(() => {
    function onKeyDown(e) {
      const key = e.key.toLowerCase();

      if (key === "/") {
        if (
          document.activeElement?.tagName === "INPUT" ||
          document.activeElement?.tagName === "TEXTAREA"
        ) {
          return;
        }
        e.preventDefault();
        searchRef.current?.focus?.();
        return;
      }

      if (key === "n") {
        if (
          editOpen ||
          viewOpen ||
          document.activeElement?.tagName === "INPUT" ||
          document.activeElement?.tagName === "TEXTAREA"
        ) {
          return;
        }
        e.preventDefault();
        openNew();
        return;
      }

      if (key === "escape") {
        if (viewOpen) closeView();
        if (editOpen) closeEditor();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [editOpen, viewOpen]);

  useEffect(() => {
    setPage(1);
  }, [q, categoryFilter]);

  const categories = useMemo(() => {
    const set = new Set();
    (entities || []).forEach((e) => {
      if (e?.category) set.add(e.category);
    });
    return Array.from(set).sort();
  }, [entities]);

  const filtered = useMemo(() => {
    const text = q.trim().toLowerCase();
    const cat = categoryFilter.trim().toLowerCase();

    return (Array.isArray(entities) ? entities : []).filter((e) => {
      const name = String(e?.name || "").toLowerCase();
      const category = String(e?.category || "").toLowerCase();

      if (text && !name.includes(text)) return false;
      if (cat && category !== cat) return false;

      return true;
    });
  }, [entities, q, categoryFilter]);

  const totalPages = useMemo(() => {
    const n = filtered.length;
    return Math.max(1, Math.ceil(n / PAGE_SIZE));
  }, [filtered.length]);

  const pageItems = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  const editingEntity = useMemo(() => {
    if (!editingId) return null;
    return (
      (Array.isArray(entities) ? entities : []).find(
        (e) => e.id === editingId,
      ) || null
    );
  }, [editingId, entities]);

  const viewingEntity = useMemo(() => {
    if (!viewingId) return null;
    return (
      (Array.isArray(entities) ? entities : []).find(
        (e) => e.id === viewingId,
      ) || null
    );
  }, [viewingId, entities]);

  function clearFilters() {
    setQ("");
    setCategoryFilter("");
    setPage(1);
  }

  function openNew() {
    setEditingId(null);
    setEditOpen(true);
  }

  function openEdit(id) {
    setEditingId(id);
    setEditOpen(true);
  }

  function closeEditor() {
    setEditOpen(false);
    setEditingId(null);
  }

  function openView(id) {
    setViewingId(id);
    setViewOpen(true);
  }

  function closeView() {
    setViewOpen(false);
    setViewingId(null);
  }

  function nextPage() {
    setPage((p) => Math.min(totalPages, p + 1));
  }

  function prevPage() {
    setPage((p) => Math.max(1, p - 1));
  }

  return (
    <div
      data-ui="home"
      style={{
        width: "100%",
        display: "grid",
        justifyItems: "center",
        gap: 14,
      }}
    >
      <section data-ui="card" style={{ width: "min(980px, 100%)" }}>
        <div
          data-ui="row"
          style={{ justifyContent: "space-between", flexWrap: "wrap" }}
        >
          <div style={{ display: "grid", gap: 6 }}>
            <div data-ui="title">Entities</div>
            <div data-ui="subtitle">
              <span data-ui="pill">/</span> search •{" "}
              <span data-ui="pill">N</span> new •{" "}
              <span data-ui="pill">←/→</span> page
            </div>
          </div>

          <div data-ui="row" style={{ gap: 10 }}>
            <div
              data-ui="pill"
              data-variant={
                loading ? "info" : refreshing ? "warning" : "success"
              }
            >
              {loading ? "Loading…" : refreshing ? "Syncing…" : "Ready"}
            </div>

            <button
              data-ui="btn-refresh"
              onClick={refresh}
              disabled={isBusy}
              title="Force refresh"
            >
              <RefreshCw
                size={16}
                data-ui="btn-icon"
                data-spin={refreshing ? "true" : "false"}
              />
              <span>{refreshing ? "Refreshing" : "Refresh"}</span>
            </button>

            <button
              data-ui="btn-refresh"
              onClick={openNew}
              disabled={isBusy}
              title="New entity (N)"
            >
              <Plus size={16} />
              <span>New</span>
            </button>
          </div>
        </div>

        <div style={{ height: 14 }} />

        <div data-ui="row" style={{ gap: 10, alignItems: "stretch" }}>
          <div style={{ position: "relative", flex: 1 }}>
            <Search
              size={16}
              style={{ position: "absolute", left: 12, top: 12, opacity: 0.7 }}
            />
            <input
              ref={searchRef}
              data-ui="input"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by name…  ( / )"
              style={{ paddingLeft: 38 }}
              disabled={loading}
            />
          </div>

          <select
            data-ui="input"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            disabled={loading}
            style={{ width: 200 }}
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <button
            data-ui="btn-refresh"
            onClick={clearFilters}
            disabled={loading}
            title="Clear filters"
          >
            <span>Clear</span>
          </button>
        </div>
      </section>

      <section data-ui="card" style={{ width: "min(980px, 100%)" }}>
        <div
          data-ui="row"
          style={{ justifyContent: "space-between", flexWrap: "wrap" }}
        >
          <div style={{ display: "grid", gap: 4 }}>
            <div data-ui="label">Results</div>
            <div data-ui="hint">
              {isBusy ? "Loading…" : `${filtered.length} entities`}
              {q.trim() ? ` • matching "${q.trim()}"` : ""}
            </div>
          </div>

          <div data-ui="row" style={{ gap: 10 }}>
            <button
              data-ui="btn-refresh"
              onClick={prevPage}
              disabled={loading || page <= 1}
              title="Previous page (←)"
            >
              <span>Prev</span>
            </button>

            <div data-ui="pill" data-variant="info">
              Page {page} / {totalPages}
            </div>

            <button
              data-ui="btn-refresh"
              onClick={nextPage}
              disabled={loading || page >= totalPages}
              title="Next page (→)"
            >
              <span>Next</span>
            </button>
          </div>
        </div>

        <div style={{ height: 12 }} />

        {isBusy ? (
          <div data-ui="stack">
            {Array.from({ length: 6 }).map((_, i) => (
              <EntitySkeleton key={i} />
            ))}
          </div>
        ) : pageItems.length ? (
          <div data-ui="stack">
            {pageItems.map((e) => (
              <EntityItem
                key={e.id}
                entity={e}
                onView={() => openView(e.id)}
                onEdit={() => openEdit(e.id)}
              />
            ))}
          </div>
        ) : (
          <div data-ui="empty">
            <div data-ui="empty-title">No matches</div>
            <div data-ui="hint">
              Try clearing filters or create a new entity.
            </div>
          </div>
        )}
      </section>

      <EntityViewModal
        open={viewOpen}
        onClose={closeView}
        entity={viewingEntity}
        onEdit={() => {
          if (!viewingId) return;
          closeView();
          openEdit(viewingId);
        }}
        onDelete={async () => {
          if (!confirm(`Delete "${viewingEntity.name}"?`)) return;
          await deleteEntity(viewingEntity.id);
          closeView();
        }}
      />

      <EntityModal
        open={editOpen}
        onClose={closeEditor}
        mode={editingId ? "edit" : "new"}
        entity={editingEntity}
      />
    </div>
  );
}
