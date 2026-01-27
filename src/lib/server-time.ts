/**
 * Server Time Utility
 *
 * This module provides a secure way to get the current time from the server
 * instead of relying on the client's system clock, which can be manipulated.
 *
 * Key features:
 * - Fetches server time on app initialization
 * - Calculates offset between server and client time
 * - Provides functions that return "server time" based on the offset
 * - All times are in Jakarta timezone (UTC+7)
 */
import { format, formatDistanceToNow, parseISO } from 'date-fns'
import { TZDate } from '@date-fns/tz'
import { api } from '@/api/client'

// Jakarta timezone constant
export const JAKARTA_TZ = 'Asia/Jakarta'

// Server time offset (in milliseconds)
// Positive = server is ahead of client, Negative = server is behind client
let serverTimeOffset = 0
let isInitialized = false

interface ServerTimeResponse {
  utc: string
  jakarta: string
  timezone: string
  offset: string
  timestamp: number
}

/**
 * Initialize server time synchronization.
 * Call this once on app startup.
 */
export async function initServerTime(): Promise<void> {
  try {
    const clientTimeBefore = Date.now()
    const response = await api.get<ServerTimeResponse>('/time/time')
    const clientTimeAfter = Date.now()

    // Account for network latency by using the midpoint
    const clientTimeAtResponse = (clientTimeBefore + clientTimeAfter) / 2
    const serverTimestamp = response.data.timestamp

    // Calculate offset: how much to add to client time to get server time
    serverTimeOffset = serverTimestamp - clientTimeAtResponse
    isInitialized = true

    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.debug(
        `[ServerTime] Synced. Offset: ${serverTimeOffset}ms (${serverTimeOffset > 0 ? 'server ahead' : 'server behind'})`
      )
    }
  } catch {
    isInitialized = true // Still mark as initialized to prevent repeated failures
  }
}

/**
 * Get the current server timestamp in milliseconds.
 * This is the client's current time adjusted by the server offset.
 */
export function getServerTimestamp(): number {
  return Date.now() + serverTimeOffset
}

/**
 * Get the current server time as a Date object.
 */
export function getServerDate(): Date {
  return new Date(getServerTimestamp())
}

/**
 * Get the current server time in Jakarta timezone.
 */
export function getJakartaDate(): TZDate {
  return new TZDate(getServerTimestamp(), JAKARTA_TZ)
}

/**
 * Get today's date string in YYYY-MM-DD format (Jakarta timezone).
 */
export function getTodayJakarta(): string {
  return format(getJakartaDate(), 'yyyy-MM-dd')
}

/**
 * Convert a date string or Date to Jakarta timezone.
 */
export function toJakarta(date: string | Date): TZDate {
  if (typeof date === 'string') {
    return new TZDate(parseISO(date), JAKARTA_TZ)
  }
  return new TZDate(date.getTime(), JAKARTA_TZ)
}

/**
 * Format a date in Jakarta timezone.
 */
export function formatJakarta(date: string | Date, formatStr: string): string {
  const jakartaDate = toJakarta(date)
  return format(jakartaDate, formatStr)
}

/**
 * Get relative time string (e.g., "2 hours ago") using server time as reference.
 */
export function getRelativeTime(date: string | Date): string {
  const targetDate = typeof date === 'string' ? parseISO(date) : date
  return formatDistanceToNow(targetDate, {
    addSuffix: true,
    // Use server time as the base for comparison
    // @ts-expect-error - date-fns doesn't have this in types but it works
    baseDate: getServerDate(),
  })
}

/**
 * Check if the server time has been initialized.
 */
export function isServerTimeInitialized(): boolean {
  return isInitialized
}

/**
 * Get the current server time offset in milliseconds.
 * Useful for debugging.
 */
export function getServerTimeOffset(): number {
  return serverTimeOffset
}
