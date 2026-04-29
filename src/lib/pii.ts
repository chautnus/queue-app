/**
 * PII masking utilities for logs.
 * Masks phone numbers and emails before they reach log output.
 */

/** Mask email: john.doe@example.com → j***@e***.com */
export function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return "***";
  const [domainName, ...tld] = domain.split(".");
  return `${local[0]}***@${domainName[0]}***.${tld.join(".")}`;
}

/** Mask phone: +84912345678 → +849****5678 */
export function maskPhone(phone: string): string {
  if (phone.length < 6) return "***";
  return phone.slice(0, 4) + "****" + phone.slice(-4);
}

/** Recursively mask PII fields in an object before logging */
export function maskPii(data: Record<string, unknown>): Record<string, unknown> {
  const PII_FIELDS = new Set(["phone", "phoneNumber", "tel", "email", "address"]);
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    if (!PII_FIELDS.has(key)) {
      result[key] = value;
      continue;
    }
    if (typeof value !== "string") {
      result[key] = "***";
      continue;
    }
    if (key === "email") result[key] = maskEmail(value);
    else if (key === "phone" || key === "phoneNumber" || key === "tel")
      result[key] = maskPhone(value);
    else result[key] = "***";
  }

  return result;
}
