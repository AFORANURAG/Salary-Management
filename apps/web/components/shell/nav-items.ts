import type { HrUserRole } from "@salary-mgmt/types";
import {
  LayoutDashboard,
  Users,
  UserPlus,
  CreditCard,
  History,
  BarChart3,
  Download,
  FileText,
  Shield,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  /** Roles that can see this item. Undefined = all authenticated roles. */
  roles?: HrUserRole[];
  section: string;
}

export const NAV_ITEMS: NavItem[] = [
  // Overview
  { section: "Overview", label: "Dashboard", href: "/", icon: LayoutDashboard },

  // Workforce
  { section: "Workforce", label: "Employees", href: "/employees", icon: Users },
  {
    section: "Workforce",
    label: "Bulk Operations",
    href: "/employees/bulk",
    icon: UserPlus,
    roles: ["ADMIN", "HR_MANAGER"],
  },

  // Payroll
  { section: "Payroll", label: "Run Payroll", href: "/payroll", icon: CreditCard },
  { section: "Payroll", label: "History", href: "/payroll/history", icon: History },

  // Reporting
  { section: "Reporting", label: "Reports", href: "/reporting", icon: BarChart3 },
  {
    section: "Reporting",
    label: "Export",
    href: "/export",
    icon: Download,
    roles: ["ADMIN", "HR_MANAGER"],
  },

  // Admin
  {
    section: "Admin",
    label: "Audit Log",
    href: "/audit-log",
    icon: FileText,
    roles: ["ADMIN"],
  },
  {
    section: "Admin",
    label: "User Management",
    href: "/users",
    icon: Shield,
    roles: ["ADMIN"],
  },
];

/** Unique ordered section names derived from NAV_ITEMS. */
export const NAV_SECTIONS = [...new Set(NAV_ITEMS.map((i) => i.section))];

/** Lookup a nav item by exact href match, used for page title + breadcrumbs. */
export function getNavItem(pathname: string): NavItem | undefined {
  return NAV_ITEMS.find((i) => i.href === pathname);
}
