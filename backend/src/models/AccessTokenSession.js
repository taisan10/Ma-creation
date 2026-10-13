import mongoose from 'mongoose'

/**
 * AccessTokenSession tracks active short-lived JWTs by their unique JTI (JWT ID).
 * When a user logs out, their session is deleted from this collection.
 * This guarantees INSTANT token revocation without having to wait for JWT expiration.
 * MongoDB automatically deletes expired records using the TTL index on expiresAt.
 */
const accessTokenSessionSchema = new mongoose.Schema(
  {
    jti: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    sessionId: {
      type: String,
      required: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // MongoDB automatic TTL cleanup
    },
  },
  { timestamps: true }
)

export default mongoose.models.AccessTokenSession ||
  mongoose.model('AccessTokenSession', accessTokenSessionSchema)
