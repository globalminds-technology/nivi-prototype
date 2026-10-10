import { describe, expect, it } from "vitest";
import { Money } from "./money";

describe("Money", () => {
  it("converts major units to integer paise without float drift", () => {
    expect(Money.add(Money.ofMajor(0.1), Money.ofMajor(0.2)).minor).toBe(30);
    expect(Money.ofMajor(1299.99).minor).toBe(129999);
    expect(Money.toMajor(Money.ofMinor(129950))).toBe(1299.5);
  });

  it("clamps negative results to zero", () => {
    expect(Money.clampToZero(Money.subtract(Money.ofMajor(100), Money.ofMajor(150))).minor).toBe(0);
  });

  it("rounds multiplication to whole paise", () => {
    expect(Money.multiply(Money.ofMinor(999), 0.9).minor).toBe(899);
  });

  it("sums, compares and picks the minimum", () => {
    const a = Money.ofMajor(10);
    const b = Money.ofMajor(25);
    expect(Money.sum([a, b]).minor).toBe(3500);
    expect(Money.sum([]).minor).toBe(0);
    expect(Money.min(a, b)).toBe(a);
    expect(Money.isLessThan(a, b)).toBe(true);
    expect(Money.equals(a, Money.ofMinor(1000))).toBe(true);
    expect(Money.isZero(Money.zero())).toBe(true);
  });

  it("is plain serializable data", () => {
    expect(JSON.parse(JSON.stringify(Money.ofMajor(5)))).toEqual({ minor: 500, currency: "INR" });
  });

  it("rejects non-integer minor units", () => {
    expect(() => Money.ofMinor(1.5)).toThrow(RangeError);
  });
});
