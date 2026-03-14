import { SignJWT, jwtVerify } from "jose";
import QRCode from "qrcode";
import { getTodayInTz, getEndOfDayInTz } from "@/lib/date-utils";

const HUNDRED_YEARS = 60 * 60 * 24 * 365 * 100;

function getSecret(qrSecret: string): Uint8Array {
  return new TextEncoder().encode(qrSecret);
}

export async function signCustomerQrToken(
  queueId: string,
  qrSecret: string,
  rotationType: "FIXED" | "DAILY",
  timezone: string
): Promise<string> {
  const payload = {
    queueId,
    type: "customer",
    ...(rotationType === "DAILY" ? { date: getTodayInTz(timezone) } : {}),
  };

  const builder = new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt();

  if (rotationType === "DAILY") {
    const expiry = getEndOfDayInTz(timezone);
    builder.setExpirationTime(expiry);
  } else {
    builder.setExpirationTime(`${HUNDRED_YEARS}s`);
  }

  return builder.sign(getSecret(qrSecret));
}

export async function signStaffQrToken(
  queueId: string,
  qrSecret: string
): Promise<string> {
  return new SignJWT({ queueId, type: "staff" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${HUNDRED_YEARS}s`)
    .sign(getSecret(qrSecret));
}

export async function verifyQrToken(
  token: string,
  qrSecret: string
): Promise<{ queueId: string; type: "customer" | "staff"; date?: string }> {
  const { payload } = await jwtVerify(token, getSecret(qrSecret));
  return payload as {
    queueId: string;
    type: "customer" | "staff";
    date?: string;
  };
}

export async function generateQrPng(url: string): Promise<Buffer> {
  return QRCode.toBuffer(url, {
    type: "png",
    width: 400,
    margin: 2,
    color: { dark: "#000000", light: "#ffffff" },
  });
}
