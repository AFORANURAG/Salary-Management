"use client";

import { useState } from "react";
import { useSalaryStructureHistory } from "@salary-mgmt/store";
import { Badge } from "@salary-mgmt/ui";
import { formatMinor } from "@salary-mgmt/money";

interface SalaryStructureHistoryProps {
  employeeId: string;
}

export function SalaryStructureHistory({ employeeId }: SalaryStructureHistoryProps) {
  const [expanded, setExpanded] = useState(true);
  const { data: history, isLoading } = useSalaryStructureHistory(employeeId);

  if (isLoading || !history || history.length === 0) return null;

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="text-muted-foreground flex items-center gap-1 text-sm"
      >
        <span>{expanded ? "▾" : "▸"}</span>
        <span>Version history ({history.length})</span>
      </button>

      {expanded && (
        <div className="space-y-3">
          {history.map((v) => {
            const earningsTotal = v.components
              .filter((c) => c.kind === "EARNING")
              .reduce((sum, c) => sum + c.amountMinor, 0);
            const deductionsTotal = v.components
              .filter((c) => c.kind === "DEDUCTION")
              .reduce((sum, c) => sum + c.amountMinor, 0);

            return (
              <div key={v.id} className="rounded-md border p-3 text-sm">
                <div className="text-muted-foreground mb-2 flex items-center gap-2 text-xs">
                  <span>{v.effectiveFrom}</span>
                  <span>→</span>
                  <span>{v.effectiveTo ?? "present"}</span>
                  <span className="ml-auto">{v.currency}</span>
                </div>
                <div className="space-y-1">
                  {v.components.map((c) => (
                    <div key={c.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span>{c.code}</span>
                        <Badge
                          variant={c.kind === "EARNING" ? "default" : "destructive"}
                          className="text-xs"
                        >
                          {c.kind}
                        </Badge>
                      </div>
                      <span>{formatMinor(c.amountMinor, v.currency)}</span>
                    </div>
                  ))}
                </div>
                <div className="text-muted-foreground mt-2 border-t pt-2 text-xs">
                  Net: {formatMinor(earningsTotal - deductionsTotal, v.currency)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
