"use client";

import { Button } from "@salary-mgmt/ui";

interface EmployeePaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}

export function EmployeePagination({
  page,
  pageSize,
  total,
  onPageChange,
}: EmployeePaginationProps) {
  const totalPages = Math.ceil(total / pageSize);
  const isFirst = page <= 1;
  const isLast = page >= totalPages;

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        aria-label="Previous"
        disabled={isFirst}
        onClick={() => onPageChange(page - 1)}
      >
        Previous
      </Button>
      <span className="text-muted-foreground text-sm">
        Page {page} of {totalPages}
      </span>
      <Button
        variant="outline"
        size="sm"
        aria-label="Next"
        disabled={isLast}
        onClick={() => onPageChange(page + 1)}
      >
        Next
      </Button>
    </div>
  );
}
