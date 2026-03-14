import { formatInTimeZone, toZonedTime } from "date-fns-tz";
import { startOfDay, endOfDay } from "date-fns";

export function getTodayInTz(timezone: string): string {
  return formatInTimeZone(new Date(), timezone, "yyyy-MM-dd");
}

export function getStartOfDayInTz(timezone: string): Date {
  const zonedNow = toZonedTime(new Date(), timezone);
  return startOfDay(zonedNow);
}

export function getEndOfDayInTz(timezone: string): Date {
  const zonedNow = toZonedTime(new Date(), timezone);
  return endOfDay(zonedNow);
}

export function formatDateTime(date: Date, timezone: string): string {
  return formatInTimeZone(date, timezone, "HH:mm dd/MM/yyyy");
}

export function formatTime(date: Date, timezone: string): string {
  return formatInTimeZone(date, timezone, "HH:mm");
}
