export const GSTIN_PATTERN = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
export const PINCODE_PATTERN = /^[1-9][0-9]{5}$/;
/** Indian mobile, 10 digits, optional +91 / 0 prefix (normalised away). */
export const INDIAN_MOBILE_PATTERN = /^(?:\+?91|0)?([6-9][0-9]{9})$/;

export type Address = Readonly<{
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  pincode: string;
  country: string;
}>;

export type Customer = Readonly<{
  name: string;
  email: string;
  /** Normalised 10-digit mobile number. */
  phone: string;
  shippingAddress: Address;
  billingAddress: Address;
  gstin: string | null;
}>;

/** Strips spaces/dashes and any +91/0 prefix; returns null if not a valid Indian mobile. */
export function normalizeIndianMobile(raw: string): string | null {
  const m = INDIAN_MOBILE_PATTERN.exec(raw.replace(/[\s-]/g, ""));
  return m ? m[1] : null;
}
