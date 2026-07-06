"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { useEmployee } from "@salary-mgmt/store/query";
import { NAV_ITEMS } from "./nav-items";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface Segment {
  label: string;
  href: string;
}

function useEmployeeName(id: string | null): string | null {
  const { data } = useEmployee(id ?? "");
  return id ? (data?.name ?? null) : null;
}

function buildSegments(pathname: string, employeeName: string | null): Segment[] {
  if (pathname === "/") return [];

  const parts = pathname.split("/").filter(Boolean);
  const segments: Segment[] = [];
  let accumulated = "";

  for (const part of parts) {
    accumulated += `/${part}`;

    if (UUID_RE.test(part)) {
      segments.push({ label: employeeName ?? part, href: accumulated });
      continue;
    }

    const navMatch = NAV_ITEMS.find((i) => i.href === accumulated);
    if (navMatch) {
      segments.push({ label: navMatch.label, href: accumulated });
      continue;
    }

    // Fallback: capitalise the segment (e.g. "payslips", "bulk")
    const label = part.charAt(0).toUpperCase() + part.slice(1);
    segments.push({ label, href: accumulated });
  }

  return segments;
}

export function BreadcrumbBar(): React.JSX.Element | null {
  const pathname = usePathname();

  // Extract employee ID from path if present
  const parts = pathname.split("/").filter(Boolean);
  const employeeIdIndex = parts.findIndex((p) => UUID_RE.test(p));
  const employeeId = employeeIdIndex !== -1 ? (parts[employeeIdIndex] ?? null) : null;

  const employeeName = useEmployeeName(employeeId);
  const segments = buildSegments(pathname, employeeName);

  if (segments.length === 0) return null;

  return (
    <div
      data-testid="breadcrumb-bar"
      className="h-10 bg-background border-b border-border flex items-center px-5 gap-1 flex-shrink-0"
    >
      {segments.map((seg, i) => {
        const isLast = i === segments.length - 1;
        return (
          <span key={seg.href} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="h-3 w-3 text-muted-foreground/50 flex-shrink-0" />}
            {isLast ? (
              <span className="text-xs font-medium text-foreground">{seg.label}</span>
            ) : (
              <Link
                href={seg.href}
                className="text-xs text-primary hover:underline underline-offset-2"
              >
                {seg.label}
              </Link>
            )}
          </span>
        );
      })}
    </div>
  );
}
