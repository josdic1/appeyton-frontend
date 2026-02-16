// src/pages/HomePage.jsx
import { Link } from "react-router-dom";

export function HomePage() {
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
        <div data-ui="title">Welcome</div>
        <div style={{ height: 10 }} />
        <div data-ui="subtitle">
          Starter template. Replace with your content.
        </div>

        <div style={{ height: 14 }} />
        <div data-ui="divider" />
        <div style={{ height: 14 }} />

        <div data-ui="row" style={{ gap: 10 }}>
          <Link to="/entities">
            <button type="button" data-ui="btn-refresh">
              <span>View Entities</span>
            </button>
          </Link>
        </div>
      </section>
    </div>
  );
}
