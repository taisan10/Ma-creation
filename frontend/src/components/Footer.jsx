import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { api } from '../lib/api'

function FooterCol({ title, items }) {
  return (
    <div>
      <h5 className="font-mono text-xs tracking-wide uppercase text-goldlight mb-4">{title}</h5>
      <ul className="space-y-2.5 text-[13.8px]">
        {items.map((i) => (
          <li key={i.label}>
            <Link to={i.to} className="hover:text-white transition-colors">{i.label}</Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function Footer() {
  const [brand,setBrand]=useState({})
  useEffect(()=>{api('/public/settings/brand').then(r=>setBrand(r.setting?.value||{})).catch(()=>{})},[])
  return (
    <footer className="bg-ink text-paper/80 pt-16">
      <div className="wrap">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-paper/10">
          <div className="lg:col-span-1">
            <div className="font-display text-xl text-paper">{brand.name||'MA Creation'}</div>
            <p className="mt-3 text-[13.5px] text-paper/60 max-w-[32ch]">
              Pan‑India GeM consultancy, training and managed catalog operations for sellers,
              buyers and OEMs on the Government e‑Marketplace.
            </p>
            <div className="flex gap-3.5 mt-5">
              {['W', 'Y', 'in'].map((s) => (
                <a
                  key={s}
                  href="#"
                  aria-label="Social link"
                  className="w-8 h-8 rounded-full border border-paper/25 flex items-center justify-center text-xs hover:border-goldlight hover:text-goldlight transition-colors"
                >
                  {s}
                </a>
              ))}
            </div>
          </div>

          <FooterCol
            title="Policy"
            items={[
              { label: 'Privacy Policy', to: '/policies#privacy' },
              { label: 'Terms & Conditions', to: '/policies#terms' },
              { label: 'Refund & Cancellation', to: '/policies#refund' },
            ]}
          />
          <FooterCol
            title="GeM Services"
            items={[
              { label: 'GeM Registration', to: '/services#registration' },
              { label: 'Product Upload', to: '/services#registration' },
              { label: 'Brand Approve', to: '/services#oem' },
              { label: 'Bid Participation', to: '/services#oem' },
              { label: 'Order Processing', to: '/services#packages' },
            ]}
          />
          <FooterCol
            title="GeM Training"
            items={[
              { label: 'Full GeM Training', to: '/plans#training' },
              { label: 'Product Upload', to: '/plans#training' },
              { label: 'Bid Participation', to: '/plans#training' },
              { label: 'OEM Panel', to: '/services#oem' },
            ]}
          />

          <div>
            <h5 className="font-mono text-xs tracking-wide uppercase text-goldlight mb-4">Contact Us</h5>
            <ul className="space-y-2.5 text-[13.8px]">
              <li>MA Creation</li>
              <li>Email: {brand.email||'hello@macreation.in'}</li>
              <li>Phone: {brand.phone||'+91‑XXXXX‑XXXXX'}</li>
              <li>Support: {brand.support||'24 × 7'}</li>
              <li>{brand.address||'Charkhi Dadri, Haryana, India'}</li>
              <li><a href="/theme" className="text-goldlight hover:underline">Design System / Colours</a></li>
            </ul>
          </div>
        </div>

        <div className="flex justify-between items-center flex-wrap gap-2.5 py-6 text-[12.5px] text-paper/50">
          <span>© 2026 MA Creation. All rights reserved.</span>
          <span>React + Tailwind prototype — figures &amp; contact details are placeholders.</span>
        </div>
      </div>
    </footer>
  )
}
