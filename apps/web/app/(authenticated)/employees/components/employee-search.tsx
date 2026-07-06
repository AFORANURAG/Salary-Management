"use client";

import { useState, useEffect } from "react";
import { Input } from "@salary-mgmt/ui";
import { useDebounce } from "@salary-mgmt/store";

interface EmployeeSearchProps {
  value: string;
  onSearch: (value: string) => void;
  debounceMs?: number;
}

export function EmployeeSearch({ value, onSearch, debounceMs = 400 }: EmployeeSearchProps) {
  const [localValue, setLocalValue] = useState(value);
  const debounced = useDebounce(localValue, debounceMs);

  useEffect(() => {
    if (debounced !== value) {
      onSearch(debounced);
    }
  }, [debounced]);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  return (
    <Input
      role="searchbox"
      type="search"
      placeholder="Search by name, code, or email…"
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
    />
  );
}
