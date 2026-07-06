"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLocalStorage } from "@salary-mgmt/store/hooks";
import { useSessionContext } from "@/components/session-provider";
import { cn } from "@salary-mgmt/ui";
import { NAV_ITEMS, NAV_SECTIONS } from "./nav-items";
import type { HrUserRole } from "@salary-mgmt/types";

function canSeeItem(itemRoles: HrUserRole[] | undefined, userRole: HrUserRole): boolean {
  if (!itemRoles) return true;
  return itemRoles.includes(userRole);
}

function isActive(href: string, pathname: string): boolean {
  if (href === "/") return pathname === "/";
  if (pathname !== href && !pathname.startsWith(href + "/")) return false;
  // Deactivate if a more specific nav item also matches
  return !NAV_ITEMS.some(
    (other) =>
      other.href !== href &&
      other.href.startsWith(href + "/") &&
      (pathname === other.href || pathname.startsWith(other.href + "/")),
  );
}

export function AppSidebar(): React.JSX.Element {
  const pathname = usePathname();
  const { user } = useSessionContext();
  const [collapsed, setCollapsed] = useLocalStorage("hrms_sidebar_collapsed", false);

  const userRole = (user?.role ?? "HR_VIEWER") as HrUserRole;

  return (
    <aside
      data-testid="app-sidebar"
      className={cn(
        "flex flex-col flex-shrink-0 bg-muted/40 border-r border-border overflow-x-hidden overflow-y-auto transition-[width] duration-200",
        collapsed ? "w-16" : "w-60",
      )}
    >
      <nav className="flex-1 px-2 py-3 space-y-0.5">
        {NAV_SECTIONS.map((section) => {
          const items = NAV_ITEMS.filter(
            (item) => item.section === section && canSeeItem(item.roles, userRole),
          );

          if (items.length === 0) return null;

          return (
            <div key={section}>
              {!collapsed && (
                <p className="px-3 pt-4 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground select-none">
                  {section}
                </p>
              )}
              {collapsed && <div className="pt-3" />}

              {items.map((item) => {
                const active = isActive(item.href, pathname);
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={collapsed ? item.label : undefined}
                    data-active={active}
                    className={cn(
                      "flex items-center gap-2.5 rounded-md text-sm transition-colors",
                      collapsed ? "justify-center px-0 py-2" : "px-3 py-2",
                      active
                        ? "bg-accent text-accent-foreground font-medium border-l-2 border-primary pl-[10px]"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                    )}
                  >
                    <Icon className={cn("h-4 w-4 flex-shrink-0", active && "text-primary")} />
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="px-2 py-3 border-t border-border">
        <button
          onClick={() => setCollapsed((c) => !c)}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={cn(
            "flex items-center gap-2 w-full rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors",
            collapsed && "justify-center px-0",
          )}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4 flex-shrink-0" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4 flex-shrink-0" />
              <span className="text-xs">Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
