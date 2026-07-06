"use client";

import { useFieldArray, useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useUpsertSalaryStructure } from "@salary-mgmt/store";
import { ApiError } from "@salary-mgmt/store";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Button,
  Input,
  Label,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@salary-mgmt/ui";

const COMMON_CURRENCIES = ["USD", "EUR", "GBP", "INR", "SGD", "AED", "AUD", "CAD", "JPY"];

const componentSchema = z.object({
  code: z
    .string()
    .min(1, "Code is required")
    .regex(/^[A-Z][A-Z0-9_]*$/, "Must be SCREAMING_SNAKE_CASE"),
  kind: z.enum(["EARNING", "DEDUCTION"], { error: "Select a kind" }),
  amountMinor: z
    .number({ error: "Amount is required" })
    .int("Must be a whole number")
    .min(0, "Must be ≥ 0"),
});

const upsertSchema = z.object({
  effectiveFrom: z
    .string()
    .min(1, "Effective from is required")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD"),
  currency: z.string().min(1, "Currency is required"),
  components: z.array(componentSchema).min(1, "At least one component is required"),
});

type FormValues = z.infer<typeof upsertSchema>;

interface UpsertSalaryStructureDialogProps {
  employeeId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UpsertSalaryStructureDialog({
  employeeId,
  open,
  onOpenChange,
}: UpsertSalaryStructureDialogProps) {
  const { mutate, isPending } = useUpsertSalaryStructure(employeeId);

  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(upsertSchema),
    defaultValues: {
      effectiveFrom: "",
      currency: "",
      components: [{ code: "", kind: "EARNING", amountMinor: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "components" });

  function onSubmit(values: FormValues) {
    mutate(
      {
        effectiveFrom: values.effectiveFrom,
        currency: values.currency,
        components: values.components,
      },
      {
        onSuccess: () => {
          reset();
          onOpenChange(false);
        },
        onError: (err) => {
          if (err instanceof ApiError && err.status === 409) {
            setError("effectiveFrom", {
              message: "effectiveFrom must be after the current version's effectiveFrom",
            });
          }
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Set Salary Structure</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="effectiveFrom">Effective From</Label>
            <Input
              id="effectiveFrom"
              placeholder="YYYY-MM-DD"
              {...register("effectiveFrom")}
            />
            {errors.effectiveFrom && (
              <p role="alert" className="text-destructive text-xs">
                {errors.effectiveFrom.message}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="currency">Currency</Label>
            <Controller
              control={control}
              name="currency"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="currency" aria-label="Currency">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {COMMON_CURRENCIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.currency && (
              <p role="alert" className="text-destructive text-xs">
                {errors.currency.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Components</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ code: "", kind: "EARNING", amountMinor: 0 })}
              >
                Add component
              </Button>
            </div>

            {errors.components?.root && (
              <p role="alert" className="text-destructive text-xs">
                {errors.components.root.message}
              </p>
            )}

            {fields.map((field, i) => (
              <div key={field.id} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-end">
                <div className="space-y-1">
                  <Label htmlFor={`components.${i}.code`}>Code</Label>
                  <Input
                    id={`components.${i}.code`}
                    placeholder="BASIC"
                    {...register(`components.${i}.code`)}
                  />
                  {errors.components?.[i]?.code && (
                    <p role="alert" className="text-destructive text-xs">
                      {errors.components[i].code?.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <Label htmlFor={`components.${i}.kind`}>Kind</Label>
                  <Controller
                    control={control}
                    name={`components.${i}.kind`}
                    render={({ field: f }) => (
                      <Select value={f.value} onValueChange={f.onChange}>
                        <SelectTrigger id={`components.${i}.kind`} aria-label="Kind">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="EARNING">Earning</SelectItem>
                          <SelectItem value="DEDUCTION">Deduction</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor={`components.${i}.amountMinor`}>Amount</Label>
                  <Input
                    id={`components.${i}.amountMinor`}
                    type="number"
                    min={0}
                    step={1}
                    {...register(`components.${i}.amountMinor`, { valueAsNumber: true })}
                  />
                  {errors.components?.[i]?.amountMinor && (
                    <p role="alert" className="text-destructive text-xs">
                      {errors.components[i].amountMinor?.message}
                    </p>
                  )}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  aria-label="Remove"
                  disabled={fields.length === 1}
                  onClick={() => remove(i)}
                >
                  ✕
                </Button>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving…" : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
