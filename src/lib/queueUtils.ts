import { prisma } from './prisma'
import { getTodayString, calculateEstimatedWait } from './utils'

/**
 * Tính lại estimatedServedAt cho các khách đang chờ.
 * Gọi sau mỗi lần nhân viên hoàn thành phục vụ hoặc auto-timeout.
 */
export async function recalculateWaitTimes(queueId: string): Promise<void> {
  const queue = await prisma.queue.findUnique({ where: { id: queueId } })
  if (!queue) return

  const today = getTodayString()

  // Đếm số nhân viên đang hoạt động (idle hoặc serving) hôm nay
  const activeCount = await prisma.staffSession.count({
    where: { queueId, date: today, status: { in: ['idle', 'serving'] } },
  })
  const effectiveCounters = Math.max(1, activeCount)

  // Lấy danh sách khách đang chờ theo thứ tự số vé
  const waiting = await prisma.queueEntry.findMany({
    where: { queueId, date: today, status: 'waiting' },
    orderBy: { ticketNumber: 'asc' },
    take: queue.waitCheckDepth,
  })

  const now = new Date()

  for (let i = 0; i < waiting.length; i++) {
    const entry = waiting[i]
    // Thời gian chờ mới (phút) = vị trí / số cửa * thời gian TB
    const newWaitMins = calculateEstimatedWait(i, queue.avgProcessingTime, effectiveCounters)
    const newServedAt = new Date(now.getTime() + newWaitMins * 60 * 1000)

    if (entry.estimatedServedAt) {
      // Tính độ chênh so với dự kiến hiện tại
      const currentRemainingMs = entry.estimatedServedAt.getTime() - now.getTime()
      const newRemainingMs = newServedAt.getTime() - now.getTime()
      const diffMins = Math.abs(currentRemainingMs - newRemainingMs) / 60000

      // Chỉ cập nhật nếu chênh lệch vượt ngưỡng
      if (diffMins >= queue.waitThreshold) {
        await prisma.queueEntry.update({
          where: { id: entry.id },
          data: { estimatedServedAt: newServedAt },
        })
      }
    } else {
      // Chưa có ước tính → đặt ngay
      await prisma.queueEntry.update({
        where: { id: entry.id },
        data: { estimatedServedAt: newServedAt },
      })
    }
  }
}
