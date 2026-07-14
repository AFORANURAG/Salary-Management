import { Toaster } from "@salary-mgmt/ui/sonner";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <>
    <div className="min-h-screen flex">
      {/* Left — brand panel */}
      <div className="hidden lg:flex lg:w-[480px] xl:w-[560px] flex-col justify-between bg-primary p-12 flex-shrink-0">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white/15 rounded-lg flex items-center justify-center">
            <svg width="20" height="20" fill="none" viewBox="0 0 16 16">
              <rect x="2" y="2" width="5" height="5" rx="1" fill="white" opacity="0.9" />
              <rect x="9" y="2" width="5" height="5" rx="1" fill="white" opacity="0.6" />
              <rect x="2" y="9" width="5" height="5" rx="1" fill="white" opacity="0.6" />
              <rect x="9" y="9" width="5" height="5" rx="1" fill="white" opacity="0.9" />
            </svg>
          </div>
          <span className="text-white font-semibold text-lg tracking-tight">ACME HRMS</span>
        </div>

        {/* Center copy */}
        <div className="space-y-6">
          <div className="space-y-3">
            <p className="text-white/60 text-sm font-medium uppercase tracking-widest">
              Human Resources Platform
            </p>
            <h1 className="text-white text-4xl xl:text-5xl font-bold leading-tight tracking-tight">
              Manage your<br />workforce with<br />clarity.
            </h1>
          </div>
          <p className="text-white/70 text-base leading-relaxed max-w-xs">
            Payroll, employee records, salary structures, and reporting — unified in one place for ACME operations.
          </p>
        </div>

        {/* Bottom stats */}
        <div className="grid grid-cols-3 gap-6 border-t border-white/15 pt-8">
          {[
            { value: "10k+", label: "Employees" },
            { value: "100%", label: "Payroll accuracy" },
            { value: "Real-time", label: "Reporting" },
          ].map((stat) => (
            <div key={stat.label}>
              <div className="text-white text-xl font-bold">{stat.value}</div>
              <div className="text-white/50 text-xs mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right — form area */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-background">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2 mb-10">
          <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
            <svg width="16" height="16" fill="none" viewBox="0 0 16 16">
              <rect x="2" y="2" width="5" height="5" rx="1" fill="white" opacity="0.9" />
              <rect x="9" y="2" width="5" height="5" rx="1" fill="white" opacity="0.6" />
              <rect x="2" y="9" width="5" height="5" rx="1" fill="white" opacity="0.6" />
              <rect x="9" y="9" width="5" height="5" rx="1" fill="white" opacity="0.9" />
            </svg>
          </div>
          <span className="font-semibold text-base tracking-tight">ACME HRMS</span>
        </div>

        <div className="w-full max-w-sm">
          {children}
        </div>

        <p className="mt-10 text-xs text-muted-foreground">
          © {new Date().getFullYear()} ACME Corp. All rights reserved.
        </p>
      </div>
    </div>
    <Toaster position="bottom-right" richColors />
    </>
  );
}
