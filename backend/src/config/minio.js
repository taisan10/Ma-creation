import { Client as MinioClient } from 'minio'
import { env } from './env.js'

// One shared MinIO client for the whole app, same pattern as config/db.js's
// mongoose connection. `minioClient` is used for writes (admin upload) AND
// for generating presigned URLs (playback). It talks to MinIO over
// 127.0.0.1 (fast, internal, never touches the public internet).
export const minioClient = new MinioClient({
  endPoint: env.minioEndpoint,
  port: env.minioPort,
  useSSL: env.minioUseSSL,
  accessKey: env.minioAccessKey,
  secretKey: env.minioSecretKey
})

// A second, "public-facing" client is used ONLY to build presigned URLs that
// the user's browser can actually reach. Its endpoint/SSL settings point at
// your public Nginx-fronted domain (see env-additions.txt), not 127.0.0.1 --
// the MinIO Node SDK bakes host+protocol into the presigned URL it returns,
// so if we used the internal client for presigning, users would get an
// unreachable `http://127.0.0.1:9000/...` link.
export const minioPublicClient = new MinioClient({
  endPoint: env.minioPublicEndpoint,
  port: env.minioPublicUseSSL ? 443 : 9000,
  useSSL: env.minioPublicUseSSL,
  accessKey: env.minioAccessKey,
  secretKey: env.minioSecretKey
})

const BUCKET = env.minioBucket

/**
 * Ensures the video bucket exists and is PRIVATE (no anonymous read policy).
 * Call this once at server boot (see server.js changes in Part 3).
 * We deliberately do NOT set a public read policy -- every access to a video
 * object must go through our own presigned-URL issuance, which is where the
 * watch-count and entitlement checks happen. A public bucket would let
 * anyone with a guessed/leaked object key bypass all of that.
 */
export async function ensureVideoBucket() {
  const exists = await minioClient.bucketExists(BUCKET).catch(() => false)
  if (!exists) {
    await minioClient.makeBucket(BUCKET)
    console.log(`[minio] created bucket "${BUCKET}"`)
  }
}

export { BUCKET as VIDEO_BUCKET }