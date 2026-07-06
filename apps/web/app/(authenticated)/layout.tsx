"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { SessionProvider, useSessionContext } from "@/components/session-provider";
import { Sheet, SheetContent, Skeleton } from "@salary-mgmt/ui";
import { AppSidebar } from "@/components/shell/app-sidebar";
import { AppHeader } from "@/components/shell/app-header";
import { BreadcrumbBar } from "@/components/shell/breadcrumb-bar";

function ShellSkeleton(): React.JSX.Element {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="h-14 bg-background border-b border-border flex items-center px-4 gap-4">
        <Skeleton className="h-7 w-7 rounded-md" />
        <Skeleton className="h-4 w-28" />
        <div className="flex-1" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
      <div className="flex flex-1">
        <div className="w-60 border-r border-border p-3 space-y-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full rounded-md" />
          ))}
        </div>
        <div className="flex-1 p-8 space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    </div>
  );
}

function AuthGate({ children }: { children: React.ReactNode }): React.JSX.Element {
  const { isLoading, isAuthenticated } = useSessionContext();
  const router = useRouter();
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Close drawer on route change
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return <ShellSkeleton />;
  }

  if (!isAuthenticated) {
    return <></>;
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <AppHeader onMenuClick={() => setDrawerOpen(true)} />
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop sidebar — hidden below md */}
        <div className="hidden md:flex">
          <AppSidebar />
        </div>

        {/* Mobile drawer */}
        <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
          <SheetContent
            data-testid="mobile-drawer"
            className="w-60 p-0"
            aria-label="Navigation"
          >
            <AppSidebar />
          </SheetContent>
        </Sheet>

        <main className="flex-1 flex flex-col overflow-hidden">
          <BreadcrumbBar />
          <div className="flex-1 overflow-y-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
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
