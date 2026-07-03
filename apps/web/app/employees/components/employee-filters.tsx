"use client";

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@salary-mgmt/ui";
import { DEPARTMENTS, type Department, type EmploymentStatus } from "@salary-mgmt/types";

const STATUSES: { value: EmploymentStatus; label: string }[] = [
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
  { value: "TERMINATED", label: "Terminated" },
];

interface FilterState {
  department: Department[];
  country: string[];
  status: EmploymentStatus[];
}

interface EmployeeFiltersProps extends FilterState {
  onFilterChange: (filters: Partial<FilterState>) => void;
}

export function EmployeeFilters({
  department,
  status,
  onFilterChange,
}: EmployeeFiltersProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <Select
        value={department[0] ?? ""}
        onValueChange={(val) => onFilterChange({ department: val ? [val as Department] : [] })}
      >
        <SelectTrigger aria-label="Department" className="w-40">
          <SelectValue placeholder="Department" />
        </SelectTrigger>
        <SelectContent>
          {DEPARTMENTS.map((d) => (
            <SelectItem key={d} value={d}>
              {d}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={status[0] ?? ""}
        onValueChange={(val) =>
          onFilterChange({ status: val ? [val as EmploymentStatus] : [] })
        }
      >
        <SelectTrigger aria-label="Status" className="w-36">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          {STATUSES.map((s) => (
            <SelectItem key={s.value} value={s.value}>
              {s.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
