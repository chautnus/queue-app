import { NextResponse } from "next/server";
import crypto from "crypto";

// HMAC secret — falls back to AUTH_SECRET if CAPTCHA_SECRET not set.
// If no env var is available, generate a random secret per process (restarts invalidate tokens).
const SECRET =
  process.env.CAPTCHA_SECRET ??
  process.env.AUTH_SECRET ??
  process.env.NEXTAUTH_SECRET ??
  crypto.randomBytes(32).toString("hex");

function signToken(payload: object): string {
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const hmac = crypto.createHmac("sha256", SECRET).update(data).digest("base64url");
  return `${data}.${hmac}`;
}

export function verifyToken(token: string): { a: number; b: number; op: string; exp: number } | null {
  try {
    const [data, hmac] = token.split(".");
    if (!data || !hmac) return null;

    const expectedHmac = crypto.createHmac("sha256", SECRET).update(data).digest("base64url");
    if (hmac !== expectedHmac) return null;

    const payload = JSON.parse(Buffer.from(data, "base64url").toString("utf-8"));
    if (payload.exp < Date.now()) return null;

    return payload;
  } catch {
    return null;
  }
}

export async function GET() {
  const a = Math.floor(Math.random() * 10) + 1;
  const b = Math.floor(Math.random() * 10) + 1;
  const ops = ["+", "-"] as const;
  const op = ops[Math.floor(Math.random() * ops.length)];

  // Token expires in 5 minutes, signed with HMAC
  const token = signToken({ a, b, op, exp: Date.now() + 5 * 60 * 1000 });

  const question = `${a} ${op} ${b} = ?`;

  return NextResponse.json({ question, token });
}
