import React, { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";

export default function SearchableSelect({ users, value, onChange }) {
  const [search, setSearch] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef(null);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter users by name starting with search
  const filteredUsers = users.users.filter((user) =>
    user.name.toLowerCase().startsWith(search.toLowerCase())
  );

  const handleSelect = (user) => {
    onChange(user.id); // directly pass user.id to onChange
    setSearch(user.name);
    setShowSuggestions(false);
  };

  // Update input value if value prop changes
  useEffect(() => {
    const selectedUser = users.users.find((user) => user.id === value);
    if (selectedUser) {
      setSearch(selectedUser.name);
    }
  }, [value, users.users]);

  return (
    <div className="mb-3 position-relative" ref={wrapperRef}>
      <Input
        type="text"
        placeholder="Search user by name..."
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setShowSuggestions(true);
        }}
        onFocus={() => setShowSuggestions(true)}
        className="form-control"
        autoComplete="off"
        required
      />

      {showSuggestions && search && (
        <ul
          className="list-group position-absolute w-100 shadow-sm rounded-3 mt-1"
          style={{
            maxHeight: "220px",
            overflowY: "auto",
            zIndex: 10,
            background: "#fff",
            border: "1px solid #e0e0e0",
          }}
        >
          {filteredUsers.length > 0 ? (
            filteredUsers.map((user) => (
              <li
                key={user.id}
                className="list-group-item list-group-item-action d-flex flex-column"
                style={{
                  cursor: "pointer",
                  padding: "8px 12px",
                  transition: "background-color 0.2s ease",
                }}
                onClick={() => handleSelect(user)}
                onMouseDown={(e) => e.preventDefault()} // prevent input blur
              >
                {user.name}
                <small className="text-muted">{user.email}</small>
              </li>
            ))
          ) : (
            <li
              className="list-group-item text-center text-muted py-3"
              style={{
                backgroundColor: "#f9f9f9",
                fontStyle: "italic",
                border: "none",
              }}
            >
              No users found
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
