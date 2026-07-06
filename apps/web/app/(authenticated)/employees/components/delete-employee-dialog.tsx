"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Button,
} from "@salary-mgmt/ui";
import { useDeleteEmployee } from "@salary-mgmt/store";

interface DeleteEmployeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeId: string;
  employeeName: string;
}

export function DeleteEmployeeDialog({
  open,
  onOpenChange,
  employeeId,
  employeeName,
}: DeleteEmployeeDialogProps) {
  const { mutate, isPending } = useDeleteEmployee();

  function handleConfirm() {
    mutate(employeeId, { onSuccess: () => onOpenChange(false) });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete Employee</DialogTitle>
        </DialogHeader>
        <p className="text-muted-foreground text-sm">
          Are you sure you want to delete <strong>{employeeName}</strong>? This
          action sets their status to Terminated and cannot be undone.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <Button
            variant="outline"
            aria-label="Cancel"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            aria-label="Confirm"
            onClick={handleConfirm}
            disabled={isPending}
          >
            {isPending ? "Deleting…" : "Confirm"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
