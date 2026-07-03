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
} from "@salary-mgmt/ui";
import type { Employee, PaginatedResponse } from "@salary-mgmt/types";

interface EmployeeListProps {
  data: PaginatedResponse<Employee> | undefined;
  isLoading: boolean;
  isError: boolean;
  onRowClick?: (id: string) => void;
}

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive"> = {
  ACTIVE: "default",
  INACTIVE: "secondary",
  TERMINATED: "destructive",
};

export function EmployeeList({ data, isLoading, isError, onRowClick }: EmployeeListProps) {
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

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Code</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Department</TableHead>
          <TableHead>Country</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Joining Date</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.data.map((emp) => (
          <TableRow
            key={emp.id}
            className={onRowClick ? "cursor-pointer" : undefined}
            onClick={() => onRowClick?.(emp.id)}
          >
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
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
