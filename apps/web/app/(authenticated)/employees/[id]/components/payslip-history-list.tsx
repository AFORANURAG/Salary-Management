"use client";

import Link from "next/link";
import { usePayslipHistory } from "@salary-mgmt/store";
import { Skeleton } from "@salary-mgmt/ui";
import { formatMinor } from "@salary-mgmt/money";

interface PayslipHistoryListProps {
  employeeId: string;
}

export function PayslipHistoryList({ employeeId }: PayslipHistoryListProps) {
  const { data: history, isLoading } = usePayslipHistory(employeeId);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} data-slot="skeleton" className="h-10 w-full rounded" />
        ))}
      </div>
    );
  }

  if (!history || history.length === 0) {
    return <p className="text-muted-foreground text-sm">No payslips found.</p>;
  }

  return (
    <div className="space-y-2">
      {history.map((item) => (
        <Link
          key={item.period}
          href={`/employees/${employeeId}/payslips/${item.period}`}
          className="flex items-center justify-between rounded-md border p-3 text-sm hover:bg-muted/50 transition-colors"
        >
          <span className="font-medium">{item.period}</span>
          <span className="text-muted-foreground">
            {formatMinor(item.netMinor, item.currency)}
          </span>
        </Link>
      ))}
    </div>
  );
}
