import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
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

function restoreScroll() {
  document.body.style.overflow = ''
  document.body.style.position = ''
  document.documentElement.style.overflow = ''
}

export default function PurchaseButton({ planId, planName, alreadyPurchased = false, purchasedOn = null }) {
  const { theme } = useTheme()
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [purchase, setPurchase] = useState(null)
  const [ownedNotice, setOwnedNotice] = useState(false)

  async function proceed(user) {
    if (busy) return
    setBusy(true)
    setError('')
    setMessage('')
    let orderData
    try {
      orderData = await api('/payments/order', {
        method: 'POST',
        body: JSON.stringify({
          planId,
          name: user?.name,
          email: user?.email,
          phone: user?.phone,
          company: user?.company,
        }),
      })
    } catch (e) {
      if (e.code === 'ALREADY_PURCHASED') {
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

    const prefillName = orderData.customer?.name || user?.name || ''
    const prefillEmail = orderData.customer?.email || user?.email || ''
    const prefillContact = orderData.customer?.phone || user?.phone || ''

    const rzp = new window.Razorpay({
      key: orderData.keyId,
      amount: orderData.order.amount,
      currency: orderData.order.currency,
      name: 'MA Creation',
      description: planName,
      order_id: orderData.order.id,
      prefill: { name: prefillName, email: prefillEmail, contact: prefillContact },
      theme: { color: theme.primary },
      handler: async response => {
        try { rzp.close?.() } catch (_) {}
        restoreScroll()
        try {
          const verified = await api('/payments/verify', { method: 'POST', body: JSON.stringify(response) })
          setPurchase(verified.payment)
          window.dispatchEvent(new Event('courses-updated'))
          if (getUser()) {
            setMessage('Payment verified successfully. Redirecting you to your unlocked courses…')
            setTimeout(() => {
              restoreScroll()
              navigate('/courses')
            }, 1500)
          } else {
            setMessage('Payment verified successfully. Create an account or log in to unlock your courses.')
          }
        } catch (e) {
          setMessage(e.message)
        } finally {
          restoreScroll()
          setBusy(false)
        }
      },
      modal: {
        ondismiss: () => {
          restoreScroll()
          api('/payments/failed', { method: 'POST', body: JSON.stringify({ razorpay_order_id: orderData.order.id }) }).catch(() => {})
          setMessage('Checkout was closed before payment completed. Our team can follow up with you.')
          setBusy(false)
        }
      }
    })
    rzp.on('payment.failed', () => { 
      restoreScroll()
      api('/payments/failed', { method: 'POST', body: JSON.stringify({ razorpay_order_id: orderData.order.id }) }).catch(() => {})
      setBusy(false) 
    })
    rzp.open()
  }

  function handleBuyClick() {
    setError('')
    setMessage('')
    if (alreadyPurchased) {
      setOwnedNotice(true)
      return
    }
    const user = getUser()
    if (!user) {
      navigate('/login', { state: { from: '/plans' } })
      return
    }
    proceed(user)
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
      {error && <div className="mt-2 text-xs text-rust font-medium">{error}</div>}
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
    </div>
  )
}
