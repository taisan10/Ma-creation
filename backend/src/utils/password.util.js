import argon2 from 'argon2'

/**
 * Pre-computed valid Argon2id hash (used to neutralize side-channel timing attacks).
 * When an email is NOT found in the database, we still run argon2.verify against this dummy
 * hash so that an attacker cannot determine user existence based on server response latency.
 */
export const DUMMY_ARGON2_HASH =
  '$argon2id$v=19$m=19456,t=2,p=1$QmluYXJ5U2FsdEZvclRpbWluZw$5rX1cEw5T6d6Jq8u0Y8u8G3H4K5L6M7N8O9P0Q1R2S3'

/**
 * Hash password with Argon2id using OWASP 2026 recommended parameters:
 * - Type: Argon2id (hybrid defense against side-channel and GPU cracking)
 * - Memory: 19456 KiB (~19 MiB)
 * - Iterations (Time cost): 2
 * - Parallelism: 1
 */
export async function hashPassword(plainPassword) {
  return argon2.hash(plainPassword, {
    type: argon2.argon2id,
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
  })
}

/**
 * Constant-time verification of password against Argon2id hash
 */
export async function verifyPassword(hash, plainPassword) {
  try {
    return await argon2.verify(hash, plainPassword)
  } catch {
    return false
  }
}
