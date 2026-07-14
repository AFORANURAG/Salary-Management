/** All monetary values are integer minor units (e.g. cents, paise). Never use floats. */

export function assertMinorUnits(value: number): number {
  if (!Number.isInteger(value)) {
    throw new Error(`Money must be integer minor units, got: ${value}`);
  }
  return value;
}

export function addMinor(a: number, b: number): number {
  return assertMinorUnits(a) + assertMinorUnits(b);
}

export function subtractMinor(a: number, b: number): number {
  return assertMinorUnits(a) - assertMinorUnits(b);
}

export function sumMinor(values: readonly number[]): number {
  return values.reduce((acc, v) => addMinor(acc, v), 0);
}

export function formatMinor(amountMinor: number, currency: string): string {
  const safe = assertMinorUnits(amountMinor);
  const major = safe / 100;
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
    }).format(major);
  } catch {
    return `${major.toLocaleString()} ${currency}`;
  }
}
