"use client";

import { useState } from "react";
import { useRunPayroll } from "@salary-mgmt/store";
import { ApiError } from "@salary-mgmt/store";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Button,
  Input,
  Label,
} from "@salary-mgmt/ui";
import type { PayrollRunSummary } from "@salary-mgmt/types";

interface RunPayrollDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (summary: PayrollRunSummary) => void;
}

const PERIOD_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

export function RunPayrollDialog({ open, onOpenChange, onSuccess }: RunPayrollDialogProps) {
  const [period, setPeriod] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const { mutate, isPending } = useRunPayroll();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setValidationError(null);
    setApiError(null);

    if (!PERIOD_RE.test(period)) {
      setValidationError("Period must be in YYYY-MM format (e.g. 2026-06)");
      return;
    }

    mutate(period, {
      onSuccess: (summary) => {
        setPeriod("");
        onOpenChange(false);
        onSuccess?.(summary);
      },
      onError: (err) => {
        if (err instanceof ApiError && err.status === 409) {
          setApiError(`Payroll for ${period} has already been run.`);
        } else if (err instanceof ApiError && err.status === 400) {
          setValidationError(err.message);
        } else {
          setApiError("An unexpected error occurred. Please try again.");
        }
      },
    });
  }

  function handleOpenChange(open: boolean) {
    if (!open) {
      setPeriod("");
      setValidationError(null);
      setApiError(null);
    }
    onOpenChange(open);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Run Payroll</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="period">Pay Period</Label>
            <Input
              id="period"
              placeholder="YYYY-MM"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
            />
            {validationError && (
              <p role="alert" className="text-destructive text-xs">
                {validationError}
              </p>
            )}
            {apiError && (
              <p role="alert" className="text-destructive text-xs">
                {apiError}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Running…" : "Run Payroll"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
