function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]))
}

function money(value, currency = 'INR') {
  const n = Number(value || 0)
  return currency === 'INR' ? `₹${n.toLocaleString('en-IN')}` : `${currency} ${n.toLocaleString('en-IN')}`
}

function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatTime(value) {
  if (!value) return ''
  return new Date(value).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
}

// Opens a clean, dedicated print view for a single purchase so the customer
// gets a proper payment receipt instead of the whole account page (nav,
// sidebar, other purchases, buttons, etc.) coming out of the printer.
export function printReceipt(payment) {
  const plan = payment.plan || {}
  const statusLabel = payment.status === 'paid' ? 'Paid' : payment.status === 'failed' ? 'Payment Failed' : 'Processing'
  const statusColor = payment.status === 'paid' ? '#0f766e' : payment.status === 'failed' ? '#b91c1c' : '#b45309'
  const features = Array.isArray(plan.features) ? plan.features : []

  const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Receipt ${esc(payment.razorpayOrderId || payment._id || '')}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a1a; margin: 0; padding: 40px; background: #fff; }
  .sheet { max-width: 720px; margin: 0 auto; }
  .head { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #111; padding-bottom: 18px; }
  .brand { font-size: 22px; font-weight: 700; letter-spacing: .02em; }
  .brand-sub { font-size: 11px; color: #666; margin-top: 4px; }
  .status { display: inline-block; padding: 6px 14px; border-radius: 999px; font-size: 12px; font-weight: 700; color: #fff; background: ${statusColor}; }
  h1 { font-size: 18px; margin: 26px 0 4px; }
  .muted { color: #666; font-size: 12px; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 22px; }
  .box { background: #f7f7f5; border-radius: 8px; padding: 14px 16px; }
  .box .label { font-size: 10px; text-transform: uppercase; letter-spacing: .08em; color: #888; }
  .box .value { font-size: 15px; font-weight: 600; margin-top: 4px; word-break: break-all; }
  table.info { width: 100%; margin-top: 26px; border-collapse: collapse; font-size: 13px; }
  table.info td { padding: 9px 0; border-bottom: 1px solid #eee; }
  table.info td.k { color: #666; width: 42%; }
  table.info td.v { font-weight: 600; text-align: right; }
  .features { margin-top: 24px; }
  .features .label { font-size: 12px; font-weight: 700; margin-bottom: 8px; }
  .features ul { margin: 0; padding: 0; list-style: none; columns: 2; column-gap: 20px; }
  .features li { font-size: 12.5px; margin-bottom: 6px; break-inside: avoid; }
  .features li:before { content: '✓ '; color: #0f766e; font-weight: 700; }
  .foot { margin-top: 34px; padding-top: 14px; border-top: 1px solid #ddd; font-size: 11px; color: #888; display: flex; justify-content: space-between; }
  @media print { body { padding: 0; } .sheet { max-width: 100%; } }
</style>
</head>
<body>
  <div class="sheet">
    <div class="head">
      <div>
        <div class="brand">MA Creation</div>
        <div class="brand-sub">GeM Registration &amp; Compliance Services</div>
      </div>
      <span class="status">${esc(statusLabel)}</span>
    </div>

    <h1>${esc(plan.name || 'MA Creation Plan')}</h1>
    <div class="muted">${esc(plan.billing || 'One-time')}${plan.duration ? ` · ${esc(plan.duration)}` : ''}</div>

    <div class="grid">
      <div class="box">
        <div class="label">Amount Paid</div>
        <div class="value">${money(payment.amount, payment.currency)}</div>
      </div>
      <div class="box">
        <div class="label">Purchase Date</div>
        <div class="value">${esc(formatDate(payment.createdAt))}</div>
        <div class="muted">${esc(formatTime(payment.createdAt))}</div>
      </div>
    </div>

    <table class="info">
      <tr><td class="k">Order ID</td><td class="v">${esc(payment.razorpayOrderId || '—')}</td></tr>
      <tr><td class="k">Payment ID</td><td class="v">${esc(payment.razorpayPaymentId || 'Processing')}</td></tr>
      <tr><td class="k">Customer Name</td><td class="v">${esc(payment.name || '—')}</td></tr>
      <tr><td class="k">Email</td><td class="v">${esc(payment.email || '—')}</td></tr>
      <tr><td class="k">Phone</td><td class="v">${esc(payment.phone || '—')}</td></tr>
      ${payment.company ? `<tr><td class="k">Company</td><td class="v">${esc(payment.company)}</td></tr>` : ''}
    </table>

    ${features.length ? `<div class="features"><div class="label">Included in your plan</div><ul>${features.map(f => `<li>${esc(f)}</li>`).join('')}</ul></div>` : ''}

    <div class="foot">
      <span>This is a system-generated receipt.</span>
      <span>Printed on ${esc(formatDate(new Date()))}</span>
    </div>
  </div>
  <script>document.addEventListener('DOMContentLoaded', function(){ window.print(); });</script>
</body>
</html>`

  const win = window.open('', '_blank', 'width=820,height=900')
  if (!win) {
    // Pop-up blocked — fall back to printing the current page rather than
    // silently doing nothing.
    window.print()
    return
  }
  win.document.open()
  win.document.write(html)
  win.document.close()
}
