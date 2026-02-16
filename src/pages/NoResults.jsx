export function NoResults({ title = "No results", hint = "Try different filters." }) {
  return (
    <div className="no-results">
      <div className="no-results-title">{title}</div>
      <div className="no-results-hint">{hint}</div>
    </div>
  );
}
