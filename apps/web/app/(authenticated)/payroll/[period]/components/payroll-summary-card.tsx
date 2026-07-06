"use client";

import type { PayrollRunSummary } from "@salary-mgmt/types";
import { formatMinor } from "@salary-mgmt/money";
import { Skeleton } from "@salary-mgmt/ui";

interface PayrollSummaryCardProps {
  summary?: PayrollRunSummary;
  isLoading?: boolean;
}

export function PayrollSummaryCard({ summary, isLoading }: PayrollSummaryCardProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} data-slot="skeleton" className="h-16 w-full rounded-md" />
        ))}
      </div>
    );
  }

  if (!summary) return null;

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      <Stat label="Processed" value={String(summary.processed)} />
      <Stat label="Skipped" value={String(summary.skipped.length)} />
      <Stat label="Total Gross" value={formatMinor(summary.totalGrossMinor, "USD")} />
      <Stat label="Total Net" value={formatMinor(summary.totalNetMinor, "USD")} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border p-4">
      <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">{label}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
    </div>
  );
}
