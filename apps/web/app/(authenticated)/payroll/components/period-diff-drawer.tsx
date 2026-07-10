"use client";

import { useState } from "react";
import { ArrowLeftRight } from "lucide-react";
import { usePayrollDiff } from "@salary-mgmt/store";
import { formatMinor } from "@salary-mgmt/money";
import {
  Sheet,
  SheetContent,
  Button,
  Skeleton,
} from "@salary-mgmt/ui";
import type { PayrollDiffEntry, PayrollSalaryChangeEntry } from "@salary-mgmt/types";

function prevMonth(period: string): string {
  const parts = period.split("-");
  const year = parseInt(parts[0] ?? "2000", 10);
  const month = parseInt(parts[1] ?? "1", 10);
  const d = new Date(year, month - 2);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

interface SectionProps {
  title: string;
  count: number;
  children: React.ReactNode;
}

function Section({ title, count, children }: SectionProps) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border-t">
      <button
        type="button"
        className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium hover:bg-muted/30"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span>
          {title}
          <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            {count}
          </span>
        </span>
        <span className="text-muted-foreground">{open ? "▲" : "▼"}</span>
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

function DeltaCell({ deltaMinor, currency }: { deltaMinor: number; currency: string }) {
  const positive = deltaMinor >= 0;
  return (
    <span className={positive ? "text-green-700" : "text-red-700"}>
      {positive ? "+" : ""}
      {formatMinor(deltaMinor, currency)}
    </span>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3 p-4">
      <Skeleton className="h-5 w-2/3" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
    </div>
  );
}

interface PeriodDiffDrawerProps {
  basePeriod: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PeriodDiffDrawer({ basePeriod, open, onOpenChange }: PeriodDiffDrawerProps) {
  const defaultCompareTo = prevMonth(basePeriod);
  const [compareTo, setCompareTo] = useState(defaultCompareTo);

  const { data, isLoading, isError } = usePayrollDiff(
    open ? basePeriod : "",
    open ? compareTo : "",
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className="inset-y-0 right-0 left-auto w-full max-w-xl border-l border-r-0 overflow-y-auto"
        data-side="right"
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center gap-2 border-b px-6 py-4 pr-12">
            <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
            <div className="flex flex-1 items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm">{basePeriod}</span>
              <span className="text-muted-foreground text-xs">vs</span>
              <div className="flex items-center gap-1">
                <label htmlFor="compare-to" className="sr-only">
                  Compare to period
                </label>
                <input
                  id="compare-to"
                  type="month"
                  value={compareTo}
                  onChange={(e) => setCompareTo(e.target.value)}
                  className="rounded border border-input bg-background px-2 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  aria-label="Compare to period"
                />
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1">
            {isLoading && <LoadingSkeleton />}

            {isError && (
              <div
                role="alert"
                className="m-4 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
              >
                Failed to load diff. Check that both periods have been run.
              </div>
            )}

            {data && (
              <>
                {/* Totals tile */}
                <div
                  data-testid="diff-totals"
                  className="grid grid-cols-3 gap-4 p-4"
                >
                  <div className="rounded-md border p-3">
                    <p className="text-xs text-muted-foreground">Base ({data.basePeriod})</p>
                    <p className="mt-1 font-semibold text-sm">
                      {formatMinor(data.totals.baseTotalNetMinor, data.totals.currency)}
                    </p>
                  </div>
                  <div className="rounded-md border p-3">
                    <p className="text-xs text-muted-foreground">Compare ({data.comparePeriod})</p>
                    <p className="mt-1 font-semibold text-sm">
                      {formatMinor(data.totals.compareTotalNetMinor, data.totals.currency)}
                    </p>
                  </div>
                  <div className="rounded-md border p-3">
                    <p className="text-xs text-muted-foreground">Delta</p>
                    <p className="mt-1 font-semibold text-sm">
                      <DeltaCell
                        deltaMinor={data.totals.deltaTotalMinor}
                        currency={data.totals.currency}
                      />
                    </p>
                  </div>
                </div>

                {/* Salary changes */}
                <Section title="Salary Changes" count={data.salaryChanges.length}>
                  {data.salaryChanges.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No salary changes.</p>
                  ) : (
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-left text-muted-foreground">
                          <th className="pb-1 font-medium">Employee</th>
                          <th className="pb-1 text-right font-medium">Before</th>
                          <th className="pb-1 text-right font-medium">After</th>
                          <th className="pb-1 text-right font-medium">Δ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.salaryChanges.map((entry: PayrollSalaryChangeEntry) => (
                          <tr key={entry.employeeCode} className="border-t">
                            <td className="py-1">
                              <div>{entry.name}</div>
                              <div className="text-muted-foreground">{entry.department}</div>
                            </td>
                            <td className="py-1 text-right">
                              {formatMinor(entry.compareNetMinor, entry.currency)}
                            </td>
                            <td className="py-1 text-right">
                              {formatMinor(entry.baseNetMinor, entry.currency)}
                            </td>
                            <td className="py-1 text-right">
                              <DeltaCell
                                deltaMinor={entry.deltaMinor}
                                currency={entry.currency}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </Section>

                {/* New hires */}
                <Section title="New Hires" count={data.newHires.length}>
                  {data.newHires.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No new hires.</p>
                  ) : (
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-left text-muted-foreground">
                          <th className="pb-1 font-medium">Employee</th>
                          <th className="pb-1 text-right font-medium">Net</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.newHires.map((entry: PayrollDiffEntry) => (
                          <tr key={entry.employeeCode} className="border-t">
                            <td className="py-1">
                              <div>{entry.name}</div>
                              <div className="text-muted-foreground">{entry.department}</div>
                            </td>
                            <td className="py-1 text-right">
                              {formatMinor(entry.netMinor, entry.currency)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </Section>

                {/* Terminations */}
                <Section title="Terminations" count={data.terminations.length}>
                  {data.terminations.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No terminations.</p>
                  ) : (
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-left text-muted-foreground">
                          <th className="pb-1 font-medium">Employee</th>
                          <th className="pb-1 text-right font-medium">Net</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.terminations.map((entry: PayrollDiffEntry) => (
                          <tr key={entry.employeeCode} className="border-t">
                            <td className="py-1">
                              <div>{entry.name}</div>
                              <div className="text-muted-foreground">{entry.department}</div>
                            </td>
                            <td className="py-1 text-right">
                              {formatMinor(entry.netMinor, entry.currency)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </Section>
              </>
            )}

            {!isLoading && !isError && !data && (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No diff data available.
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
