/**
 * Money value object. Amounts are integer minor units (paise) to avoid
 * floating-point drift in pricing, discounts, tax and invoice totals.
 *
 * Modelled as plain frozen data + pure functions (not a class) so it survives
 * React serialization: 'use cache' results, Server Action returns, client props.
 */
export type Currency = "INR";

export type Money = Readonly<{ minor: number; currency: Currency }>;

function make(minor: number, currency: Currency): Money {
  if (!Number.isSafeInteger(minor)) {
    throw new RangeError(`Money must be an integer number of minor units, got ${minor}`);
  }
  return Object.freeze({ minor, currency });
}

function assertSameCurrency(a: Money, b: Money): void {
  if (a.currency !== b.currency) {
    throw new Error(`Currency mismatch: ${a.currency} vs ${b.currency}`);
  }
}

export const Money = {
  ofMinor: (minor: number, currency: Currency = "INR"): Money => make(minor, currency),

  /** From a major-unit decimal such as Zoho's `rate` (1299.5 → 129950 paise). */
  ofMajor: (major: number, currency: Currency = "INR"): Money =>
    make(Math.round(major * 100), currency),

  zero: (currency: Currency = "INR"): Money => make(0, currency),

  toMajor: (m: Money): number => m.minor / 100,

  add(a: Money, b: Money): Money {
    assertSameCurrency(a, b);
    return make(a.minor + b.minor, a.currency);
  },

  subtract(a: Money, b: Money): Money {
    assertSameCurrency(a, b);
    return make(a.minor - b.minor, a.currency);
  },

  multiply: (m: Money, factor: number): Money => make(Math.round(m.minor * factor), m.currency),

  /** Never negative — used when applying discounts. */
  clampToZero: (m: Money): Money => (m.minor < 0 ? make(0, m.currency) : m),

  min(a: Money, b: Money): Money {
    assertSameCurrency(a, b);
    return a.minor <= b.minor ? a : b;
  },

  sum(items: readonly Money[], currency: Currency = "INR"): Money {
    return items.reduce((acc, m) => Money.add(acc, m), make(0, currency));
  },

  equals: (a: Money, b: Money): boolean => a.currency === b.currency && a.minor === b.minor,

  isLessThan(a: Money, b: Money): boolean {
    assertSameCurrency(a, b);
    return a.minor < b.minor;
  },

  isZero: (m: Money): boolean => m.minor === 0,
} as const;
