"use client";

import type { PayrollRunStatus, PayrollRunSummary } from "@salary-mgmt/types";
import { formatMinor } from "@salary-mgmt/money";
import Link from "next/link";

const STATUS_LABELS: Record<PayrollRunStatus, string> = {
  PENDING: "Pending",
  COMPLETED: "Completed",
  VOIDED: "Voided",
};

const STATUS_CLASSES: Record<PayrollRunStatus, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  COMPLETED: "bg-green-100 text-green-800",
  VOIDED: "bg-red-100 text-red-800",
};

function StatusBadge({ status }: { status: PayrollRunStatus }) {
  return (
    <span
      data-testid={`status-badge-${status.toLowerCase()}`}
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_CLASSES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

const FILTER_OPTIONS: { label: string; value: PayrollRunStatus | undefined }[] = [
  { label: "All", value: undefined },
  { label: "Completed", value: "COMPLETED" },
  { label: "Pending", value: "PENDING" },
  { label: "Voided", value: "VOIDED" },
];

interface PayrollRunListProps {
  runs: PayrollRunSummary[];
  statusFilter?: PayrollRunStatus;
  onStatusFilter?: (status: PayrollRunStatus | undefined) => void;
}

export function PayrollRunList({
  runs,
  statusFilter,
  onStatusFilter,
}: PayrollRunListProps) {
  return (
    <div className="space-y-3">
      {onStatusFilter && (
        <div className="flex gap-2" role="group" aria-label="Status filter">
          {FILTER_OPTIONS.map(({ label, value }) => (
            <button
              key={label}
              type="button"
              data-testid={`filter-${label.toLowerCase()}`}
              onClick={() => onStatusFilter(value)}
              className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                statusFilter === value
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {runs.length === 0 ? (
        <div
          data-testid="payroll-run-list-empty"
          className="text-muted-foreground rounded-md border border-dashed p-8 text-center text-sm"
        >
          No payroll runs yet. Click &ldquo;Run Payroll&rdquo; to generate the first one.
        </div>
      ) : (
        <div className="overflow-hidden rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-2 text-left font-medium">Period</th>
                <th className="px-4 py-2 text-left font-medium">Status</th>
                <th className="px-4 py-2 text-right font-medium">Headcount</th>
                <th className="px-4 py-2 text-right font-medium">Total Gross</th>
                <th className="px-4 py-2 text-right font-medium">Total Net</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((run) => (
                <tr key={run.period} className="border-t hover:bg-muted/30">
                  <td className="px-4 py-2">
                    <Link
                      href={`/payroll/${run.period}`}
                      className="text-primary font-medium underline-offset-2 hover:underline"
                    >
                      {run.period}
                    </Link>
                  </td>
                  <td className="px-4 py-2">
                    <StatusBadge status={run.status} />
                  </td>
                  <td className="px-4 py-2 text-right">{run.headcount}</td>
                  <td className="px-4 py-2 text-right">
                    {formatMinor(run.totalGrossMinor, run.currency)}
                  </td>
                  <td className="px-4 py-2 text-right">
                    {formatMinor(run.totalNetMinor, run.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
