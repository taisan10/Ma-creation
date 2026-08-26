import { useState, useEffect, useRef } from 'react'
import { getUser } from '../lib/api'

// Shown before Razorpay opens. Collects the buyer's basic contact details --
// used later by the sales/support team even if the visitor never completes
// payment. Fields marked mandatory match what the backend requires.
export default function CheckoutInfoModal({ planName, onCancel, onSubmit, submitting, errorMessage }) {
  const user = getUser()
  const modalRef = useRef(null)
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    company: user?.company || ''
  })
  const [touched, setTouched] = useState(false)

  const valid = form.name.trim().length >= 2 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) && form.phone.trim().length >= 8

  useEffect(() => {
    modalRef.current?.focus()
    document.body.style.overflow = 'hidden'
    const handleEsc = (e) => { if (e.key === 'Escape') onCancel() }
    document.addEventListener('keydown', handleEsc)
    return () => { document.body.style.overflow = ''; document.removeEventListener('keydown', handleEsc) }
  }, [onCancel])

  function submit(e) {
    e.preventDefault()
    setTouched(true)
    if (!valid) return
    onSubmit(form)
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-ink/60 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div ref={modalRef} tabIndex={-1} className="bg-card w-full max-w-md rounded-[10px] shadow-card border border-ink/10 p-7 outline-none">
        <h2 className="font-display text-xl">Your details</h2>
        <p className="mt-1.5 text-sm text-ink/60">
          Before proceeding to payment for <b>{planName}</b>, please share a few basic details so our team can reach you.
        </p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label className="field-label" htmlFor="co-name">Full name *</label>
            <input id="co-name" className="field-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
            {touched && form.name.trim().length < 2 && <p className="text-rust text-xs mt-1">Please enter your name.</p>}
          </div>
          <div>
            <label className="field-label" htmlFor="co-email">Email *</label>
            <input id="co-email" type="email" className="field-input" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
            {touched && !/\S+@\S+\.\S+/.test(form.email) && <p className="text-rust text-xs mt-1">Please enter a valid email.</p>}
          </div>
          <div>
            <label className="field-label" htmlFor="co-phone">Contact number *</label>
            <input id="co-phone" type="tel" className="field-input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} required />
            {touched && form.phone.trim().length < 8 && <p className="text-rust text-xs mt-1">Please enter a valid phone number.</p>}
          </div>
          <div>
            <label className="field-label" htmlFor="co-company">Company (optional)</label>
            <input id="co-company" className="field-input" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} />
          </div>
          {errorMessage && <p className="text-rust text-sm">{errorMessage}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" className="btn-outline btn-sm flex-1" onClick={onCancel} disabled={submitting}>Cancel</button>
            <button type="submit" className="btn-gold btn-sm flex-1" disabled={submitting}>
              {submitting ? 'Preparing…' : 'Continue to payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
