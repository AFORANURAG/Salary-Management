"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePayrollSummary } from "@salary-mgmt/store";
import { Button } from "@salary-mgmt/ui";
import { useSessionContext } from "@/components/session-provider";
import { PayrollSummaryCard } from "./components/payroll-summary-card";
import { PayrollResultsTable } from "./components/payroll-results-table";
import { VoidConfirmModal } from "../components/void-confirm-modal";
import type { PayrollRunStatus } from "@salary-mgmt/types";

const STATUS_BADGE_CLASSES: Record<PayrollRunStatus, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  COMPLETED: "bg-green-100 text-green-800",
  VOIDED: "bg-red-100 text-red-800",
};

export default function PayrollDetailPage() {
  const { period } = useParams<{ period: string }>();
  const router = useRouter();
  const { user } = useSessionContext();
  const { data: summary, isLoading, isError } = usePayrollSummary(period);
  const [voidOpen, setVoidOpen] = useState(false);

  const isAdmin = user?.role === "ADMIN";

  if (isError) {
    return (
      <div className="mx-auto max-w-5xl p-6">
        <p className="text-destructive text-sm">No payroll run found for {period}.</p>
        <Button variant="outline" className="mt-4" onClick={() => router.back()}>
          Back
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Payroll Run</h1>
            <p className="text-muted-foreground text-sm">{period}</p>
          </div>
          {summary && (
            <span
              data-testid={`status-badge-${summary.status.toLowerCase()}`}
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_BADGE_CLASSES[summary.status]}`}
            >
              {summary.status}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          {isAdmin && summary?.status === "COMPLETED" && (
            <Button variant="destructive" onClick={() => setVoidOpen(true)}>
              Void Run
            </Button>
          )}
          <Button variant="outline" onClick={() => router.back()}>
            Back
          </Button>
        </div>
      </div>

      <PayrollSummaryCard summary={summary} isLoading={isLoading} />

      {!isLoading && <PayrollResultsTable period={period} />}

      <VoidConfirmModal
        period={period}
        open={voidOpen}
        onOpenChange={setVoidOpen}
      />
    </div>
  );
}
