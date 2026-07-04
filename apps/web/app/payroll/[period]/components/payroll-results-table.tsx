"use client";

import { useState } from "react";
import type { PayrollResult } from "@salary-mgmt/types";
import { formatMinor } from "@salary-mgmt/money";
import { Input } from "@salary-mgmt/ui";
import { usePayrollResults } from "@salary-mgmt/store";

interface PayrollResultsTableProps {
  period: string;
}

export function PayrollResultsTable({ period }: PayrollResultsTableProps) {
  const [employeeId, setEmployeeId] = useState("");
  const { data: results, isLoading } = usePayrollResults(
    period,
    employeeId.trim() || undefined,
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium">Results</span>
        <Input
          placeholder="Filter by employee ID"
          className="w-72"
          value={employeeId}
          onChange={(e) => setEmployeeId(e.target.value)}
          aria-label="Filter by employee ID"
        />
      </div>

      {isLoading && (
        <p className="text-muted-foreground text-sm">Loading results…</p>
      )}

      {!isLoading && results && (
        <div className="overflow-hidden rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-2 text-left font-medium">Employee ID</th>
                <th className="px-4 py-2 text-right font-medium">Gross</th>
                <th className="px-4 py-2 text-right font-medium">Deductions</th>
                <th className="px-4 py-2 text-right font-medium">Net</th>
                <th className="px-4 py-2 text-left font-medium">Currency</th>
              </tr>
            </thead>
            <tbody>
              {results.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-muted-foreground px-4 py-6 text-center text-sm">
                    No results found.
                  </td>
                </tr>
              ) : (
                results.map((r: PayrollResult) => (
                  <tr key={r.id} className="border-t">
                    <td className="px-4 py-2 font-mono text-xs">{r.employeeId}</td>
                    <td className="px-4 py-2 text-right">{formatMinor(r.grossMinor, r.currency)}</td>
                    <td className="px-4 py-2 text-right">{formatMinor(r.deductionsMinor, r.currency)}</td>
                    <td className="px-4 py-2 text-right font-medium">{formatMinor(r.netMinor, r.currency)}</td>
                    <td className="px-4 py-2">{r.currency}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
