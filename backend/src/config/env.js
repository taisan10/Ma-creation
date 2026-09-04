
import "dotenv/config";
export const env = {
  port: Number(process.env.PORT || 5000),
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
  mongoUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  razorpayKeyId: process.env.RAZORPAY_KEY_ID,
  razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET,
  razorpayWebhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET,
  bookMaxBytes: Number(process.env.BOOK_MAX_BYTES || 50 * 1024 * 1024),

  // --- MinIO / video storage ---
  minioEndpoint: process.env.MINIO_ENDPOINT || "127.0.0.1",
  minioPort: Number(process.env.MINIO_PORT || 9000),
  minioUseSSL: String(process.env.MINIO_USE_SSL).toLowerCase() === "true",
  minioAccessKey: process.env.MINIO_ACCESS_KEY,
  minioSecretKey: process.env.MINIO_SECRET_KEY,
  minioBucket: process.env.MINIO_BUCKET || "ma-course-videos",
  minioPublicEndpoint:
    process.env.MINIO_PUBLIC_ENDPOINT ||
    process.env.MINIO_ENDPOINT ||
    "127.0.0.1",
  minioPublicUseSSL:
    String(
      process.env.MINIO_PUBLIC_USE_SSL ?? process.env.MINIO_USE_SSL,
    ).toLowerCase() === "true",
  videoWatchMultiplier: Number(process.env.VIDEO_WATCH_MULTIPLIER || 2),
  videoPlaybackUrlTtlSeconds: Number(
    process.env.VIDEO_PLAYBACK_URL_TTL_SECONDS || 360,
  ),
};
export function assertProductionEnv() {
  if (process.env.NODE_ENV === "production") {
    for (const [key, value] of Object.entries({
      MONGODB_URI: env.mongoUri,
      JWT_SECRET: env.jwtSecret,
      CLIENT_URL: env.clientUrl,
      RAZORPAY_KEY_ID: env.razorpayKeyId,
      RAZORPAY_KEY_SECRET: env.razorpayKeySecret,
      RAZORPAY_WEBHOOK_SECRET: env.razorpayWebhookSecret,
      MINIO_ACCESS_KEY: env.minioAccessKey,
      MINIO_SECRET_KEY: env.minioSecretKey,
      MINIO_BUCKET: env.minioBucket,
    })) {
      if (!value) throw new Error(`${key} is required in production`);
    }
  }
}
