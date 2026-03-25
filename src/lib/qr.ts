import { SignJWT, jwtVerify } from "jose";
import QRCode from "qrcode";
import sharp from "sharp";
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

export async function generateQrPngWithLogo(
  url: string,
  logoUrl?: string | null,
  baseUrl?: string
): Promise<Buffer> {
  const qrBuffer = await QRCode.toBuffer(url, {
    type: "png",
    width: 400,
    margin: 2,
    errorCorrectionLevel: "H", // High error correction to survive logo overlay
    color: { dark: "#000000", light: "#ffffff" },
  });

  if (!logoUrl) return qrBuffer;

  try {
    // Resolve relative URLs to absolute for server-side fetch
    let absoluteLogoUrl = logoUrl;
    if (logoUrl && !logoUrl.startsWith("http")) {
      absoluteLogoUrl = `${baseUrl}${logoUrl}`;
    }

    console.log("[QR Logo] Fetching logo from:", absoluteLogoUrl);

    // Fetch the logo image with timeout
    const logoRes = await fetch(absoluteLogoUrl!, {
      signal: AbortSignal.timeout(10000),
    });
    if (!logoRes.ok) {
      console.warn("[QR Logo] Fetch failed:", logoRes.status, logoRes.statusText);
      return qrBuffer;
    }
    const logoArrayBuffer = await logoRes.arrayBuffer();
    const logoBuffer = Buffer.from(logoArrayBuffer);

    // QR is 400px; logo should be ~20% = 80px
    const logoSize = 80;
    const padding = 8;
    const bgSize = logoSize + padding * 2;

    // Resize logo to fit and make it a rounded square
    const resizedLogo = await sharp(logoBuffer)
      .resize(logoSize, logoSize, { fit: "cover" })
      .png()
      .toBuffer();

    // Create white background with padding for scannability
    const whiteBg = await sharp({
      create: {
        width: bgSize,
        height: bgSize,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 255 },
      },
    })
      .png()
      .toBuffer();

    // Composite: white bg with logo centered on it
    const logoWithBg = await sharp(whiteBg)
      .composite([
        {
          input: resizedLogo,
          left: padding,
          top: padding,
        },
      ])
      .png()
      .toBuffer();

    // Composite logo onto QR center
    const qrSize = 400;
    const left = Math.round((qrSize - bgSize) / 2);
    const top = Math.round((qrSize - bgSize) / 2);

    const result = await sharp(qrBuffer)
      .composite([
        {
          input: logoWithBg,
          left,
          top,
        },
      ])
      .png()
      .toBuffer();

    console.log("[QR Logo] Successfully composited logo onto QR");
    return result;
  } catch (err) {
    console.error("[QR Logo] Failed to overlay logo:", err);
    return qrBuffer; // Fallback to plain QR on any error
  }
}
