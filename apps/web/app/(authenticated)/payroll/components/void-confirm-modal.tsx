"use client";

import { useState } from "react";
import { useVoidPayrollRun } from "@salary-mgmt/store";
import { ApiError } from "@salary-mgmt/store";
import { useToast } from "@salary-mgmt/ui";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Button,
} from "@salary-mgmt/ui";

interface VoidConfirmModalProps {
  period: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function VoidConfirmModal({ period, open, onOpenChange }: VoidConfirmModalProps) {
  const { mutate, isPending } = useVoidPayrollRun();
  const { toast } = useToast();
  const [inlineError, setInlineError] = useState<string | null>(null);

  function handleConfirm() {
    setInlineError(null);
    mutate(period, {
      onSuccess: () => {
        toast({ title: `Payroll run ${period} has been voided.` });
        onOpenChange(false);
      },
      onError: (err: Error) => {
        if (err instanceof ApiError && err.status === 409) {
          setInlineError("This run has already been voided.");
        } else {
          setInlineError("An unexpected error occurred. Please try again.");
        }
      },
    });
  }

  function handleOpenChange(next: boolean) {
    if (!next) setInlineError(null);
    onOpenChange(next);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Void Payroll Run</DialogTitle>
          <DialogDescription>
            Void payroll run for <strong>{period}</strong>? This will mark the run as voided.
            Employee payslips will remain on record.
          </DialogDescription>
        </DialogHeader>

        {inlineError && (
          <p role="alert" className="text-destructive text-sm">
            {inlineError}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirm}
            disabled={isPending}
          >
            {isPending ? "Voiding…" : "Void Run"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
