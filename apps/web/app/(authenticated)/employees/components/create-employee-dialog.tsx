"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@salary-mgmt/ui";
import { useCreateEmployee } from "@salary-mgmt/store";
import { ApiError } from "@salary-mgmt/store";
import { EmployeeForm } from "./employee-form";
import type { EmployeeFormValues } from "../schemas/employee.schema";

interface CreateEmployeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateEmployeeDialog({ open, onOpenChange }: CreateEmployeeDialogProps) {
  const { mutate, isPending } = useCreateEmployee();

  function handleSubmit(values: EmployeeFormValues) {
    mutate(
      {
        ...values,
        employmentStatus: values.employmentStatus ?? "ACTIVE",
      },
      {
        onSuccess: () => onOpenChange(false),
        onError: (err) => {
          if (err instanceof ApiError && err.status === 409) {
            // Server-side conflict surfaced; form stays open
          }
        },
      }
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Employee</DialogTitle>
        </DialogHeader>
        <EmployeeForm
          onSubmit={handleSubmit}
          isPending={isPending}
          submitLabel="Create"
          hideEmployeeCode
        />
      </DialogContent>
    </Dialog>
  );
}
