// src/components/reservations/ReservationFormModal.jsx
// Plain modal wrapper around ReservationForm.
// Does NOT use BaseModal or BaseForm — those are flat CRUD tools,
// not suited for a multi-step wizard with async side effects.

import { useEffect } from "react";
import { ReservationForm } from "./ReservationForm";
import { useBooking } from "../../hooks/useBooking";
import { useToastTrigger } from "../../hooks/useToast";

export function ReservationFormModal({ open, onClose, user }) {
  const { addToast } = useToastTrigger();

  const { book, submitting, error } = useBooking({
    onSuccess: (res) => {
      addToast({
        type: "success",
        title: "Reservation confirmed!",
        message: `Booking #${res.id} is set.`,
      });
      onClose?.();
    },
    onError: (msg) => {
      addToast({ type: "error", title: "Booking failed", message: msg });
    },
  });

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Lock background scroll
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(0,0,0,0.65)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
    >
      <div
        style={{
          background: "var(--panel)",
          border: "1px solid var(--border-2)",
          borderRadius: "var(--radius)",
          padding: 24,
          width: "min(600px, 100%)",
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "var(--shadow)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <div style={{ fontWeight: 800, fontSize: 17 }}>New Reservation</div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--muted)",
              cursor: "pointer",
              fontSize: 20,
              lineHeight: 1,
              padding: "4px 8px",
            }}
          >
            ✕
          </button>
        </div>

        <ReservationForm
          onSubmit={(reservationPayload, attendees) =>
            book({ reservationPayload, attendees })
          }
          onCancel={onClose}
          submitting={submitting}
          error={error}
          user={user}
        />
      </div>
    </div>
  );
}
