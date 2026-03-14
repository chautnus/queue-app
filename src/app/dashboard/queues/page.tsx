import { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Queues" };

export default async function QueuesPage() {
  const session = await auth();
  const queues = await prisma.queue.findMany({
    where: { ownerId: session!.user.id },
    include: {
      streams: {
        include: { _count: { select: { counters: true } } },
      },
      _count: { select: { tickets: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Queues</h1>
        <Link
          href="/dashboard/queues/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Queue
        </Link>
      </div>

      {queues.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No queues yet</h3>
          <p className="text-gray-500 mb-6">Create your first queue to get started</p>
          <Link
            href="/dashboard/queues/new"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors"
          >
            Create Queue
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {queues.map((queue) => (
            <div
              key={queue.id}
              className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  {queue.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={queue.logoUrl}
                      alt={queue.name}
                      className="w-10 h-10 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <span className="text-blue-700 font-bold text-sm">
                        {queue.name[0].toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-gray-900">{queue.name}</h3>
                    <p className="text-xs text-gray-500">{queue.streams.length} streams</p>
                  </div>
                </div>
                <span
                  className={`text-xs font-medium px-2 py-1 rounded-full ${
                    queue.status === "ACTIVE"
                      ? "bg-green-100 text-green-700"
                      : queue.status === "PAUSED"
                      ? "bg-yellow-100 text-yellow-700"
                      : queue.status === "CLOSED"
                      ? "bg-gray-100 text-gray-600"
                      : "bg-blue-50 text-blue-600"
                  }`}
                >
                  {queue.status}
                </span>
              </div>

              <div className="text-sm text-gray-500 mb-4">
                {queue._count.tickets} total tickets
              </div>

              <div className="flex gap-2">
                <Link
                  href={`/dashboard/queues/${queue.id}`}
                  className="flex-1 text-center py-2 text-sm font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  Monitor
                </Link>
                <Link
                  href={`/dashboard/queues/${queue.id}/edit`}
                  className="flex-1 text-center py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Edit
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
