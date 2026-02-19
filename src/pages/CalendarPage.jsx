// src/pages/CalendarPage.jsx
import React from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { useBase } from "../hooks/useBase";
import { safe } from "../utils/safe";
import { Loader2, Calendar as CalendarIcon } from "lucide-react";

/**
 * CalendarPage: High-level visual schedule for all restaurant bookings.
 */
export function CalendarPage() {
  const { items, loading } = useBase("reservations");

  // 1. Map API data to FullCalendar Event objects
  const events = safe.array(items).map((res) => {
    // Ensure 24h format for ISO string (HH:MM:SS)
    const startTime = res.start_time?.includes(":") ? res.start_time : "00:00";
    const endTime = res.end_time?.includes(":") ? res.end_time : startTime;

    const start = `${res.date}T${startTime}:00`;
    const end = `${res.date}T${endTime}:00`;

    // Map status to brand colors
    let color = "#3b82f6"; // Info Blue
    if (res.status === "cancelled") color = "#ef4444"; // Red
    if (res.status === "confirmed") color = "#22c55e"; // Success Green
    if (res.status === "fired") color = "#f59e0b"; // Operational Orange

    return {
      id: String(res.id),
      title: `${res.meal_type.toUpperCase()} - ${res.attendees?.length || 0} guests`,
      start,
      end,
      backgroundColor: color,
      borderColor: color,
      textColor: "#fff",
      // Extended props for the alert/modal
      extendedProps: {
        table: res.table?.table_number || "TBD",
        status: res.status,
      },
    };
  });

  if (loading) {
    return (
      <div style={loadingStyle}>
        <Loader2 className="animate-spin" size={32} />
        <p>Syncing Master Schedule...</p>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <header style={headerStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <CalendarIcon size={28} color="var(--orange)" />
          <h1 style={{ margin: 0, fontWeight: 900, letterSpacing: "-1px" }}>
            Master Schedule
          </h1>
        </div>
      </header>

      <div style={calendarWrapperStyle}>
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          themeSystem="standard"
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay",
          }}
          height="75vh"
          events={events}
          eventClick={(info) => {
            const { table, status } = info.event.extendedProps;
            alert(
              `RESERVATION #${info.event.id}\n` +
                `Status: ${status.toUpperCase()}\n` +
                `Table: ${table}\n` +
                `Party: ${info.event.title}`,
            );
          }}
          // Mobile friendly settings
          dayMaxEvents={true}
          nowIndicator={true}
        />
      </div>
    </div>
  );
}

// --- Styles (Bagger Brand Identity) ---

const containerStyle = {
  maxWidth: "1200px",
  margin: "0 auto",
  padding: "40px 20px",
};

const headerStyle = {
  marginBottom: "32px",
};

const calendarWrapperStyle = {
  background: "white",
  padding: "24px",
  borderRadius: "16px",
  border: "2px solid #000",
  boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
};

const loadingStyle = {
  height: "70vh",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: "16px",
  color: "var(--muted)",
  fontWeight: 700,
};
