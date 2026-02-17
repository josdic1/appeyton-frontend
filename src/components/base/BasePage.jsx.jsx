// src/pages/BasePage.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useBase } from "../hooks/useBase";
import { useToastTrigger } from "../hooks/useToast";
import { RefreshCw, Search, Plus } from "lucide-react";
import { BaseItem } from "../components/base/BaseItem";
import { BaseModal } from "../components/base/BaseModal";
import { BaseViewModal } from "../components/base/BaseViewModal";
import { BaseSkeleton } from "../components/base/BaseSkeleton";

const PAGE_SIZE = 10;

export function BasePage({
  // data
  resource, // e.g. "dining-rooms" — passed to useBase
  // page chrome
  title,
  subtitle,
  // item display
  titleKey = "name", // which field renders as the item title
  metaFields = [], // [{ key, label }] shown under the title in BaseItem
  searchKey = "name", // which field the search input filters on
  // form
  formFields = [], // passed directly to BaseModal / BaseForm
  // view modal
  viewFields = [], // [{ key, label, render? }] shown in BaseViewModal
}) {
  const { items, loading, refreshing, fetchAll, create, update, remove } =
    useBase(resource);
  const { addToast } = useToastTrigger();

  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [editOpen, setEditOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewingId, setViewingId] = useState(null);

  const isBusy = loading || refreshing;
  const searchRef = useRef(null);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // ── keyboard shortcuts ───────────────────────────────────────────────
  useEffect(() => {
    function onKeyDown(e) {
      const key = e.key.toLowerCase();
      const inInput =
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA";

      if (key === "/" && !inInput) {
        e.preventDefault();
        searchRef.current?.focus?.();
        return;
      }
      if (key === "n" && !editOpen && !viewOpen && !inInput) {
        e.preventDefault();
        openNew();
        return;
      }
      if (key === "escape") {
        if (viewOpen) closeView();
        else if (editOpen) closeEditor();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [editOpen, viewOpen]);

  useEffect(() => {
    setPage(1);
  }, [q]);

  // ── derived data ─────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const text = q.trim().toLowerCase();
    if (!text) return items;
    return items.filter((item) =>
      String(item?.[searchKey] ?? "")
        .toLowerCase()
        .includes(text),
    );
  }, [items, q, searchKey]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(filtered.length / PAGE_SIZE)),
    [filtered.length],
  );

  const pageItems = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page],
  );

  const editingItem = useMemo(
    () => (editingId ? (items.find((i) => i.id === editingId) ?? null) : null),
    [editingId, items],
  );

  const viewingItem = useMemo(
    () => (viewingId ? (items.find((i) => i.id === viewingId) ?? null) : null),
    [viewingId, items],
  );

  // ── actions ──────────────────────────────────────────────────────────
  async function handleSave(formData) {
    if (editingId) {
      const result = await update(editingId, formData);
      result.success
        ? addToast({
            type: "success",
            title: "Updated",
            message: `${title} updated`,
          })
        : addToast({ type: "error", title: "Error", message: result.error });
    } else {
      const result = await create(formData);
      result.success
        ? addToast({
            type: "success",
            title: "Created",
            message: `${title} created`,
          })
        : addToast({ type: "error", title: "Error", message: result.error });
    }
    closeEditor();
  }

  async function handleDelete(id) {
    const item = items.find((i) => i.id === id);
    if (!confirm(`Delete "${item?.[titleKey] ?? id}"?`)) return;
    const result = await remove(id);
    result.success
      ? addToast({
          type: "success",
          title: "Deleted",
          message: `${title} deleted`,
        })
      : addToast({ type: "error", title: "Error", message: result.error });
    if (viewOpen && viewingId === id) closeView();
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

  // ── render ───────────────────────────────────────────────────────────
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
      {/* header + search */}
      <section data-ui="card" style={{ width: "min(980px, 100%)" }}>
        <div
          data-ui="row"
          style={{ justifyContent: "space-between", flexWrap: "wrap" }}
        >
          <div style={{ display: "grid", gap: 6 }}>
            <div data-ui="title">{title}</div>
            <div data-ui="subtitle">
              {subtitle ?? (
                <>
                  <span data-ui="pill">/</span> search •{" "}
                  <span data-ui="pill">N</span> new •{" "}
                  <span data-ui="pill">←/→</span> page
                </>
              )}
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
            <button data-ui="btn-refresh" onClick={fetchAll} disabled={isBusy}>
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
              title="New (N)"
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
              placeholder={`Search by ${searchKey}…  ( / )`}
              style={{ paddingLeft: 38 }}
              disabled={loading}
            />
          </div>
          <button
            data-ui="btn-refresh"
            onClick={() => setQ("")}
            disabled={loading}
          >
            <span>Clear</span>
          </button>
        </div>
      </section>

      {/* results */}
      <section data-ui="card" style={{ width: "min(980px, 100%)" }}>
        <div
          data-ui="row"
          style={{ justifyContent: "space-between", flexWrap: "wrap" }}
        >
          <div style={{ display: "grid", gap: 4 }}>
            <div data-ui="label">Results</div>
            <div data-ui="hint">
              {isBusy
                ? "Loading…"
                : `${filtered.length} ${title.toLowerCase()}`}
              {q.trim() ? ` • matching "${q.trim()}"` : ""}
            </div>
          </div>
          <div data-ui="row" style={{ gap: 10 }}>
            <button
              data-ui="btn-refresh"
              onClick={prevPage}
              disabled={loading || page <= 1}
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
            >
              <span>Next</span>
            </button>
          </div>
        </div>

        <div style={{ height: 12 }} />

        {isBusy ? (
          <div data-ui="stack">
            {Array.from({ length: 6 }).map((_, i) => (
              <BaseSkeleton key={i} />
            ))}
          </div>
        ) : pageItems.length ? (
          <div data-ui="stack">
            {pageItems.map((item) => (
              <BaseItem
                key={item.id}
                item={item}
                titleKey={titleKey}
                metaFields={metaFields}
                onView={() => openView(item.id)}
                onEdit={() => openEdit(item.id)}
              />
            ))}
          </div>
        ) : (
          <div data-ui="empty">
            <div data-ui="empty-title">No matches</div>
            <div data-ui="hint">
              Try clearing the search or create a new {title.toLowerCase()}.
            </div>
          </div>
        )}
      </section>

      {/* modals */}
      <BaseViewModal
        open={viewOpen}
        onClose={closeView}
        title={viewingItem?.[titleKey] ?? title}
        fields={viewFields}
        item={viewingItem}
        onEdit={() => {
          closeView();
          openEdit(viewingId);
        }}
        onDelete={() => handleDelete(viewingId)}
      />

      <BaseModal
        open={editOpen}
        onClose={closeEditor}
        title={editingId ? `Edit ${title}` : `New ${title}`}
        fields={formFields}
        initialData={editingItem}
        onSubmit={handleSave}
        submitLabel={editingId ? "Update" : "Create"}
      />
    </div>
  );
}
