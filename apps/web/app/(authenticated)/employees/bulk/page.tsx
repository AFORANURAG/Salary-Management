"use client";

import Link from "next/link";
import { Button } from "@salary-mgmt/ui";

export default function BulkOperationsPage() {
  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Bulk Operations</h1>
        <Button variant="outline" asChild>
          <Link href="/employees">Back</Link>
        </Button>
      </div>
      <p className="mt-8 text-muted-foreground text-sm">
        Bulk import and update functionality is not yet available.
      </p>
    </div>
  );
}
