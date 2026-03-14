import { NextResponse } from "next/server";

export async function GET() {
  const a = Math.floor(Math.random() * 10) + 1;
  const b = Math.floor(Math.random() * 10) + 1;
  const ops = ["+", "-"] as const;
  const op = ops[Math.floor(Math.random() * ops.length)];

  // Token expires in 5 minutes
  const token = Buffer.from(
    JSON.stringify({ a, b, op, exp: Date.now() + 5 * 60 * 1000 })
  ).toString("base64url");

  const question = `${a} ${op} ${b} = ?`;

  return NextResponse.json({ question, token });
}
