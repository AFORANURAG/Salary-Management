import { describe, expect, it } from "vitest";
import {
  buildCostResponse,
  buildSummaryResponse,
} from "./reporting.service";
import type { GroupByDimension } from "@salary-mgmt/types";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

interface RawCostRow {
  key: string;
  currency: string;
  headcount: string;
  grossMinor: string;
  deductionsMinor: string;
  netMinor: string;
}

interface RawSummaryRow {
  currency: string;
  headcount: string;
  grossMinor: string;
  deductionsMinor: string;
  netMinor: string;
}

const period = "2026-06";

// ---------------------------------------------------------------------------
// buildCostResponse
// ---------------------------------------------------------------------------

describe("buildCostResponse", () => {
  it("groups rows by department into per-currency buckets", () => {
    const rows: RawCostRow[] = [
      {
        key: "Engineering",
        currency: "USD",
        headcount: "2",
        grossMinor: "1200000",
        deductionsMinor: "120000",
        netMinor: "1080000",
      },
      {
        key: "Sales",
        currency: "USD",
        headcount: "1",
        grossMinor: "600000",
        deductionsMinor: "60000",
        netMinor: "540000",
      },
    ];

    const response = buildCostResponse(period, "department", rows);

    expect(response.period).toBe(period);
    expect(response.groupBy).toBe("department");
    expect(response.buckets).toHaveLength(1);
    const bucket = response.buckets[0];
    expect(bucket.currency).toBe("USD");
    expect(bucket.groups).toHaveLength(2);
    const eng = bucket.groups.find((g) => g.key === "Engineering");
    expect(eng?.headcount).toBe(2);
    expect(eng?.grossMinor).toBe(1_200_000);
    expect(eng?.netMinor).toBe(1_080_000);
  });

  it("groups rows by country into per-currency buckets", () => {
    const rows: RawCostRow[] = [
      {
        key: "US",
        currency: "USD",
        headcount: "3",
        grossMinor: "1800000",
        deductionsMinor: "180000",
        netMinor: "1620000",
      },
      {
        key: "IN",
        currency: "INR",
        headcount: "2",
        grossMinor: "5000000",
        deductionsMinor: "500000",
        netMinor: "4500000",
      },
    ];

    const response = buildCostResponse(period, "country", rows);

    expect(response.buckets).toHaveLength(2);
    const usd = response.buckets.find((b) => b.currency === "USD");
    const inr = response.buckets.find((b) => b.currency === "INR");
    expect(usd?.groups[0].key).toBe("US");
    expect(inr?.groups[0].key).toBe("IN");
  });

  it("groups rows by costCenter, excluding null-key rows", () => {
    // Null costCenter rows must be excluded at the query layer;
    // buildCostResponse treats whatever rows it receives as valid.
    const rows: RawCostRow[] = [
      {
        key: "CC-100",
        currency: "USD",
        headcount: "1",
        grossMinor: "600000",
        deductionsMinor: "60000",
        netMinor: "540000",
      },
    ];

    const response = buildCostResponse(period, "costCenter", rows);

    expect(response.groupBy).toBe("costCenter");
    expect(response.buckets).toHaveLength(1);
    expect(response.buckets[0].groups[0].key).toBe("CC-100");
  });

  it("returns empty buckets when no rows exist for the period", () => {
    const response = buildCostResponse(period, "department", []);

    expect(response.buckets).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// buildSummaryResponse
// ---------------------------------------------------------------------------

describe("buildSummaryResponse", () => {
  it("returns correct org-wide totals per currency", () => {
    const rows: RawSummaryRow[] = [
      {
        currency: "USD",
        headcount: "5",
        grossMinor: "3000000",
        deductionsMinor: "300000",
        netMinor: "2700000",
      },
    ];

    const response = buildSummaryResponse(period, rows);

    expect(response.period).toBe(period);
    expect(response.buckets).toHaveLength(1);
    const bucket = response.buckets[0];
    expect(bucket.currency).toBe("USD");
    expect(bucket.headcount).toBe(5);
    expect(bucket.grossMinor).toBe(3_000_000);
    expect(bucket.deductionsMinor).toBe(300_000);
    expect(bucket.netMinor).toBe(2_700_000);
  });

  it("produces separate buckets for each currency — never sums across currencies", () => {
    const rows: RawSummaryRow[] = [
      {
        currency: "USD",
        headcount: "3",
        grossMinor: "1800000",
        deductionsMinor: "180000",
        netMinor: "1620000",
      },
      {
        currency: "INR",
        headcount: "2",
        grossMinor: "5000000",
        deductionsMinor: "500000",
        netMinor: "4500000",
      },
    ];

    const response = buildSummaryResponse(period, rows);

    expect(response.buckets).toHaveLength(2);
    const usd = response.buckets.find((b) => b.currency === "USD");
    const inr = response.buckets.find((b) => b.currency === "INR");
    expect(usd?.netMinor).toBe(1_620_000);
    expect(inr?.netMinor).toBe(4_500_000);
    // Totals must NOT be blended
    expect(usd?.grossMinor).not.toBe(
      Number("1800000") + Number("5000000"),
    );
  });
});
