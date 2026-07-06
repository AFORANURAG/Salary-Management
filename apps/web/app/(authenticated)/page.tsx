import Link from "next/link";
import {
  Users,
  CreditCard,
  BarChart3,
  UserPlus,
  History,
  Download,
  ArrowRight,
} from "lucide-react";

const STAT_TILES = [
  {
    label: "Employees",
    description: "Manage workforce records",
    icon: Users,
    href: "/employees",
    color: "bg-primary/10 text-primary",
  },
  {
    label: "Run Payroll",
    description: "Process salary for a period",
    icon: CreditCard,
    href: "/payroll",
    color: "bg-emerald-500/10 text-emerald-600",
  },
  {
    label: "Reports",
    description: "Cost and summary analytics",
    icon: BarChart3,
    href: "/reporting",
    color: "bg-amber-500/10 text-amber-600",
  },
  {
    label: "Payroll History",
    description: "Review past payroll runs",
    icon: History,
    href: "/payroll/history",
    color: "bg-sky-500/10 text-sky-600",
  },
  {
    label: "Bulk Operations",
    description: "Import or bulk-update employees",
    icon: UserPlus,
    href: "/employees/bulk",
    color: "bg-violet-500/10 text-violet-600",
  },
  {
    label: "Export",
    description: "Download data as CSV",
    icon: Download,
    href: "/export",
    color: "bg-rose-500/10 text-rose-600",
  },
];

export default function DashboardPage(): React.JSX.Element {
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Welcome to ACME HRMS — manage your workforce, payroll, and reports from here.
        </p>
      </div>

      {/* Quick access grid */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Quick Access
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {STAT_TILES.map((tile) => {
            const Icon = tile.icon;
            return (
              <Link
                key={tile.href}
                href={tile.href}
                className="group flex items-start gap-4 rounded-xl border border-border bg-card p-4 hover:border-primary/40 hover:shadow-sm transition-all"
              >
                <div className={`mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${tile.color}`}>
                  <Icon className="h-4.5 w-4.5" strokeWidth={1.8} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium">{tile.label}</span>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-primary transition-colors flex-shrink-0" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                    {tile.description}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
