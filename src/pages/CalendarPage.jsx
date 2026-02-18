// src/pages/CalendarPage.jsx
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { useBase } from "../hooks/useBase"; // Custom hook to fetch data

export function CalendarPage() {
  const { items } = useBase("reservations");

  // Convert DB Reservation -> Calendar Event
  const events = items.map((res) => {
    // Combine date "2026-06-05" and time "18:00" into ISO string
    // Assuming times in DB are HH:MM
    const start = `${res.date}T${res.start_time}:00`;
    const end = `${res.date}T${res.end_time}:00`;

    // Color code based on status
    let color = "#3788d8"; // blue default
    if (res.status === "cancelled") color = "#ef4444"; // red
    if (res.status === "confirmed") color = "#22c55e"; // green

    return {
      id: String(res.id),
      title: `${res.meal_type.toUpperCase()} - Table ${res.table_id || "?"} (${res.party_size || res.attendees?.length} ppl)`,
      start: start,
      end: end,
      backgroundColor: color,
      borderColor: color,
    };
  });

  return (
    <div style={{ padding: "20px", background: "white", minHeight: "80vh" }}>
      <h1 data-ui="title" style={{ marginBottom: "20px" }}>
        Reservation Calendar
      </h1>

      <div
        style={{
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          padding: "20px",
          borderRadius: "8px",
        }}
      >
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay",
          }}
          height="auto"
          events={events}
          eventClick={(info) => {
            alert(`Reservation #${info.event.id}\n${info.event.title}`);
          }}
        />
      </div>
    </div>
  );
}
