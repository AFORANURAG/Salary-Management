"use client";

import { usePathname } from "next/navigation";
import { Bell, Menu } from "lucide-react";
import { cn } from "@salary-mgmt/ui";
import { getNavItem } from "./nav-items";
import { UserMenu } from "./user-menu";

function LogoMark(): React.JSX.Element {
  return (
    <div className="w-7 h-7 bg-primary rounded-md flex items-center justify-center flex-shrink-0">
      <svg width="16" height="16" fill="none" viewBox="0 0 16 16">
        <rect x="2" y="2" width="5" height="5" rx="1" fill="white" opacity="0.9" />
        <rect x="9" y="2" width="5" height="5" rx="1" fill="white" opacity="0.6" />
        <rect x="2" y="9" width="5" height="5" rx="1" fill="white" opacity="0.6" />
        <rect x="9" y="9" width="5" height="5" rx="1" fill="white" opacity="0.9" />
      </svg>
    </div>
  );
}

function NotificationBell(): React.JSX.Element {
  return (
    <button
      aria-label="Notifications"
      className="relative w-8 h-8 flex items-center justify-center rounded-md hover:bg-accent text-muted-foreground transition-colors"
    >
      <Bell className="h-4.5 w-4.5" strokeWidth={1.8} />
      <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-muted-foreground/40 rounded-full" />
    </button>
  );
}

interface AppHeaderProps {
  onMenuClick?: () => void;
}

export function AppHeader({ onMenuClick }: AppHeaderProps): React.JSX.Element {
  const pathname = usePathname();
  const pageTitle = getNavItem(pathname)?.label ?? "ACME HRMS";

  return (
    <header
      data-testid="app-header"
      className="h-14 bg-background border-b border-border flex items-center px-4 gap-3 sticky top-0 z-40 flex-shrink-0"
    >
      {/* Hamburger — mobile only */}
      {onMenuClick && (
        <button
          data-testid="hamburger"
          aria-label="Open navigation"
          onClick={onMenuClick}
          className="md:hidden flex items-center justify-center w-8 h-8 rounded-md hover:bg-accent text-muted-foreground transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>
      )}

      {/* Left: logo + wordmark */}
      <div className="flex items-center gap-2 select-none">
        <LogoMark />
        <span className="font-semibold text-sm tracking-tight">ACME HRMS</span>
      </div>

      <div className="h-5 w-px bg-border" />

      {/* Center: page title */}
      <div className="flex-1">
        <span
          data-testid="page-title"
          className={cn("text-sm font-medium text-muted-foreground")}
        >
          {pageTitle}
        </span>
      </div>

      {/* Right: notifications + user menu */}
      <div className="flex items-center gap-2">
        <NotificationBell />
        <UserMenu />
      </div>
    </header>
  );
}
