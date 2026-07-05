"use client";

import { useReportingPayrollCost } from "@salary-mgmt/store";
import { Skeleton } from "@salary-mgmt/ui";
import { formatMinor } from "@salary-mgmt/money";
import type { GroupByDimension } from "@salary-mgmt/types";

interface ReportingCostTableProps {
  period: string;
  groupBy: GroupByDimension;
}

export function ReportingCostTable({ period, groupBy }: ReportingCostTableProps) {
  const { data, isLoading } = useReportingPayrollCost(period, groupBy);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} data-slot="skeleton" className="h-10 w-full rounded" />
        ))}
      </div>
    );
  }

  const allGroups = data?.buckets.flatMap((b) =>
    b.groups.map((g) => ({ ...g, currency: b.currency })),
  ) ?? [];

  if (allGroups.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">No results for this period.</p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border text-sm">
      <table className="w-full">
        <thead className="bg-muted/50">
          <tr>
            <th className="px-4 py-2 text-left font-medium capitalize">{groupBy}</th>
            <th className="px-4 py-2 text-right font-medium">Headcount</th>
            <th className="px-4 py-2 text-right font-medium">Gross</th>
            <th className="px-4 py-2 text-right font-medium">Deductions</th>
            <th className="px-4 py-2 text-right font-medium">Net Pay</th>
            <th className="px-4 py-2 text-left font-medium">Currency</th>
          </tr>
        </thead>
        <tbody>
          {allGroups.map((row, i) => (
            <tr key={`${row.currency}-${row.key}-${i}`} className="border-t">
              <td className="px-4 py-2">{row.key}</td>
              <td className="px-4 py-2 text-right">{row.headcount}</td>
              <td className="px-4 py-2 text-right">{formatMinor(row.grossMinor, row.currency)}</td>
              <td className="px-4 py-2 text-right">({formatMinor(row.deductionsMinor, row.currency)})</td>
              <td className="px-4 py-2 text-right font-medium">{formatMinor(row.netMinor, row.currency)}</td>
              <td className="px-4 py-2 text-muted-foreground">{row.currency}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
