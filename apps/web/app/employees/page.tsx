"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { useEmployees } from "@salary-mgmt/store";
import type { EmployeeListQuery, EmploymentStatus } from "@salary-mgmt/types";
import { EMPLOYEE_PAGE_SIZE_DEFAULT } from "@salary-mgmt/types";
import { EmployeeList } from "./components/employee-list";
import { EmployeeSearch } from "./components/employee-search";
import { EmployeeFilters } from "./components/employee-filters";
import { EmployeePagination } from "./components/employee-pagination";

function parseQuery(params: URLSearchParams): EmployeeListQuery {
  return {
    q: params.get("q") ?? undefined,
    department: params.getAll("department").length ? params.getAll("department") : undefined,
    country: params.getAll("country").length ? params.getAll("country") : undefined,
    status: params.getAll("status").length
      ? (params.getAll("status") as EmploymentStatus[])
      : undefined,
    page: params.has("page") ? Number(params.get("page")) : 1,
    pageSize: params.has("pageSize")
      ? Number(params.get("pageSize"))
      : EMPLOYEE_PAGE_SIZE_DEFAULT,
    sort: (params.get("sort") as EmployeeListQuery["sort"]) ?? undefined,
  };
}

export default function EmployeesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = parseQuery(searchParams);

  const { data, isLoading, isError } = useEmployees(query);

  const setParams = useCallback(
    (updates: Partial<Record<string, string | string[] | undefined>>) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        next.delete(key);
        if (Array.isArray(value)) {
          value.forEach((v) => next.append(key, v));
        } else if (value !== undefined) {
          next.set(key, value);
        }
      }
      router.replace(`/employees?${next.toString()}`);
    },
    [searchParams, router]
  );

  return (
    <div className="mx-auto max-w-7xl space-y-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Employees</h1>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex-1">
          <EmployeeSearch
            value={query.q ?? ""}
            onSearch={(q) => setParams({ q: q || undefined, page: "1" })}
          />
        </div>
        <EmployeeFilters
          department={[...(query.department ?? [])]}
          country={[...(query.country ?? [])]}
          status={[...(query.status ?? [])]}
          onFilterChange={(filters) => {
            const updates: Record<string, string[] | undefined> = {};
            if (filters.department !== undefined)
              updates.department = filters.department.length ? filters.department : undefined;
            if (filters.country !== undefined)
              updates.country = filters.country.length ? filters.country : undefined;
            if (filters.status !== undefined)
              updates.status = filters.status.length ? filters.status : undefined;
            setParams({ ...updates, page: "1" });
          }}
        />
      </div>

      <EmployeeList
        data={data}
        isLoading={isLoading}
        isError={isError}
        onRowClick={(id) => router.push(`/employees/${id}`)}
      />

      {data && data.total > 0 && (
        <EmployeePagination
          page={query.page ?? 1}
          pageSize={query.pageSize ?? EMPLOYEE_PAGE_SIZE_DEFAULT}
          total={data.total}
          onPageChange={(page) => setParams({ page: String(page) })}
        />
      )}
    </div>
  );
}
