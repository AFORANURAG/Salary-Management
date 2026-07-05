"use client";

import { usePayslip } from "@salary-mgmt/store";
import { Skeleton } from "@salary-mgmt/ui";
import { formatMinor } from "@salary-mgmt/money";

interface PayslipCardProps {
  employeeId: string;
  period: string;
}

export function PayslipCard({ employeeId, period }: PayslipCardProps) {
  const { data: payslip, isLoading } = usePayslip(employeeId, period);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} data-slot="skeleton" className="h-8 w-full rounded" />
        ))}
      </div>
    );
  }

  if (!payslip) return null;

  const earnings = payslip.lineItems.filter((li) => li.kind === "EARNING");
  const deductions = payslip.lineItems.filter((li) => li.kind === "DEDUCTION");

  return (
    <div className="space-y-6 rounded-md border p-6 text-sm">
      <div>
        <h2 className="text-lg font-semibold">{payslip.name}</h2>
        <p className="text-muted-foreground">{payslip.employeeCode}</p>
        <p className="text-muted-foreground mt-1">
          {payslip.period} · {payslip.currency}
        </p>
      </div>

      {earnings.length > 0 && (
        <div>
          <h3 className="mb-2 font-medium">Earnings</h3>
          <div className="space-y-1">
            {earnings.map((li) => (
              <div key={li.code} className="flex justify-between">
                <span>{li.code}</span>
                <span>{formatMinor(li.amountMinor, payslip.currency)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {deductions.length > 0 && (
        <div>
          <h3 className="mb-2 font-medium">Deductions</h3>
          <div className="space-y-1">
            {deductions.map((li) => (
              <div key={li.code} className="flex justify-between">
                <span>{li.code}</span>
                <span>({formatMinor(li.amountMinor, payslip.currency)})</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="border-t pt-4 space-y-1">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Gross</span>
          <span>{formatMinor(payslip.grossMinor, payslip.currency)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Deductions</span>
          <span>({formatMinor(payslip.deductionsMinor, payslip.currency)})</span>
        </div>
        <div className="flex justify-between font-semibold">
          <span>Net Pay</span>
          <span>{formatMinor(payslip.netMinor, payslip.currency)}</span>
        </div>
      </div>
    </div>
  );
}
