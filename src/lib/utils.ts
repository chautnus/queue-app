export function generateVerificationCode(): string {
  return String(Math.floor(Math.random() * 9000) + 1000) // 1000–9999
}

export function formatTime(time: string): string {
  const [h, m] = time.split(':')
  const hour = parseInt(h)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour % 12 || 12
  return `${displayHour}:${m} ${ampm}`
}

/** Trả về thời gian hiện tại theo múi giờ Việt Nam (UTC+7) */
export function getVietnamTime(): Date {
  const now = new Date()
  return new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }))
}

/** Trả về chuỗi ngày theo múi giờ Việt Nam, VD: "2026-03-05" */
export function getTodayString(): string {
  const vn = getVietnamTime()
  const y = vn.getFullYear()
  const m = String(vn.getMonth() + 1).padStart(2, '0')
  const d = String(vn.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function getDayName(date: Date): string {
  return ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][date.getDay()]
}

export function calculateEstimatedWait(
  peopleAhead: number,
  avgProcessingTime: number,
  numberOfCounters: number
): number {
  if (numberOfCounters <= 0) return 0
  return Math.ceil((peopleAhead / numberOfCounters) * avgProcessingTime)
}

export function isQueueOpen(queue: {
  startTime: string
  endTime: string
  workingHours?: string | null
  isActive: boolean
}): boolean {
  if (!queue.isActive) return false

  // Dùng giờ Việt Nam (UTC+7) để so sánh
  const vn = getVietnamTime()
  const dayName = getDayName(vn)
  const currentTime = `${String(vn.getHours()).padStart(2, '0')}:${String(vn.getMinutes()).padStart(2, '0')}`

  if (queue.workingHours) {
    try {
      const wh = JSON.parse(queue.workingHours)
      const todaySchedule = wh[dayName]
      if (!todaySchedule || !todaySchedule.enabled) return false
      return currentTime >= todaySchedule.open && currentTime <= todaySchedule.close
    } catch {
      // fall through to default check
    }
  }

  return currentTime >= queue.startTime && currentTime <= queue.endTime
}
