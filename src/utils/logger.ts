/**
 * Minimal logger utility
 *
 * Wraps console methods with consistent formatting
 */

export function info(message: string): void {
  console.log(`[INFO] ${message}`);
}

export function error(message: string): void {
  console.error(`[ERROR] ${message}`);
}
