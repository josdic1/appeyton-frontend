import React, { useState, useEffect } from "react";
import { useDebounce } from "../../hooks/useDebounce";
import { api } from "../../utils/api";
import { safe } from "../../utils/safe";

/**
 * MemberSearch Component
 * Uses debouncing to prevent API spam while searching for guests/members.
 */
export function MemberSearch({ onSelectMember }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // 1. Debounce the raw input value (500ms is perfect for search)
  const debouncedSearch = useDebounce(searchTerm, 500);

  // 2. Trigger search effect
  useEffect(() => {
    // Create an AbortController to cancel previous requests if typing resumes
    const controller = new AbortController();

    if (debouncedSearch && debouncedSearch.length > 1) {
      const fetchMembers = async () => {
        setIsSearching(true);
        try {
          const data = await api.get(`/members?q=${debouncedSearch}`, {
            signal: controller.signal,
          });
          // Sanitize incoming array to prevent .map crashes
          setResults(safe.array(data));
        } catch (err) {
          if (err.name !== "AbortError") {
            console.error("Search failed:", err);
          }
        } finally {
          setIsSearching(false);
        }
      };

      fetchMembers();
    } else {
      setResults([]);
    }

    // Cleanup function: cancels the request if debouncedSearch changes again
    return () => controller.abort();
  }, [debouncedSearch]);

  return (
    <div className="search-container" style={{ position: "relative" }}>
      <input
        type="text"
        className="base-input"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search members by name or phone..."
        style={{ width: "100%", padding: "10px" }}
      />

      {isSearching && (
        <div
          style={{
            position: "absolute",
            right: "10px",
            top: "10px",
            fontSize: "12px",
          }}
        >
          Searching...
        </div>
      )}

      {results.length > 0 && (
        <ul
          className="search-results-dropdown"
          style={{
            position: "absolute",
            width: "100%",
            background: "var(--cream)",
            border: "1px solid var(--black)",
            zIndex: 10,
          }}
        >
          {results.map((member) => (
            <li
              key={safe.id(member.id)}
              onClick={() => onSelectMember?.(member)}
              style={{
                padding: "8px",
                cursor: "pointer",
                borderBottom: "1px solid #eee",
              }}
            >
              {member.first_name} {member.last_name}
              <span
                style={{ opacity: 0.5, fontSize: "0.8rem", marginLeft: "8px" }}
              >
                ({member.phone})
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
