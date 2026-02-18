// src/pages/NewReservationPage.jsx
// Dedicated page at /reservations/new.
// Renders the same ReservationFormModal but auto-opens it and redirects
// home on close/success, so the URL is bookmarkable and shareable.

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { ReservationFormModal } from "../components/reservations/ReservationFormModal";

export function NewReservationPage() {
  const nav = useNavigate();
  const { user } = useAuth();
  const [open, setOpen] = useState(true);

  // If they close the modal without booking, go back
  const handleClose = () => {
    setOpen(false);
    nav(-1);
  };

  return (
    <>
      {/* Minimal page backdrop so the URL feels real */}
      <div
        style={{ padding: "2rem", textAlign: "center", color: "var(--muted)" }}
      >
        <div data-ui="title" style={{ marginBottom: 8 }}>
          New Reservation
        </div>
        <div data-ui="subtitle">Opening booking form…</div>
      </div>

      <ReservationFormModal open={open} onClose={handleClose} user={user} />
    </>
  );
}
