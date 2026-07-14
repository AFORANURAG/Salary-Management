"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@salary-mgmt/ui";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@salary-mgmt/ui";
import { toast } from "@salary-mgmt/ui/sonner";
import { useBulkStatusChange } from "@salary-mgmt/store";
import type { BulkStatusResponse, EmploymentStatus } from "@salary-mgmt/types";

interface BulkActionToolbarProps {
  selectedIds: string[];
  onDeselect: () => void;
}

const STATUS_OPTIONS: { label: string; value: EmploymentStatus }[] = [
  { label: "Set Active", value: "ACTIVE" },
  { label: "Set Inactive", value: "INACTIVE" },
  { label: "Terminate", value: "TERMINATED" },
];

export function BulkActionToolbar({ selectedIds, onDeselect }: BulkActionToolbarProps) {
  const { mutate, isPending } = useBulkStatusChange();
  const [pendingStatus, setPendingStatus] = useState<EmploymentStatus | null>(null);

  if (selectedIds.length === 0) return null;

  function handleConfirm() {
    if (!pendingStatus) return;
    mutate(
      { ids: selectedIds, status: pendingStatus },
      {
        onSuccess: (data: BulkStatusResponse) => {
          toast.success(`${data.updated} employee${data.updated !== 1 ? "s" : ""} updated.`);
          setPendingStatus(null);
          onDeselect();
        },
      },
    );
  }

  return (
    <div
      data-testid="bulk-action-toolbar"
      className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-lg border border-border bg-background px-4 py-3 shadow-lg"
    >
      <span className="text-sm font-medium">
        {selectedIds.length} selected
      </span>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            {pendingStatus
              ? STATUS_OPTIONS.find((o) => o.value === pendingStatus)?.label
              : "Change status"}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {STATUS_OPTIONS.map((opt) => (
            <DropdownMenuItem
              key={opt.value}
              onClick={() => setPendingStatus(opt.value)}
            >
              {opt.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Button
        size="sm"
        disabled={!pendingStatus || isPending}
        onClick={handleConfirm}
      >
        {isPending ? "Updating…" : "Confirm"}
      </Button>

      <Button
        variant="ghost"
        size="icon"
        aria-label="Deselect all"
        onClick={() => {
          setPendingStatus(null);
          onDeselect();
        }}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
