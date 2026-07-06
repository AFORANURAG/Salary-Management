"use client";

import { useState } from "react";
import type { GroupByDimension } from "@salary-mgmt/types";
import { ReportingSummaryCard } from "./components/reporting-summary-card";
import { ReportingCostTable } from "./components/reporting-cost-table";

const GROUP_BY_OPTIONS: { value: GroupByDimension; label: string }[] = [
  { value: "department", label: "Department" },
  { value: "country", label: "Country" },
  { value: "costCenter", label: "Cost Center" },
];

const currentPeriod = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
};

export default function ReportingPage() {
  const [period, setPeriod] = useState(currentPeriod);
  const [groupBy, setGroupBy] = useState<GroupByDimension>("department");

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <h1 className="text-2xl font-semibold tracking-tight">Reporting</h1>

      {/* Controls */}
      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-1">
          <label htmlFor="period" className="text-sm font-medium">
            Period
          </label>
          <input
            id="period"
            type="month"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="rounded-md border px-3 py-1.5 text-sm"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="groupBy" className="text-sm font-medium">
            Group by
          </label>
          <select
            id="groupBy"
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value as GroupByDimension)}
            className="rounded-md border px-3 py-1.5 text-sm"
          >
            {GROUP_BY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary */}
      <section className="space-y-2">
        <h2 className="text-lg font-medium">Summary</h2>
        <ReportingSummaryCard period={period} />
      </section>

      {/* Cost breakdown */}
      <section className="space-y-2">
        <h2 className="text-lg font-medium">Cost Breakdown</h2>
        <ReportingCostTable period={period} groupBy={groupBy} />
      </section>
    </div>
  );
}
