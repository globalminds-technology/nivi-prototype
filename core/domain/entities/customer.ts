export const GSTIN_PATTERN = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
export const PINCODE_PATTERN = /^[1-9][0-9]{5}$/;
/** Indian mobile, 10 digits, optional +91 / 0 prefix (normalised away). */
export const INDIAN_MOBILE_PATTERN = /^(?:\+?91|0)?([6-9][0-9]{9})$/;
/** International phone pattern (E.164: 7 to 15 digits with optional + prefix). */
export const PHONE_PATTERN = /^(?:\+?[1-9]\d{6,14}|(?:\+?91|0)?[6-9]\d{9})$/;

export const INDIAN_STATES = [
  "Andaman and Nicobar Islands",
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chandigarh",
  "Chhattisgarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jammu & Kashmir",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Ladakh",
  "Lakshadweep",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Puducherry",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
] as const;

export function matchIndianState(rawState: string): string | null {
  if (!rawState) return null;
  const normalized = rawState.trim().toLowerCase().replace(/[^a-z]/g, "");
  return (
    INDIAN_STATES.find(
      (s) => s.toLowerCase().replace(/[^a-z]/g, "") === normalized
    ) || null
  );
}

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
  /** Normalised 10-digit mobile number or international phone with country code. */
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

/** Normalizes a phone number: if Indian mobile, strips to 10 digits; otherwise cleans international format. */
export function normalizePhone(raw: string): string | null {
  const clean = raw.replace(/[\s-]/g, "");
  const indianMatch = INDIAN_MOBILE_PATTERN.exec(clean);
  if (indianMatch) {
    return indianMatch[1];
  }
  if (/^\+?[1-9]\d{6,14}$/.test(clean)) {
    return clean.startsWith("+") ? clean : `+${clean}`;
  }
  return null;
}
