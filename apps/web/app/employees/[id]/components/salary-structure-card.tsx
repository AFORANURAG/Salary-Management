"use client";

import { useSalaryStructure } from "@salary-mgmt/store";
import { Badge, Skeleton } from "@salary-mgmt/ui";
import { formatMinor } from "@salary-mgmt/money";

interface SalaryStructureCardProps {
  employeeId: string;
  onSetStructure?: () => void;
}

export function SalaryStructureCard({ employeeId, onSetStructure }: SalaryStructureCardProps) {
  const { data: structure, isLoading, isError } = useSalaryStructure(employeeId);

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton data-slot="skeleton" className="h-5 w-40" />
        <Skeleton data-slot="skeleton" className="h-4 w-24" />
        <Skeleton data-slot="skeleton" className="h-20 w-full" />
      </div>
    );
  }

  if (isError || !structure) {
    return (
      <div className="text-muted-foreground flex items-center justify-between rounded-md border border-dashed p-4 text-sm">
        <span>No salary structure set</span>
        {onSetStructure && (
          <button
            type="button"
            onClick={onSetStructure}
            className="text-primary text-xs underline-offset-2 hover:underline"
          >
            Set Salary Structure
          </button>
        )}
      </div>
    );
  }

  const earningsTotal = structure.components
    .filter((c) => c.kind === "EARNING")
    .reduce((sum, c) => sum + c.amountMinor, 0);

  const deductionsTotal = structure.components
    .filter((c) => c.kind === "DEDUCTION")
    .reduce((sum, c) => sum + c.amountMinor, 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">Effective from</span>
          <span className="text-sm">{structure.effectiveFrom}</span>
          <span className="text-muted-foreground text-xs">{structure.currency}</span>
        </div>
        {onSetStructure && (
          <button
            type="button"
            onClick={onSetStructure}
            className="text-primary text-xs underline-offset-2 hover:underline"
          >
            Update
          </button>
        )}
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="text-muted-foreground border-b text-xs">
            <th className="py-1 text-left font-medium">Code</th>
            <th className="py-1 text-left font-medium">Kind</th>
            <th className="py-1 text-right font-medium">Amount</th>
          </tr>
        </thead>
        <tbody>
          {structure.components.map((c) => (
            <tr key={c.id} className="border-b last:border-0">
              <td className="py-1.5">{c.code}</td>
              <td className="py-1.5">
                <Badge variant={c.kind === "EARNING" ? "default" : "destructive"} className="text-xs">
                  {c.kind}
                </Badge>
              </td>
              <td className="py-1.5 text-right">{formatMinor(c.amountMinor, structure.currency)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="text-muted-foreground text-xs">
            <td colSpan={2} className="pt-2">Gross earnings</td>
            <td className="pt-2 text-right">{formatMinor(earningsTotal, structure.currency)}</td>
          </tr>
          <tr className="text-muted-foreground text-xs">
            <td colSpan={2}>Deductions</td>
            <td className="text-right">{formatMinor(deductionsTotal, structure.currency)}</td>
          </tr>
          <tr className="text-sm font-medium">
            <td colSpan={2} className="pt-1">Net</td>
            <td className="pt-1 text-right">
              {formatMinor(earningsTotal - deductionsTotal, structure.currency)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
