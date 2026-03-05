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

export function getTodayString(): string {
  return new Date().toISOString().split('T')[0]
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

  const now = new Date()
  const dayName = getDayName(now)
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

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
