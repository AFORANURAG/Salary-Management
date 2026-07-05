"use client";

import { useReportingSummary } from "@salary-mgmt/store";
import { Skeleton } from "@salary-mgmt/ui";
import { formatMinor } from "@salary-mgmt/money";

interface ReportingSummaryCardProps {
  period: string;
}

export function ReportingSummaryCard({ period }: ReportingSummaryCardProps) {
  const { data, isLoading } = useReportingSummary(period);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} data-slot="skeleton" className="h-8 w-full rounded" />
        ))}
      </div>
    );
  }

  if (!data || data.buckets.length === 0) return null;

  return (
    <div className="space-y-4">
      {data.buckets.map((bucket) => (
        <div key={bucket.currency} className="rounded-md border p-4 text-sm">
          <p className="mb-3 font-semibold text-base">{bucket.currency}</p>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Gross</span>
              <span>{formatMinor(bucket.grossMinor, bucket.currency)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Deductions</span>
              <span>({formatMinor(bucket.deductionsMinor, bucket.currency)})</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span>Net Pay</span>
              <span>{formatMinor(bucket.netMinor, bucket.currency)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground pt-1 border-t mt-1">
              <span>Headcount</span>
              <span>{bucket.headcount}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
