import { DEPARTMENTS, type Department } from "@salary-mgmt/types";
import { z } from "zod";

export const employeeSchema = z.object({
  employeeCode: z.string().min(1, "Employee code is required"),
  name: z.string().min(1, "Full name is required"),
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  department: z.enum(DEPARTMENTS as unknown as [Department, ...Department[]], {
    error: "Select a valid department",
  }),
  designation: z.string().min(1, "Designation is required"),
  country: z.string().min(1, "Country is required").max(2, "Use ISO-3166 2-letter code"),
  currency: z.string().min(1, "Currency is required").max(3, "Use ISO-4217 3-letter code"),
  joiningDate: z.string().min(1, "Joining date is required"),
  employmentStatus: z.enum(["ACTIVE", "INACTIVE", "TERMINATED"]).optional(),
  costCenter: z.string().nullable().optional(),
});

export type EmployeeFormValues = z.infer<typeof employeeSchema>;
