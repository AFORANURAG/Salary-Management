"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState, Suspense } from "react";
import { useEmployees, useSession } from "@salary-mgmt/store";
import type { Department, Employee, EmployeeListQuery, EmploymentStatus } from "@salary-mgmt/types";
import { EMPLOYEE_PAGE_SIZE_DEFAULT } from "@salary-mgmt/types";
import { Button } from "@salary-mgmt/ui";
import { BulkActionToolbar } from "./components/bulk-action-toolbar";
import { EmployeeList } from "./components/employee-list";
import { EmployeeSearch } from "./components/employee-search";
import { EmployeeFilters } from "./components/employee-filters";
import { EmployeePagination } from "./components/employee-pagination";
import { CreateEmployeeDialog } from "./components/create-employee-dialog";
import { EditEmployeeDialog } from "./components/edit-employee-dialog";
import { DeleteEmployeeDialog } from "./components/delete-employee-dialog";

function parseQuery(params: URLSearchParams): EmployeeListQuery {
  return {
    q: params.get("q") ?? undefined,
    department: params.getAll("department").length ? (params.getAll("department") as Department[]) : undefined,
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

type DialogState =
  | { type: "none" }
  | { type: "create" }
  | { type: "edit"; employee: Employee }
  | { type: "delete"; employee: Employee };

function EmployeesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = parseQuery(searchParams);
  const [dialog, setDialog] = useState<DialogState>({ type: "none" });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const { data, isLoading, isError } = useEmployees(query);
  const { user } = useSession();
  const canBulkEdit = user?.role === "ADMIN" || user?.role === "HR_MANAGER";

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
      setSelectedIds([]);
      router.replace(`/employees?${next.toString()}`);
    },
    [searchParams, router]
  );

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Employees</h1>
        <div className="flex gap-2">
          {canBulkEdit && (
            <Button variant="outline" asChild>
              <Link href="/employees/bulk">Import CSV</Link>
            </Button>
          )}
          <Button onClick={() => setDialog({ type: "create" })}>Add Employee</Button>
        </div>
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
        onEdit={(employee) => setDialog({ type: "edit", employee })}
        onDelete={(employee) => setDialog({ type: "delete", employee })}
        selectedIds={canBulkEdit ? selectedIds : undefined}
        onSelectionChange={canBulkEdit ? setSelectedIds : undefined}
      />

      {canBulkEdit && (
        <BulkActionToolbar
          selectedIds={selectedIds}
          onDeselect={() => setSelectedIds([])}
        />
      )}

      {data && data.total > 0 && (
        <EmployeePagination
          page={query.page ?? 1}
          pageSize={query.pageSize ?? EMPLOYEE_PAGE_SIZE_DEFAULT}
          total={data.total}
          onPageChange={(page) => setParams({ page: String(page) })}
        />
      )}

      <CreateEmployeeDialog
        open={dialog.type === "create"}
        onOpenChange={(open) => !open && setDialog({ type: "none" })}
      />

      {dialog.type === "edit" && (
        <EditEmployeeDialog
          open
          onOpenChange={(open) => !open && setDialog({ type: "none" })}
          employee={dialog.employee}
        />
      )}

      {dialog.type === "delete" && (
        <DeleteEmployeeDialog
          open
          onOpenChange={(open) => !open && setDialog({ type: "none" })}
          employeeId={dialog.employee.id}
          employeeName={dialog.employee.name}
        />
      )}
    </div>
  );
}

export default function EmployeesPage() {
  return (
    <Suspense>
      <EmployeesPageContent />
    </Suspense>
  );
}
