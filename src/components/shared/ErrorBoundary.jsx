import React from "react";

export class ErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div data-ui="error-page">
          <h1>Something went wrong</h1>
          <button data-ui="btn" onClick={() => (window.location.href = "/")}>
            Go Home
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
