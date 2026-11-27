import Razorpay from "razorpay";
import RefundTicket from "../models/LMS/RefundTicket.js";
import Payment from "../models/LMS/Payment.js";
import { env } from "../config/env.js";
import { AppError } from "../utils/AppError.js";

const razorpay = new Razorpay({
  key_id: env.razorpayKeyId,
  key_secret: env.razorpayKeySecret,
});

export class RefundService {
  // 1. Student raises ticket
  static async createTicket({ userId, paymentId, reason }) {
    const payment = await Payment.findById(paymentId);
    if (!payment || payment.user.toString() !== userId.toString()) throw new AppError("Order not found", 404);
    if (payment.status !== "paid") throw new AppError("Only paid orders can be refunded", 400);

    // 7-Day Policy Guard
    const isExpired = (Date.now() - new Date(payment.createdAt)) / 86400000 > 7;
    if (isExpired) throw new AppError("Refund window of 7 days has expired", 400);

    // Duplicate Guard
    const exists = await RefundTicket.exists({ payment: paymentId, status: { $in: ["pending_review", "approved"] } });
    if (exists) throw new AppError("Refund ticket already active for this order", 409);

    return await RefundTicket.create({
      user: userId,
      payment: payment._id,
      plan: payment.plan,
      amount: payment.amount,
      razorpayPaymentId: payment.razorpayPaymentId,
      reason,
    });
  }

  // 2. Admin list tickets (TanStack handles filter/search on client)
  static async listTickets(limit = 100) {
    return await RefundTicket.find()
      .populate("user", "name email phone company")
      .populate("plan", "name price")
      .populate("payment", "razorpayOrderId createdAt amount")
      .sort({ createdAt: -1 })
      .limit(limit);
  }

  // 3. Admin Approves Refund
  static async approveRefund({ ticketId, adminNotes }) {
    const ticket = await RefundTicket.findOneAndUpdate(
      { _id: ticketId, status: "pending_review" },
      { status: "processing" },
      { new: true }
    );
    if (!ticket) throw new AppError("Ticket already processed or not found", 400);

    // Gateway Refund (with automatic state rollback on failure)
    let refund;
    try {
      refund = await razorpay.payments.refund(ticket.razorpayPaymentId, {
        amount: Math.round(ticket.amount * 100),
        notes: { ticketId: String(ticket._id) },
      });
    } catch (err) {
      await RefundTicket.findByIdAndUpdate(ticket._id, { status: "pending_review" });
      throw new AppError(
        `Razorpay refund failed: ${err.error?.description || err.message || "Gateway error"}`,
        502,
        "GATEWAY_REFUND_FAILED"
      );
    }

    // Revoke Payment Access
    await Payment.findByIdAndUpdate(ticket.payment, {
      status: "refunded",
      refundId: refund.id,
      refundedAt: new Date(),
    });

    ticket.status = "approved";
    ticket.razorpayRefundId = refund.id;
    ticket.adminNotes = adminNotes || null;
    ticket.resolvedAt = new Date();
    await ticket.save();

    return { success: true, refundId: refund.id, ticket };
  }

  // 4. Admin Rejects Refund
  static async rejectRefund({ ticketId, adminNotes }) {
    const ticket = await RefundTicket.findOneAndUpdate(
      { _id: ticketId, status: "pending_review" },
      { status: "rejected", adminNotes: adminNotes || null, resolvedAt: new Date() },
      { new: true }
    );
    if (!ticket) throw new AppError("Ticket already processed or not found", 400);

    return { success: true, ticket };
  }

  // 5. Webhook Reconcile (Out-of-band direct Razorpay refunds)
  static async handleWebhookRefund(paymentId, refundId) {
    if (!paymentId) return;
    await Payment.findOneAndUpdate(
      { razorpayPaymentId: paymentId, status: { $ne: "refunded" } },
      { status: "refunded", refundId, refundedAt: new Date() }
    );
    await RefundTicket.findOneAndUpdate(
      { razorpayPaymentId: paymentId, status: "pending_review" },
      { status: "approved", razorpayRefundId: refundId, resolvedAt: new Date() }
    );
  }
}