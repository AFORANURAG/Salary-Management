"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input, Label, Button, Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@salary-mgmt/ui";
import { DEPARTMENTS } from "@salary-mgmt/types";
import { employeeSchema, type EmployeeFormValues } from "../schemas/employee.schema";

interface EmployeeFormProps {
  defaultValues?: Partial<EmployeeFormValues>;
  onSubmit: (values: EmployeeFormValues) => void;
  isPending?: boolean;
  submitLabel?: string;
  hideEmployeeCode?: boolean;
}

export function EmployeeForm({
  defaultValues,
  onSubmit,
  isPending = false,
  submitLabel = "Save",
  hideEmployeeCode = false,
}: EmployeeFormProps) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema),
    defaultValues,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      {!hideEmployeeCode && (
        <div className="space-y-1">
          <Label htmlFor="employeeCode">Employee Code</Label>
          <Input id="employeeCode" {...register("employeeCode")} />
          {errors.employeeCode && (
            <p role="alert" className="text-destructive text-xs">
              {errors.employeeCode.message}
            </p>
          )}
        </div>
      )}

      <div className="space-y-1">
        <Label htmlFor="name">Full Name</Label>
        <Input id="name" {...register("name")} />
        {errors.name && (
          <p role="alert" className="text-destructive text-xs">
            {errors.name.message}
          </p>
        )}
      </div>

      <div className="space-y-1">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" {...register("email")} />
        {errors.email && (
          <p role="alert" className="text-destructive text-xs">
            {errors.email.message}
          </p>
        )}
      </div>

      <div className="space-y-1">
        <Label htmlFor="department">Department</Label>
        <Controller
          name="department"
          control={control}
          render={({ field }) => (
            <Select value={field.value ?? ""} onValueChange={field.onChange}>
              <SelectTrigger id="department" aria-label="Department">
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                {DEPARTMENTS.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.department && (
          <p role="alert" className="text-destructive text-xs">
            {errors.department.message}
          </p>
        )}
      </div>

      <div className="space-y-1">
        <Label htmlFor="designation">Designation</Label>
        <Input id="designation" {...register("designation")} />
        {errors.designation && (
          <p role="alert" className="text-destructive text-xs">
            {errors.designation.message}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="country">Country</Label>
          <Input id="country" placeholder="IN" {...register("country")} />
          {errors.country && (
            <p role="alert" className="text-destructive text-xs">
              {errors.country.message}
            </p>
          )}
        </div>

        <div className="space-y-1">
          <Label htmlFor="currency">Currency</Label>
          <Input id="currency" placeholder="INR" {...register("currency")} />
          {errors.currency && (
            <p role="alert" className="text-destructive text-xs">
              {errors.currency.message}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="joiningDate">Joining Date</Label>
        <Input id="joiningDate" type="date" {...register("joiningDate")} />
        {errors.joiningDate && (
          <p role="alert" className="text-destructive text-xs">
            {errors.joiningDate.message}
          </p>
        )}
      </div>

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? "Saving…" : submitLabel}
      </Button>
    </form>
  );
}
