// src/utils/documentNumber.ts
import * as Crypto from 'expo-crypto';
import { format } from 'date-fns';

/**
 * Generate a human-readable document number.
 *
 * Format: {PREFIX}-{YYYY}-{NNNN}
 * Examples:
 *   generateDocumentNumber('FAC', 1)   → "FAC-2026-0001"
 *   generateDocumentNumber('DEV', 42)  → "DEV-2026-0042"
 *   generateDocumentNumber('INV', 999) → "INV-2026-0999"
 *
 * The counter argument is the 1-based value to display (already incremented).
 * It is zero-padded to 4 digits. If the counter exceeds 9999 it will naturally
 * expand (e.g. 10000 → "FAC-2026-10000").
 */
export function generateDocumentNumber(prefix: string, counter: number): string {
  const year = format(new Date(), 'yyyy');
  const padded = String(counter + 1).padStart(4, '0');
  return `${prefix}-${year}-${padded}`;
}

/**
 * Generate a cryptographically random UUID v4 string.
 * Uses expo-crypto so it works correctly in the React Native / Expo environment.
 */
export async function generateId(): Promise<string> {
  return Crypto.randomUUID();
}
