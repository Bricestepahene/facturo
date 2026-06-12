// src/utils/dateUtils.ts
import { format, parseISO, addDays as fnsAddDays, isPast, differenceInDays } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';

/**
 * Format a date string for display using dd/MM/yyyy.
 *
 * @param dateStr  ISO date string (yyyy-MM-dd)
 * @param locale   BCP 47 locale tag ('fr' or 'en', defaults to 'fr')
 */
export function formatDate(dateStr: string, locale: string = 'fr'): string {
  try {
    return format(parseISO(dateStr), 'dd/MM/yyyy', { locale: locale === 'fr' ? fr : enUS });
  } catch {
    return dateStr;
  }
}

/**
 * Format a date string in a compact short format with month name.
 *
 * Output example: "11 Jun 2026"
 *
 * @param dateStr  ISO date string (yyyy-MM-dd)
 */
export function formatDateShort(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'dd MMM yyyy');
  } catch {
    return dateStr;
  }
}

/**
 * Return today's date as a yyyy-MM-dd string (no time component).
 *
 * Example: "2026-06-11"
 */
export function today(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

/**
 * Add a given number of days to a date string and return the result as yyyy-MM-dd.
 *
 * @param dateStr  ISO date string (yyyy-MM-dd)
 * @param days     Number of days to add (can be negative to subtract)
 */
export function addDays(dateStr: string, days: number): string {
  try {
    return format(fnsAddDays(parseISO(dateStr), days), 'yyyy-MM-dd');
  } catch {
    return dateStr;
  }
}

/**
 * Return true if the due date is strictly in the past (after end of due day).
 * Returns false for null/undefined/invalid values (not overdue if unknown).
 *
 * @param dueDateStr  ISO date string or null/undefined
 */
export function isOverdue(dueDateStr: string | null | undefined): boolean {
  if (!dueDateStr) return false;
  try {
    return isPast(parseISO(dueDateStr + 'T23:59:59'));
  } catch {
    return false;
  }
}

/**
 * Return the number of calendar days until (or since) the due date.
 *
 * Positive value  → due date is in the future (days remaining)
 * Zero            → due today
 * Negative value  → overdue (days past due)
 * null            → no due date provided or invalid
 *
 * @param dueDateStr  ISO date string or null/undefined
 */
export function daysUntilDue(dueDateStr: string | null | undefined): number | null {
  if (!dueDateStr) return null;
  try {
    return differenceInDays(parseISO(dueDateStr), new Date());
  } catch {
    return null;
  }
}

/**
 * Return a month key in the format 'YYYY-MM' for use with the usage reset logic.
 *
 * If no date string is provided, returns the current month key.
 *
 * Examples:
 *   getMonthKey()              → "2026-06"
 *   getMonthKey("2026-01-15") → "2026-01"
 *
 * @param dateStr  Optional ISO date string (yyyy-MM-dd). Defaults to today.
 */
export function getMonthKey(dateStr?: string): string {
  const d = dateStr ? parseISO(dateStr) : new Date();
  return format(d, 'yyyy-MM');
}
