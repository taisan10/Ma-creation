import { useEffect, useState } from 'react'
import AdminShell from '../../components/admin/AdminShell'
import { api } from '../../lib/api'

function DetailModal({ item, onClose }) {
  if (!item) return null
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-ink/60 backdrop-blur-sm" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="bg-card w-full max-w-md rounded-[10px] shadow-card border border-ink/10 p-7" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-start">
          <h2 className="font-display text-xl">Customer details</h2>
          <button className="text-ink/50 hover:text-ink" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <dl className="mt-5 space-y-3 text-sm">
          <div><dt className="field-label">Name</dt><dd>{item.name || item.user?.name || '—'}</dd></div>
          <div><dt className="field-label">Email</dt><dd>{item.email || item.user?.email || '—'}</dd></div>
          <div><dt className="field-label">Phone</dt><dd>{item.phone || item.user?.phone || '—'}</dd></div>
          <div><dt className="field-label">Company</dt><dd>{item.company || item.user?.company || '—'}</dd></div>
          <div><dt className="field-label">Plan</dt><dd>{item.plan?.name || '—'}</dd></div>
          <div><dt className="field-label">Amount</dt><dd>₹{item.amount}</dd></div>
          <div><dt className="field-label">Status</dt><dd><span className="badge">{item.status}</span></dd></div>
          <div><dt className="field-label">Razorpay Order ID</dt><dd className="font-mono text-xs">{item.razorpayOrderId || '—'}</dd></div>
          <div><dt className="field-label">Razorpay Payment ID</dt><dd className="font-mono text-xs">{item.razorpayPaymentId || '—'}</dd></div>
          <div><dt className="field-label">Date</dt><dd>{item.createdAt ? new Date(item.createdAt).toLocaleString() : '—'}</dd></div>
        </dl>
      </div>
    </div>
  )
}

function PaymentTable({ items, onSelect, emptyText }) {
  if (items.length === 0) return <p className="text-ink/50 text-sm">{emptyText}</p>
  return (
    <div className="table-wrap">
      <table className="w-full min-w-[900px]">
        <thead>
          <tr>
            <th className="th-cell">Customer</th>
            <th className="th-cell">Plan</th>
            <th className="th-cell">Amount</th>
            <th className="th-cell">Status</th>
            <th className="th-cell">Payment ID</th>
            <th className="th-cell">Date</th>
          </tr>
        </thead>
        <tbody>
          {items.map(x => (
            <tr key={x._id} className="cursor-pointer hover:bg-ink/[0.03]" onClick={() => onSelect(x)}>
              <td className="td-cell">
                {x.name || x.user?.name || '—'}
                <div className="text-xs text-ink/50">{x.email || x.user?.email}</div>
              </td>
              <td className="td-cell">{x.plan?.name || '—'}</td>
              <td className="td-cell font-mono">₹{x.amount}</td>
              <td className="td-cell"><span className="badge">{x.status}</span></td>
              <td className="td-cell font-mono text-xs">{x.razorpayPaymentId || x.razorpayOrderId || '—'}</td>
              <td className="td-cell text-xs">{x.createdAt ? new Date(x.createdAt).toLocaleString() : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function AdminPayments() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    api('/admin/payments')
      .then(r => setItems(Array.isArray(r.payments) ? r.payments : []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const paid = items.filter(x => x.status === 'paid')
  // "Reached payment but didn't pay": order was created (checkout opened)
  // but never completed, or the attempt failed.
  const pending = items.filter(x => x.status === 'created' || x.status === 'failed')

  return (
    <AdminShell>
      <h1 className="h2">Payments</h1>
      <p className="mt-2 text-ink/60">Razorpay order/payment records. Click any row to see the customer's full contact details.</p>
      {error && <p className="mt-4 text-rust text-sm">{error}</p>}

      {loading ? (
        <p className="mt-7 text-ink/50 text-sm">Loading…</p>
      ) : (
        <div className="space-y-10 mt-7">
          <section>
            <div className="flex items-center gap-3">
              <h2 className="font-display text-xl">Paid customers</h2>
              <span className="badge">{paid.length}</span>
            </div>
            <p className="text-sm text-ink/50 mt-1 mb-4">Customers who completed payment successfully.</p>
            <PaymentTable items={paid} onSelect={setSelected} emptyText="No completed payments yet." />
          </section>

          <section>
            <div className="flex items-center gap-3">
              <h2 className="font-display text-xl">Reached payment, didn't complete</h2>
              <span className="badge">{pending.length}</span>
            </div>
            <p className="text-sm text-ink/50 mt-1 mb-4">
              Visitors who filled in their details and opened checkout, but closed it or the payment failed before completing.
              Follow up with them using their contact info below.
            </p>
            <PaymentTable items={pending} onSelect={setSelected} emptyText="No abandoned checkouts right now." />
          </section>
        </div>
      )}

      <DetailModal item={selected} onClose={() => setSelected(null)} />
    </AdminShell>
  )
}
