"use client";

import { Suspense } from "react";
import { Skeleton } from "@salary-mgmt/ui";
import { SetupForm } from "./setup-form";

export default function SetupPage(): React.JSX.Element {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full max-w-sm" />}>
      <SetupForm />
    </Suspense>
  );
}
