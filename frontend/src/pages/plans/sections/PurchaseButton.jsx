import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import CheckoutInfoModal from '../../../components/CheckoutInfoModal'
import { api, getUser } from '../../../lib/api'
import { useTheme } from '../../../theme'

async function loadRazorpay() {
  if (window.Razorpay) return true
  await new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = resolve
    script.onerror = reject
    document.body.appendChild(script)
  })
  return true
}

function money(value) { return `₹${Number(value || 0).toLocaleString('en-IN')}` }

export default function PurchaseButton({ planId, planName, alreadyPurchased = false, purchasedOn = null }) {
  const { theme } = useTheme()
  const navigate = useNavigate()
  const [showModal, setShowModal] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [purchase, setPurchase] = useState(null)
  const [ownedNotice, setOwnedNotice] = useState(false)

  async function proceed(contact) {
    setBusy(true)
    setError('')
    let orderData
    try {
      orderData = await api('/payments/order', { method: 'POST', body: JSON.stringify({ planId, ...contact }) })
    } catch (e) {
      // The server keeps the final say on whether this plan was already bought
      // (client-side state can be stale), so surface that clearly instead of a
      // generic error if that's what happened.
      if (e.code === 'ALREADY_PURCHASED') {
        setShowModal(false)
        setOwnedNotice(true)
      } else {
        setError(e.message)
      }
      setBusy(false)
      return
    }
    try {
      await loadRazorpay()
    } catch {
      setError('Could not load the payment gateway. Please check your connection and try again.')
      setBusy(false)
      return
    }
    setShowModal(false)
    const rzp = new window.Razorpay({
      key: orderData.keyId,
      amount: orderData.order.amount,
      currency: orderData.order.currency,
      name: 'MA Creation',
      description: planName,
      order_id: orderData.order.id,
      prefill: { name: contact.name, email: contact.email, contact: contact.phone },
      theme: { color: theme.primary },
      handler: async response => {
        try {
          const verified = await api('/payments/verify', { method: 'POST', body: JSON.stringify(response) })
          setPurchase(verified.payment)
          window.dispatchEvent(new Event('courses-updated'))
          if (getUser()) {
            // Logged-in buyer: this is the moment the plan's courses become
            // unlocked (Course.plan now matches a 'paid' Payment for them --
            // see requireCourseEntitlement in Part 4). Send them straight to
            // the page that lists everything they can now watch.
            setMessage('Payment verified successfully. Redirecting you to your unlocked courses…')
            setTimeout(() => navigate('/courses'), 1500)
          } else {
            // Guest checkout: there's no account yet for courses to attach
            // to, so we can't send them to /courses (it requires login).
            setMessage('Payment verified successfully. Create an account or log in to unlock your courses.')
          }
        } catch (e) {
          setMessage(e.message)
        } finally {
          setBusy(false)
        }
      },
      modal: {
        ondismiss: () => {
          api('/payments/failed', { method: 'POST', body: JSON.stringify({ razorpay_order_id: orderData.order.id }) }).catch(() => {})
          setMessage('Checkout was closed before payment completed. Our team can follow up with you.')
          setBusy(false)
        }
      }
    })
    rzp.on('payment.failed', () => { api('/payments/failed', { method: 'POST', body: JSON.stringify({ razorpay_order_id: orderData.order.id }) }).catch(() => {}); setBusy(false) })
    rzp.open()
  }

  function handleBuyClick() {
    setError('')
    if (alreadyPurchased) {
      setOwnedNotice(true)
      return
    }
    setShowModal(true)
  }

  if (alreadyPurchased) {
    return (
      <div>
        <button type="button" onClick={handleBuyClick} className="btn-outline btn-sm w-full cursor-default border-teal/40 text-teal">
          <span className="inline-flex items-center justify-center gap-1.5">✓ Already Purchased</span>
        </button>
        {purchasedOn && <p className="mt-2 text-center text-[11px] text-ink/45">Bought on {new Date(purchasedOn).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>}
        {ownedNotice && (
          <div className="mt-3 rounded-lg border border-teal/20 bg-teal/5 p-3 text-xs text-ink/70">
            You've already purchased {planName}. Head to your account to view the invoice or get support.
            <div className="mt-3 flex flex-wrap gap-2">
              <Link to="/account" className="btn-gold btn-sm">View My Purchase</Link>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div>
      <button onClick={handleBuyClick} disabled={busy} className="btn-gold btn-sm w-full">{busy ? 'Preparing…' : 'Buy Now'}</button>
      {ownedNotice && (
        <div className="mt-3 rounded-lg border border-teal/20 bg-teal/5 p-3 text-xs text-ink/70">
          Looks like you've already purchased {planName} ({money(purchase?.amount)} paid). No need to buy it again.
          <div className="mt-3 flex flex-wrap gap-2">
            <Link to="/account" className="btn-gold btn-sm">View My Purchase</Link>
          </div>
        </div>
      )}
      {message && (
        <div className="mt-3 rounded-lg border border-teal/20 bg-teal/5 p-3 text-xs text-ink/70">
          {message}
          {purchase && (
            <div className="mt-3 flex flex-wrap gap-2">
              <Link to="/account" className="btn-gold btn-sm">View My Purchase</Link>
              {!getUser() && <Link to="/login" className="btn-outline btn-sm">Create / Login to save it</Link>}
            </div>
          )}
        </div>
      )}
      {showModal && <CheckoutInfoModal planName={planName} submitting={busy} errorMessage={error} onCancel={() => setShowModal(false)} onSubmit={proceed} />}
    </div>
  )
}