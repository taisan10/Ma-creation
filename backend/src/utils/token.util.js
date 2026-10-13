import { randomBytes, createHash } from 'node:crypto'

/**
 * Generates a 512-bit (64 bytes hex) cryptographically secure random token.
 * Used for high-entropy Refresh Tokens.
 */
export function generateRefreshToken() {
  return randomBytes(64).toString('hex')
}

/**
 * Computes SHA-256 hash of a token.
 * We store ONLY the hash in the database to prevent token leakage even if DB is compromised.
 */
export function hashToken(token) {
  return createHash('sha256').update(token).digest('hex')
}

/**
 * Helper to parse human-readable durations (e.g., '15m', '7d', '24h') to milliseconds.
 */
export function parseDurationToMs(durationStr, fallbackMs = 7 * 24 * 60 * 60 * 1000) {
  if (!durationStr || typeof durationStr !== 'string') return fallbackMs
  const match = durationStr.trim().match(/^(\d+)([smhd])$/i)
  if (!match) return fallbackMs
  const val = parseInt(match[1], 10)
  const unit = match[2]
  switch (unit) {
    case 's': return val * 1000
    case 'm': return val * 60 * 1000
    case 'h': return val * 60 * 60 * 1000
    case 'd': return val * 24 * 60 * 60 * 1000
    default: return fallbackMs
  }
}
