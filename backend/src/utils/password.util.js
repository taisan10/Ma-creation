import argon2 from 'argon2'

export const DUMMY_ARGON2_HASH =
  '$argon2id$v=19$m=65536,t=1,p=1$QmluYXJ5U2FsdEZvclRpbWluZw$5rX1cEw5T6d6Jq8u0Y8u8G3H4K5L6M7N8O9P0Q1R2S3'

export async function hashPassword(plainPassword) {
  return argon2.hash(plainPassword, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 1,
    parallelism: 1,
  })
}

/**
 * Constant-time verification of password against Argon2id hash
 */
export async function verifyPassword(hash, plainPassword) {
  try {
    if (!hash || !plainPassword) return false
    return await argon2.verify(hash, plainPassword)
  } catch {
    return false
  }
}

