import { useState } from "react";
import { Input } from "@/components/ui/input";
import { SelectContent, SelectItem } from "@/components/ui/select";

export function SelectContentWithSearch({ allUsers = [], currentUserId }) {
  const [search, setSearch] = useState("");

  const filteredUsers =
    search.trim().length === 0
      ? allUsers.filter((u) => u.id === currentUserId) // show only current user
      : allUsers.filter((user) => {
          const text = (user.full_name || user.email).toLowerCase();
          return text.startsWith(search.toLowerCase());
        });

  return (
    <SelectContent className="p-2">
      {/* Search Input */}
      <Input
        autoFocus
        placeholder="Search user..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-2"
      />

      {/* Show ONLY matches */}
      {filteredUsers.map((user) => (
        <SelectItem key={user.id} value={user.id}>
          {user.full_name || user.email}
          {user.id === currentUserId && " (You)"}
        </SelectItem>
      ))}

      {/* No results */}
      {search.trim() !== "" && filteredUsers.length === 0 && (
        <div className="text-center py-2 text-sm text-muted-foreground">
          No users found
        </div>
      )}
    </SelectContent>
  );
}
