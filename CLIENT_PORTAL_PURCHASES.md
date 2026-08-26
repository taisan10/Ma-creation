# Client Portal — Purchase History

## What was added

- Logged-in customers see **My Account** in the public header.
- `/account` shows the customer profile, number of purchases, total verified amount paid, and purchase cards.
- Each purchase shows plan name, amount, currency, purchase date/time, Razorpay payment ID, Razorpay order ID, status, and included plan features.
- A **Print / Save receipt** action uses the browser print dialog so the customer can save a PDF receipt without exposing payment secrets.
- After a successful Razorpay verification, the Plans page shows a **View My Purchase** action.
- Guest checkout is still supported. If a guest later registers/logs in using the same email used at checkout, paid guest purchases are automatically linked to that account.
- Backend endpoint: `GET /api/payments/mine` (authenticated).

## Customer flow

1. Customer opens Plans.
2. Customer buys a service/training plan.
3. Razorpay verifies the payment.
4. Payment is stored in MongoDB.
5. If logged in, the payment is linked immediately.
6. If not logged in, the payment is stored against the checkout email.
7. When the customer later creates/logs into an account with the same email, the paid purchase is linked automatically.
8. Customer opens **My Account** and sees the purchase history.

## Important

This portal displays the Razorpay transaction identifiers and purchase information stored by MA Creation. It does not expose card numbers, UPI credentials, passwords, or other sensitive payment credentials.
