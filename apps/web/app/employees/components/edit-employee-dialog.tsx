"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@salary-mgmt/ui";
import { useUpdateEmployee } from "@salary-mgmt/store";
import type { Employee } from "@salary-mgmt/types";
import { EmployeeForm } from "./employee-form";
import type { EmployeeFormValues } from "../schemas/employee.schema";

interface EditEmployeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: Employee;
}

export function EditEmployeeDialog({ open, onOpenChange, employee }: EditEmployeeDialogProps) {
  const { mutate, isPending } = useUpdateEmployee();

  function handleSubmit(values: EmployeeFormValues) {
    mutate(
      { id: employee.id, input: values },
      { onSuccess: () => onOpenChange(false) }
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Employee</DialogTitle>
        </DialogHeader>
        <EmployeeForm
          defaultValues={{
            employeeCode: employee.employeeCode,
            name: employee.name,
            email: employee.email,
            department: employee.department,
            designation: employee.designation,
            country: employee.country,
            currency: employee.currency,
            joiningDate: employee.joiningDate,
            employmentStatus: employee.employmentStatus,
            costCenter: employee.costCenter,
          }}
          onSubmit={handleSubmit}
          isPending={isPending}
          submitLabel="Save Changes"
        />
      </DialogContent>
    </Dialog>
  );
}
