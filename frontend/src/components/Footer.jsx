// import { Link } from 'react-router-dom'
// import { useEffect, useState } from 'react'
// import { api } from '../lib/api'

// function FooterCol({ title, items }) {
//   return (
//     <div>
//       <h5 className="font-mono text-xs tracking-wide uppercase text-goldlight mb-4">{title}</h5>
//       <ul className="space-y-2.5 text-[13.8px]">
//         {items.map((i) => (
//           <li key={i.label}>
//             <Link to={i.to} className="hover:text-white transition-colors">{i.label}</Link>
//           </li>
//         ))}
//       </ul>
//     </div>
//   )
// }

// export default function Footer() {
//   const [brand,setBrand]=useState({})
//   useEffect(()=>{api('/public/settings/brand').then(r=>setBrand(r.setting?.value||{})).catch(()=>{})},[])
//   return (
//     <footer className="bg-ink text-paper/80 pt-16">
//       <div className="wrap">
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-paper/10">
//           <div className="lg:col-span-1">
//             <div className="font-display text-xl text-paper">{brand.name||'MA Creation'}</div>
//             <p className="mt-3 text-[13.5px] text-paper/60 max-w-[32ch]">
//               Pan‑India GeM consultancy, training and managed catalog operations for sellers,
//               buyers and OEMs on the Government e‑Marketplace.
//             </p>
//             <div className="flex gap-3.5 mt-5">
//               {['W', 'Y', 'in'].map((s) => (
//                 <a
//                   key={s}
//                   href="#"
//                   aria-label="Social link"
//                   className="w-8 h-8 rounded-full border border-paper/25 flex items-center justify-center text-xs hover:border-goldlight hover:text-goldlight transition-colors"
//                 >
//                   {s}
//                 </a>
//               ))}
//             </div>
//           </div>

//           <FooterCol
//             title="Policy"
//             items={[
//               { label: 'Privacy Policy', to: '/policies#privacy' },
//               { label: 'Terms & Conditions', to: '/policies#terms' },
//               { label: 'Refund & Cancellation', to: '/policies#refund' },
//             ]}
//           />
//           <FooterCol
//             title="GeM Services"
//             items={[
//               { label: 'GeM Registration', to: '/services#registration' },
//               { label: 'Product Upload', to: '/services#registration' },
//               { label: 'Brand Approve', to: '/services#oem' },
//               { label: 'Bid Participation', to: '/services#oem' },
//               { label: 'Order Processing', to: '/services#packages' },
//             ]}
//           />
//           <FooterCol
//             title="GeM Training"
//             items={[
//               { label: 'Full GeM Training', to: '/plans#training' },
//               { label: 'Product Upload', to: '/plans#training' },
//               { label: 'Bid Participation', to: '/plans#training' },
//               { label: 'OEM Panel', to: '/services#oem' },
//             ]}
//           />

//           <div>
//             <h5 className="font-mono text-xs tracking-wide uppercase text-goldlight mb-4">Contact Us</h5>
//             <ul className="space-y-2.5 text-[13.8px]">
//               <li>MA Creation</li>
//               <li>Email: {brand.email||'hello@macreation.in'}</li>
//               <li>Phone: {brand.phone||'+91‑XXXXX‑XXXXX'}</li>
//               <li>Support: {brand.support||'24 × 7'}</li>
//               <li>{brand.address||'Charkhi Dadri, Haryana, India'}</li>
//               <li><a href="/theme" className="text-goldlight hover:underline">Design System / Colours</a></li>
//             </ul>
//           </div>
//         </div>

//         <div className="flex justify-between items-center flex-wrap gap-2.5 py-6 text-[12.5px] text-paper/50">
//           <span>© 2026 MA Creation. All rights reserved.</span>
//           <span>React + Tailwind prototype — figures &amp; contact details are placeholders.</span>
//         </div>
//       </div>
//     </footer>
//   )
// }

import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import {
  Youtube,
  Linkedin,
  Instagram,
  Facebook,
  Twitter,
  MessageCircle,
} from 'lucide-react'
import { api } from '../lib/api'

function FooterCol({ title, items }) {
  return (
    <div>
      <h5 className="font-mono text-xs tracking-wide uppercase text-goldlight mb-4">
        {title}
      </h5>

      <ul className="space-y-2.5 text-[13.8px]">
        {items.map((i) => (
          <li key={i.label}>
            <Link
              to={i.to}
              className="hover:text-white transition-colors"
            >
              {i.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function Footer() {
  const [brand, setBrand] = useState({})

  useEffect(() => {
    let active = true
    api('/public/settings/brand')
      .then((r) => { if (active) setBrand(r.setting?.value || {}) })
      .catch(() => {})
    return () => { active = false }
  }, [])

  // Social media icons
  const socialLinks = [
    {
      icon: Youtube,
      label: 'YouTube',
      href: brand.youtube || 'https://www.youtube.com/channel/UC0zS7FdDPYdubq9XAXoWeZA',
    },
    {
      icon: Linkedin,
      label: 'LinkedIn',
      href: brand.linkedin || 'https://www.linkedin.com/dashboard/',
    },
    {
      icon: Instagram,
      label: 'Instagram',
      href: brand.instagram || 'https://www.instagram.com/macreation_official?igsh=Y3cxam9yZGo5M2Nh',
    },
    {
      icon: Facebook,
      label: 'Facebook',
      href: brand.facebook || 'https://www.facebook.com/profile.php?id=61573790485214',
    },
    {
      icon: Twitter,
      label: 'Twitter',
      href: brand.twitter || 'https://x.com/macreation42',
    },
    {
      icon: MessageCircle,
      label: 'WhatsApp',
      href: brand.whatsapp || '#',
    },
  ]

  return (
    <footer className="bg-ink text-paper/80 pt-16">
      <div className="wrap">

        {/* ================= TOP FOOTER ================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-paper/10">

          {/* ================= BRAND ================= */}
          <div className="lg:col-span-1">

            <div className="font-display text-xl text-paper">
              {brand.name || 'MA Creation'}
            </div>

            <p className="mt-3 text-[13.5px] text-paper/60 max-w-[32ch]">
              Pan-India GeM consultancy, training and managed catalog
              operations for sellers, buyers and OEMs on the Government
              e-Marketplace.
            </p>

            {/* ================= SOCIAL ICONS ================= */}
            <div className="flex flex-wrap gap-3 mt-5">

              {socialLinks.map(({ icon: Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  title={label}
                  className="
                    w-9 h-9
                    rounded-full
                    border border-paper/25
                    flex items-center justify-center
                    text-paper/70
                    hover:border-goldlight
                    hover:text-goldlight
                    hover:bg-goldlight/5
                    hover:-translate-y-0.5
                    transition-all duration-300
                  "
                >
                  <Icon
                    size={17}
                    strokeWidth={1.8}
                  />
                </a>
              ))}

            </div>
          </div>

          {/* ================= POLICY ================= */}
          <FooterCol
            title="Policy"
            items={[
              {
                label: 'Privacy Policy',
                to: '/policies#privacy',
              },
              {
                label: 'Terms & Conditions',
                to: '/policies#terms',
              },
              {
                label: 'Refund & Cancellation',
                to: '/policies#refund',
              },
            ]}
          />

          {/* ================= GEM SERVICES ================= */}
          <FooterCol
            title="GeM Services"
            items={[
              {
                label: 'GeM Registration',
                to: '/services#registration',
              },
              {
                label: 'Product Upload',
                to: '/services#registration',
              },
              {
                label: 'Brand Approve',
                to: '/services#oem',
              },
              {
                label: 'Bid Participation',
                to: '/services#oem',
              },
              {
                label: 'Order Processing',
                to: '/services#packages',
              },
            ]}
          />

          {/* ================= GEM TRAINING ================= */}
          <FooterCol
            title="GeM Training"
            items={[
              {
                label: 'Full GeM Training',
                to: '/plans#training',
              },
              {
                label: 'Product Upload',
                to: '/plans#training',
              },
              {
                label: 'Bid Participation',
                to: '/plans#training',
              },
              {
                label: 'OEM Panel',
                to: '/services#oem',
              },
            ]}
          />

          {/* ================= CONTACT ================= */}
          <div>
            <h5 className="font-mono text-xs tracking-wide uppercase text-goldlight mb-4">
              Contact Us
            </h5>

            <ul className="space-y-2.5 text-[13.8px]">

              <li>
                {brand.name || 'MA Creation'}
              </li>

              <li>
                Email:{' '}
                <a
                  href={`mailto:${brand.email || 'macreation42@gmail.com'}`}
                  className="hover:text-goldlight transition-colors"
                >
                  {brand.email || 'macreation42@gmail.com'}
                </a>
              </li>

              <li>
                Phone:{' '}
                <a
                  href={`tel:${brand.phone || '+91-8387937000'}`}
                  className="hover:text-goldlight transition-colors"
                >
                  {brand.phone || '+91-8387937000'}
                </a>
              </li>

              <li>
                Support: {brand.support || '24 × 7'}
              </li>

              <li>
                {brand.address || 'Charkhi Dadri, Haryana, India'}
              </li>

              {/* <li>
                <a
                  href="/theme"
                  className="text-goldlight hover:underline"
                >
                  Design System / Colours
                </a>
              </li> */}

            </ul>
          </div>
        </div>

        {/* ================= BOTTOM FOOTER ================= */}
        <div className="flex justify-between items-center flex-wrap gap-2.5 py-6 text-[12.5px] text-paper/50">

          <span>
            © 2026 MA Creation. All rights reserved.
          </span>

        

        </div>

      </div>
    </footer>
  )
}
