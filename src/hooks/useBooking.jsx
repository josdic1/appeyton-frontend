import { useState, useCallback } from "react";
import { api } from "../utils/api";

/**
 * useBooking Hook
 * Orchestrates the 2-step reservation process:
 * 1. Creates the base reservation record.
 * 2. Creates all attendee records in parallel using the new ID.
 */
export function useBooking({ onSuccess, onError } = {}) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const book = useCallback(
    async ({ reservationPayload, attendees = [] }) => {
      setSubmitting(true);
      setError(null);

      try {
        // Step 1: Create the Reservation
        // Path normalized: /api/reservations
        const resData = await api.post("/reservations", reservationPayload);

        // Extract ID from the 5W1H meta block
        const reservationId = resData?.meta?.reservation_id;

        if (!reservationId) {
          throw new Error(
            resData?.what || "Booking failed — missing reservation ID.",
          );
        }

        // Step 2: Create Attendees in Parallel
        // We only proceed if the first step was successful.
        if (attendees && attendees.length > 0) {
          await Promise.all(
            attendees.map((attendee) =>
              api.post("/reservation-attendees", {
                reservation_id: reservationId,
                name: attendee.name,
                attendee_type: attendee.attendee_type || "guest",
                dietary_restrictions: attendee.dietary_restrictions || null,
              }),
            ),
          );
        }

        // Trigger external success callbacks (e.g., redirect or local state sync)
        if (onSuccess) {
          onSuccess({ id: reservationId, ...resData });
        }

        return { success: true, reservationId };
      } catch (err) {
        const msg =
          err.message || "An unexpected error occurred during booking.";
        setError(msg);

        if (onError) {
          onError(msg);
        }

        return { success: false, error: msg };
      } finally {
        setSubmitting(false);
      }
    },
    [onSuccess, onError],
  );

  return { book, submitting, error };
}
