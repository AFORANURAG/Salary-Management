"use client";

import { useParams, useRouter } from "next/navigation";
import { Button } from "@salary-mgmt/ui";
import { PayslipCard } from "./components/payslip-card";

export default function PayslipDetailPage() {
  const { id, period } = useParams<{ id: string; period: string }>();
  const router = useRouter();

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Payslip — {period}</h1>
        <Button variant="outline" onClick={() => router.back()}>
          Back
        </Button>
      </div>
      <PayslipCard employeeId={id} period={period} />
    </div>
  );
}
