import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";

export default function CalendarPage() {
  return (
    <div style={{ padding: 16 }}>
      <FullCalendar
        plugins={[timeGridPlugin, dayGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        height="auto"
        events={[
          {
            id: "1",
            title: "Test Reservation",
            start: "2026-02-16T18:00:00",
            end: "2026-02-16T19:00:00",
          },
        ]}
      />
    </div>
  );
}
