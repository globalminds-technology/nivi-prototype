import { ValidationError } from "../errors/domain-errors";

/** A calendar day `YYYY-MM-DD`, interpreted in the store's time zone. */
export type CalendarDate = string & { readonly __brand: "CalendarDate" };

/** Offers, invoices and payment dates are all evaluated in Indian time. */
export const STORE_TIME_ZONE = "Asia/Kolkata";

const ISO_DATE_PATTERN = /^(\d{4})[-/](\d{2})[-/](\d{2})$/;
const DMY_DATE_PATTERN = /^(\d{2})[-/](\d{2})[-/](\d{4})$/;

export function toCalendarDate(raw: string): CalendarDate {
  const trimmed = raw.trim();
  const isoMatch = ISO_DATE_PATTERN.exec(trimmed);
  if (isoMatch) {
    const [y, mo, d] = [Number(isoMatch[1]), Number(isoMatch[2]), Number(isoMatch[3])];
    const probe = new Date(Date.UTC(y, mo - 1, d));
    if (probe.getUTCFullYear() === y && probe.getUTCMonth() === mo - 1 && probe.getUTCDate() === d) {
      return `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}` as CalendarDate;
    }
  }

  const dmyMatch = DMY_DATE_PATTERN.exec(trimmed);
  if (dmyMatch) {
    const [d, mo, y] = [Number(dmyMatch[1]), Number(dmyMatch[2]), Number(dmyMatch[3])];
    const probe = new Date(Date.UTC(y, mo - 1, d));
    if (probe.getUTCFullYear() === y && probe.getUTCMonth() === mo - 1 && probe.getUTCDate() === d) {
      return `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}` as CalendarDate;
    }
  }

  throw new ValidationError("Date must be a valid YYYY-MM-DD or DD/MM/YYYY", { date: raw });
}

const formatters = new Map<string, Intl.DateTimeFormat>();

/** The calendar day an instant falls on in `timeZone` (default: store time). */
export function calendarDateOf(instant: Date, timeZone: string = STORE_TIME_ZONE): CalendarDate {
  let fmt = formatters.get(timeZone);
  if (!fmt) {
    // en-CA formats as YYYY-MM-DD
    fmt = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" });
    formatters.set(timeZone, fmt);
  }
  return fmt.format(instant) as CalendarDate;
}

/** ISO dates compare correctly as strings. */
export const isBefore = (a: CalendarDate, b: CalendarDate): boolean => a < b;
