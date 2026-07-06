"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { SessionProvider, useSessionContext } from "@/components/session-provider";
import { Skeleton } from "@salary-mgmt/ui";

function AuthGate({ children }: { children: React.ReactNode }): React.JSX.Element {
  const { isLoading, isAuthenticated } = useSessionContext();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col gap-4 p-8">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <></>;
  }

  return <>{children}</>;
}

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <SessionProvider>
      <AuthGate>{children}</AuthGate>
    </SessionProvider>
  );
}
