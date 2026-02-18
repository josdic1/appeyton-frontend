import { useEffect, useState } from "react";
import { useBase } from "../hooks/useBase";
import { useAuth } from "../hooks/useAuth";
import { ReservationSkeleton } from "../components/reservations/ReservationSkeleton";
import { ReservationFormModal } from "../components/reservations/ReservationFormModal";
import { ReservationDetailModal } from "../components/shared/ReservationSuite";
import { Plus, Calendar, Clock, MapPin, Users, RefreshCw } from "lucide-react";
import { api } from "../utils/api";
import { useToastTrigger } from "../hooks/useToast";

export function ReservationsPage() {
  const { user } = useAuth();
  const { items, loading, refreshing, fetchAll } = useBase("reservations");
  const [selectedRes, setSelectedRes] = useState(null);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const { addToast } = useToastTrigger();

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleCancel = async (id) => {
    if (!confirm("Are you sure you want to cancel?")) return;
    try {
      await api.patch(`/api/reservations/${id}`, { status: "cancelled" });
      addToast({
        type: "success",
        title: "Cancelled",
        message: "Reservation removed.",
      });
      setSelectedRes(null);
      fetchAll();
    } catch (e) {
      addToast({ type: "error", title: "Error", message: "Could not cancel." });
    }
  };

  const handleEdit = (res) => {
    setEditData(res);
    setSelectedRes(null);
    setBookingOpen(true);
  };

  const now = new Date();
  const upcoming = items
    .filter(
      (r) => r.status !== "cancelled" && new Date(r.date + "T23:59:59") >= now,
    )
    .sort((a, b) => new Date(a.date) - new Date(b.date));
  const past = items
    .filter(
      (r) => r.status !== "cancelled" && new Date(r.date + "T23:59:59") < now,
    )
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", display: "grid", gap: 20 }}>
      <section data-ui="card">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <div data-ui="title">My Reservations</div>
            <div data-ui="subtitle">Upcoming and history</div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={fetchAll} disabled={loading} data-ui="btn-refresh">
              <RefreshCw
                size={16}
                className={refreshing ? "animate-spin" : ""}
              />
            </button>
            <button
              onClick={() => {
                setEditData(null);
                setBookingOpen(true);
              }}
              data-ui="btn"
              style={{ background: "var(--success)" }}
            >
              + New Visit
            </button>
          </div>
        </div>
      </section>

      {loading && items.length === 0 && <ReservationSkeleton count={3} />}
      {!loading && items.length === 0 && (
        <div
          style={{
            textAlign: "center",
            padding: "4rem",
            color: "var(--muted)",
          }}
        >
          <Calendar size={48} />
          <p>No bookings yet.</p>
        </div>
      )}

      <div style={{ display: "grid", gap: 12 }}>
        {upcoming.map((res) => (
          <ResCard key={res.id} res={res} onClick={() => setSelectedRes(res)} />
        ))}
        {past.length > 0 && (
          <div data-ui="subtitle" style={{ marginTop: 20 }}>
            History
          </div>
        )}
        {past.map((res) => (
          <ResCard
            key={res.id}
            res={res}
            isPast
            onClick={() => setSelectedRes(res)}
          />
        ))}
      </div>

      {selectedRes && (
        <ReservationDetailModal
          res={selectedRes}
          onClose={() => setSelectedRes(null)}
          onEdit={() => handleEdit(selectedRes)}
          onCancel={() => handleCancel(selectedRes.id)}
        />
      )}
      <ReservationFormModal
        open={bookingOpen}
        initialData={editData}
        user={user}
        onClose={() => {
          setBookingOpen(false);
          fetchAll();
        }}
      />
    </div>
  );
}

function ResCard({ res, isPast, onClick }) {
  const dateStr = new Date(res.date).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  return (
    <div
      onClick={onClick}
      data-ui="card"
      style={{
        padding: 16,
        opacity: isPast ? 0.6 : 1,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        cursor: "pointer",
      }}
    >
      <div>
        <div style={{ fontWeight: 800, fontSize: "1.1rem" }}>
          {dateStr}{" "}
          <span
            style={{
              fontSize: "0.6rem",
              background: "var(--panel-2)",
              padding: "2px 8px",
              borderRadius: 4,
            }}
          >
            {res.meal_type}
          </span>
        </div>
        <div
          style={{ color: "var(--muted)", fontSize: "0.85rem", marginTop: 4 }}
        >
          {res.start_time} • {res.attendees?.length} guests • Table{" "}
          {res.table?.table_number || "TBD"}
        </div>
      </div>
      <div
        style={{
          fontWeight: 900,
          color:
            res.status === "confirmed" ? "var(--success)" : "var(--warning)",
          fontSize: "0.75rem",
        }}
      >
        {res.status.toUpperCase()}
      </div>
    </div>
  );
}
