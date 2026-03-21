import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const queueId = searchParams.get("queueId");
  const from = searchParams.get("from"); // ISO string or YYYY-MM-DD
  const to = searchParams.get("to");

  if (!queueId) {
    return NextResponse.json({ error: "queueId required" }, { status: 400 });
  }

  const queue = await prisma.queue.findUnique({
    where: { id: queueId, ownerId: session.user.id },
    select: { id: true, name: true, customFields: true },
  });
  if (!queue) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const fromDate = from ? new Date(from) : new Date(0);
  const toDate = to ? new Date(to) : new Date();

  const tickets = await prisma.ticket.findMany({
    where: {
      queueId,
      createdAt: { gte: fromDate, lte: toDate },
    },
    include: {
      stream: { select: { name: true } },
      staffSession: {
        include: { user: { select: { name: true, email: true } } },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  // Get custom field names for header row
  const customFieldDefs = (queue.customFields as Array<{ name: string; label: string }> | null) ?? [];
  const customHeaders = customFieldDefs.map((f) => f.label);

  const csvRows: string[] = [];

  // Header
  csvRows.push(
    [
      "Số vé",
      "Luồng",
      "Trạng thái",
      "Thời gian lấy số",
      "Thời gian hoàn thành",
      "Thời gian chờ (giây)",
      "Thời gian phục vụ (giây)",
      "Nhân viên",
      ...customHeaders,
    ]
      .map((h) => `"${h}"`)
      .join(",")
  );

  for (const t of tickets) {
    const customerInfo = (t.customerInfo as Record<string, unknown> | null) ?? {};
    const customValues = customFieldDefs.map((f) => String(customerInfo[f.name] ?? ""));

    const waitSeconds = t.calledAt
      ? Math.round((t.calledAt.getTime() - t.createdAt.getTime()) / 1000)
      : "";
    const serviceSeconds =
      t.servedAt && t.completedAt
        ? Math.round((t.completedAt.getTime() - t.servedAt.getTime()) / 1000)
        : "";
    const staffName = t.staffSession
      ? (t.staffSession.user.name ?? t.staffSession.user.email ?? "")
      : "";

    const row = [
      t.displayNumber,
      t.stream?.name ?? "",
      t.status,
      t.createdAt.toISOString(),
      t.completedAt?.toISOString() ?? "",
      String(waitSeconds),
      String(serviceSeconds),
      staffName,
      ...customValues,
    ].map((v) => `"${String(v).replace(/"/g, '""')}"`);

    csvRows.push(row.join(","));
  }

  const csv = csvRows.join("\r\n");
  const filename = `customers_${queue.name.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
