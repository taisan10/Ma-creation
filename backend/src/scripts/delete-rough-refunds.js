import mongoose from 'mongoose';
import { env } from '../config/env.js';
import Payment from '../models/LMS/Payment.js';
import RefundTicket from '../models/LMS/RefundTicket.js';

async function deleteRoughRefunds() {
  try {
    let mongoUri = env.mongoUri || process.env.MONGODB_URI;
    if (mongoUri && mongoUri.includes('@mongo:27017')) {
      mongoUri = mongoUri.replace('@mongo:27017', '@127.0.0.1:27018');
    } else if (mongoUri && mongoUri.includes('@mongo:')) {
      mongoUri = mongoUri.replace('@mongo:', '@127.0.0.1:27018');
    }

    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
    console.log('Connected to MongoDB successfully!');

    // Find all mock refund tickets by razorpayPaymentId pattern or specific IDs
    const mockTickets = await RefundTicket.find({
      $or: [
        { razorpayPaymentId: { $regex: /^pay_mock_rf/ } },
        { _id: { $in: ['6b09320fe94a6dcc8d15ddfc', '6b09320fe94a6dcc8d15ddff'] } }
      ]
    });

    const ticketIds = mockTickets.map(t => t._id);
    const paymentIds = mockTickets.map(t => t.payment).filter(Boolean);

    // Delete tickets
    const deletedTickets = await RefundTicket.deleteMany({
      _id: { $in: ticketIds },
    });

    // Delete mock payments associated with these tickets or with the mock tag
    const deletedPayments = await Payment.deleteMany({
      $or: [
        { _id: { $in: paymentIds } },
        { 'rawWebhook.mockTag': 'ROUGH_TEST_REFUND' },
        { razorpayOrderId: { $regex: /^order_mock_rf/ } },
      ],
    });

    console.log(`🧹 Cleanup Complete:`);
    console.log(`- Deleted Refund Tickets: ${deletedTickets.deletedCount}`);
    console.log(`- Deleted Mock Payments: ${deletedPayments.deletedCount}`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Failed to delete rough refunds:', err);
    process.exit(1);
  }
}

deleteRoughRefunds();
