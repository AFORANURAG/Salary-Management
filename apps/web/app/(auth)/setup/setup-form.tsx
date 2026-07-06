"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter, useSearchParams } from "next/navigation";
import { postSetup, ApiError } from "@salary-mgmt/store";
import { Button, Input, Label, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@salary-mgmt/ui";

const setupSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type SetupFormValues = z.infer<typeof setupSchema>;

export function SetupForm(): React.JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SetupFormValues>({
    resolver: zodResolver(setupSchema),
  });

  if (!token) {
    return (
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Invalid invite link</CardTitle>
          <CardDescription>
            This link is missing a setup token. Ask your admin to resend the
            invitation.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  async function onSubmit(values: SetupFormValues): Promise<void> {
    setServerError(null);
    try {
      await postSetup({ token: token!, name: values.name, password: values.password });
      router.push("/auth/login?setup=success");
    } catch (err) {
      if (err instanceof ApiError && err.status === 410) {
        setServerError("This invite link has expired. Ask your admin for a new one.");
      } else {
        setServerError("Something went wrong. Please try again.");
      }
    }
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl">Set up your account</CardTitle>
        <CardDescription>Choose a name and password to activate your account</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          {serverError && (
            <p role="alert" className="text-destructive text-sm">
              {serverError}
            </p>
          )}
          <div className="space-y-1">
            <Label htmlFor="name">Full name</Label>
            <Input
              id="name"
              type="text"
              autoComplete="name"
              placeholder="Jane Smith"
              {...register("name")}
            />
            {errors.name && (
              <p className="text-destructive text-xs">{errors.name.message}</p>
            )}
          </div>
          <div className="space-y-1">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              {...register("password")}
            />
            {errors.password && (
              <p className="text-destructive text-xs">{errors.password.message}</p>
            )}
          </div>
          <div className="space-y-1">
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              {...register("confirmPassword")}
            />
            {errors.confirmPassword && (
              <p className="text-destructive text-xs">{errors.confirmPassword.message}</p>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Activating…" : "Activate account"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
