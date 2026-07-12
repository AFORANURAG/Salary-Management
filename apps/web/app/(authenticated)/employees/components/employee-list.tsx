"use client";

import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Skeleton,
  Badge,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  Button,
} from "@salary-mgmt/ui";
import type { Employee, PaginatedResponse } from "@salary-mgmt/types";
import { MoreHorizontal } from "lucide-react";

interface EmployeeListProps {
  data: PaginatedResponse<Employee> | undefined;
  isLoading: boolean;
  isError: boolean;
  onRowClick?: (id: string) => void;
  onEdit?: (employee: Employee) => void;
  onDelete?: (employee: Employee) => void;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
}

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive"> = {
  ACTIVE: "default",
  INACTIVE: "secondary",
  TERMINATED: "destructive",
};

export function EmployeeList({
  data,
  isLoading,
  isError,
  onRowClick,
  onEdit,
  onDelete,
  selectedIds = [],
  onSelectionChange,
}: EmployeeListProps) {
  const selectable = Boolean(onSelectionChange);
  const pageIds = data?.data.map((e) => e.id) ?? [];
  const allSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id));

  function toggleAll() {
    if (!onSelectionChange) return;
    onSelectionChange(allSelected ? [] : pageIds);
  }

  function toggleOne(id: string) {
    if (!onSelectionChange) return;
    onSelectionChange(
      selectedIds.includes(id)
        ? selectedIds.filter((s) => s !== id)
        : [...selectedIds, id],
    );
  }
  if (isError) {
    return (
      <p className="text-destructive py-8 text-center text-sm">
        Failed to load employees. Please try again.
      </p>
    );
  }

  if (isLoading) {
    return (
      <div data-testid="employee-list-skeleton" className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full rounded" />
        ))}
      </div>
    );
  }

  if (!data || data.total === 0) {
    return (
      <p className="text-muted-foreground py-8 text-center text-sm">
        No employees found.
      </p>
    );
  }

  const hasActions = Boolean(onEdit ?? onDelete);

  return (
    <div className="overflow-x-auto rounded-md border border-border">
    <Table>
      <TableHeader>
        <TableRow>
          {selectable && (
            <TableHead className="w-10">
              <input
                type="checkbox"
                aria-label="Select all"
                checked={allSelected}
                onChange={toggleAll}
                className="h-4 w-4 cursor-pointer rounded border-input accent-primary"
              />
            </TableHead>
          )}
          <TableHead>Name</TableHead>
          <TableHead>Code</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Department</TableHead>
          <TableHead>Country</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Joining Date</TableHead>
          {hasActions && <TableHead />}
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.data.map((emp) => (
          <TableRow
            key={emp.id}
            className={onRowClick ? "cursor-pointer" : undefined}
            onClick={() => onRowClick?.(emp.id)}
            data-selected={selectedIds.includes(emp.id) ? "true" : undefined}
          >
            {selectable && (
              <TableCell onClick={(e) => e.stopPropagation()}>
                <input
                  type="checkbox"
                  aria-label={`Select ${emp.name}`}
                  checked={selectedIds.includes(emp.id)}
                  onChange={() => toggleOne(emp.id)}
                  className="h-4 w-4 cursor-pointer rounded border-input accent-primary"
                />
              </TableCell>
            )}
            <TableCell className="font-medium">{emp.name}</TableCell>
            <TableCell>{emp.employeeCode}</TableCell>
            <TableCell>{emp.email}</TableCell>
            <TableCell>{emp.department}</TableCell>
            <TableCell>{emp.country}</TableCell>
            <TableCell>
              <Badge variant={STATUS_VARIANT[emp.employmentStatus] ?? "secondary"}>
                {emp.employmentStatus}
              </Badge>
            </TableCell>
            <TableCell>{emp.joiningDate}</TableCell>
            {hasActions && (
              <TableCell onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label="Row actions">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {onEdit && (
                      <DropdownMenuItem onClick={() => onEdit(emp)}>
                        Edit
                      </DropdownMenuItem>
                    )}
                    {onDelete && (
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => onDelete(emp)}
                      >
                        Delete
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
    </div>
  );
}
