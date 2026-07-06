"use client";

import { useState } from "react";
import type { GroupByDimension } from "@salary-mgmt/types";
import { Label, Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@salary-mgmt/ui";
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
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="period">Period</Label>
          <input
            id="period"
            type="month"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="groupBy">Group by</Label>
          <Select value={groupBy} onValueChange={(v) => setGroupBy(v as GroupByDimension)}>
            <SelectTrigger id="groupBy" className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {GROUP_BY_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary */}
      <section className="space-y-2">
        <h2 className="text-base font-semibold">Summary</h2>
        <ReportingSummaryCard period={period} />
      </section>

      {/* Cost breakdown */}
      <section className="space-y-2">
        <h2 className="text-base font-semibold">Cost Breakdown</h2>
        <ReportingCostTable period={period} groupBy={groupBy} />
      </section>
    </div>
  );
}
