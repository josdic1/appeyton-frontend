// src/hooks/useBooking.jsx
// 2-step booking flow:
//   1. POST /api/reservations        → gets reservation_id from meta
//   2. POST /api/reservation-attendees × N (member + guests, parallel)
import { useState, useCallback } from "react";
import { api } from "../utils/api";

export function useBooking({ onSuccess, onError } = {}) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const book = useCallback(
    async ({ reservationPayload, attendees = [] }) => {
      setSubmitting(true);
      setError(null);
      try {
        // Step 1 — create reservation
        const resData = await api.post("/api/reservations", reservationPayload);

        // Backend returns ToastResponse; reservation_id is in meta
        const reservationId = resData?.meta?.reservation_id;
        if (!reservationId) {
          throw new Error(
            resData?.what ||
              resData?.detail ||
              "Booking failed — no reservation ID returned",
          );
        }

        // Step 2 — create attendees in parallel
        if (attendees.length > 0) {
          await Promise.all(
            attendees.map((a) =>
              api.post("/api/reservation-attendees", {
                reservation_id: reservationId,
                name: a.name,
                attendee_type: a.attendee_type,
                dietary_restrictions: a.dietary_restrictions || null,
              }),
            ),
          );
        }

        onSuccess?.({ id: reservationId, ...resData });
        return { success: true, reservationId };
      } catch (err) {
        const msg = err.message || "Something went wrong";
        setError(msg);
        onError?.(msg);
        return { success: false, error: msg };
      } finally {
        setSubmitting(false);
      }
    },
    [onSuccess, onError],
  );

  return { book, submitting, error };
}
