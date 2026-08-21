import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import Accordion from '../components/Accordion'

const privacyItems = [
  { q: '1. Data we collect from website users', a: 'Name, email, phone number and business details when you register, contact us, or use our services — plus technical and usage data such as IP address, browser type, device details, visit duration and pages viewed. Links to external sites are not covered by this policy.' },
  { q: '2. How we use your information & retention', a: 'To operate and improve the Site, personalise your experience, analyse usage, and — with your consent — send updates and offers. We retain data only as long as necessary for these purposes, in line with applicable law.' },
  { q: '3. Sharing information with third parties', a: 'We do not sell personal information. It may be shared to meet legal obligations, with your consent, with service providers who support hosting, analytics or support, or during a corporate transaction such as a merger or sale. We may also use anonymised, aggregated data for business purposes.' },
  { q: '4. Cookies & tracking technologies', a: 'We use cookies and similar tools to personalise your experience, recognise returning visitors and analyse behaviour. You can manage cookies through your browser; disabling them may affect Site functionality.' },
  { q: '5. Security measures', a: 'We use administrative, physical and technical safeguards to protect your data. No system is completely secure — contact us immediately if you suspect a breach.' },
  { q: "6. Children's privacy", a: 'Our Site is intended for users of legal age. We do not knowingly collect data from children; if we discover we have, we will delete it promptly.' },
  { q: '7. Applicable law', a: 'Collection, processing, storage and disclosure of your data comply with Indian law. Users outside India acknowledge their data may be processed in India.' },
  { q: '8. Types of information we collect', a: 'Personal: registration details, billing and business information, user-generated content. Technical & usage: device info, interaction logs, tender searches, communication logs. Location: geolocation data, only if you permit it.' },
  { q: '9. Data collected via our app (if applicable)', a: 'Device type, OS, app version, usage patterns, saved preferences, push notifications and location services — always with your consent, manageable from within the app.' },
  { q: '10. Your rights', a: 'Under Indian law you may access your personal information, correct inaccuracies, request deletion (subject to legal exceptions), and export your data in a machine-readable format. Contact us using the details below to exercise these rights.' },
  { q: '11. How to contact us', a: 'MA Creation · Email: [insert email] · Phone: [insert phone] · Address: [insert address] · Support: 24×7.' },
  { q: '12. Related policies', a: 'Your use of the Site is also governed by our Terms & Conditions and Refund & Cancellation Policy below.' },
  { q: '13. Updates to this policy', a: 'We may update this Privacy Policy periodically. Continued use of the Site after changes are posted indicates acceptance of the revised policy.' },
]

const termsItems = [
  { q: '1. Eligibility', a: 'You must be at least 18 years old and have the full capacity and competence to comply with these Terms.' },
  { q: '2. General use of services', a: 'Content on this Site is not legal advice and is not intended for advertising or solicitation. Forms and templates may only be used as authorised — reselling or redistributing them without permission is prohibited. We do not guarantee the outcome or quality of third-party professional services accessed through the Site.' },
  { q: '3. User responsibilities & prohibited activities', a: 'You agree to provide accurate documents and information, follow agreed deadlines, and comply with GeM and applicable legal requirements. You may not use offensive or unlawful language, infringe intellectual property, disrupt Site security, or misuse the service in any way.' },
  { q: '4. Service scope & modification', a: 'Each package or plan defines the services included (registration, listing, training, bidding, OEM/vendor support, etc). We may update, modify or discontinue services at our discretion, and functionality of an active subscription will not be materially reduced without notice.' },
  { q: '5. Payment terms', a: 'Fees, accepted payment methods, applicable GST/taxes and consequences of delayed payment are specified at the time of purchase or in your service agreement.' },
  { q: '6. Limitations on use', a: 'You may not decompile, reverse-engineer, scrape, resell, sublicense or create derivative works from the Site or its content, or use automated tools to extract information without permission.' },
  { q: '7. Confidentiality & data protection', a: 'Documents, credentials and contact details you share are used only to complete requested work and are not shared without consent, except as described in our Privacy Policy.' },
  { q: '8. Indemnification', a: 'You agree to indemnify MA Creation and its affiliates against claims, damages or expenses arising from your misuse of the services, breach of these Terms, or submission of inaccurate information.' },
  { q: '9. Warranty disclaimer & liability limitation', a: 'Services are provided "as is" and "as available" with no warranty of accuracy, error-free operation or fitness for a particular purpose. MA Creation is not responsible for third-party portal errors, government delays, or user mistakes. Liability, where it exists, is limited to the amount paid for the relevant service.' },
  { q: '10. Intellectual property', a: 'All Site content — training material, templates, software and designs — is owned by MA Creation. Unauthorised reproduction or distribution is prohibited without written consent.' },
  { q: '11. Registration & account security', a: 'Provide accurate registration details. Each account is for a single user unless otherwise agreed. Notify us immediately of any unauthorised access.' },
  { q: '12. Third-party content', a: 'The Site may link to or display third-party content. We are not responsible for its accuracy or availability — use your own discretion.' },
  { q: '13. Unlawful activity', a: 'Suspected unlawful activity may be reported to relevant authorities, and account information may be disclosed to assist investigations.' },
  { q: '14. Severability', a: 'If any provision of these Terms is found unenforceable, that provision is separated from the rest without affecting the validity of the remaining Terms.' },
  { q: '15. Updates to these Terms', a: 'We may revise these Terms at any time. Continued use of our services after changes are posted indicates your acceptance.' },
  { q: '16. Governing law & jurisdiction', a: 'These Terms are governed by Indian law. Disputes not resolved through discussion are subject to the exclusive jurisdiction of the courts of Vadodara, Gujarat.' },
  { q: '17. Entire agreement', a: 'These Terms, together with our Privacy Policy and Refund & Cancellation Policy, constitute the complete agreement between you and MA Creation.' },
]

const refundItems = [
  { q: '1. Cancellation window', a: 'Subscriptions and retainer plans may be cancelled within 15 days of payment. Requests after this window are not eligible for cancellation or refund.' },
  { q: '2. Refund timeline', a: 'Approved refunds are processed within 14 working days of the request being confirmed.' },
  { q: '3. Situations refunds do not cover', a: 'Turnaround time affected by government portal downtime or external factors; delays caused by the client not providing required documents on time; product listings rejected due to incorrect specifications supplied by the client; missing OEM authorisation codes or certifications the client was responsible for; and tender disqualification due to client non-compliance or missed deadlines.' },
  { q: '4. How to request a cancellation or refund', a: 'Email [insert refunds email] with your registered details and the reason for the request. Our team will confirm eligibility and next steps within 2 working days.' },
]

export default function Policies() {
  const [cms,setCms]=useState({})
  useEffect(()=>{api('/public/pages/policies').then(r=>setCms(r.page?.content||{})).catch(()=>{})},[])
  const toItems=(arr,fallback)=>Array.isArray(arr)&&arr.length?arr.map((x,i)=>({q:`${i+1}. ${x.split(':')[0]}`,a:x.includes(':')?x.slice(x.indexOf(':')+1).trim():x})):fallback
  const privacy=toItems(cms.privacy,privacyItems); const terms=toItems(cms.terms,termsItems); const refunds=toItems(cms.refund,refundItems)
  return (
    <>
      <div className="wrap pt-6 font-mono text-xs text-ink/50">
        <Link to="/" className="hover:text-ink">Home</Link> / Policies
      </div>

      <section className="pt-10 pb-14">
        <div className="wrap">
          <span className="eyebrow">{cms.eyebrow||'Legal'}</span>
          <h1 className="mt-4 font-display font-semibold text-[32px] sm:text-[40px] lg:text-[48px] leading-[1.08] text-ink">
            {cms.title||'Policies & the fine print'}
          </h1>
          <p className="mt-4 text-lg text-ink/70 max-w-[68ch]">
            Effective date: [Insert Date]. Placeholder legal text for review by counsel before publishing — replace bracketed fields with final details.
          </p>
          <div className="mt-6 flex gap-2.5 flex-wrap">
            <a href="#privacy" className="badge">Privacy Policy</a>
            <a href="#terms" className="badge">Terms &amp; Conditions</a>
            <a href="#refund" className="badge">Refund &amp; Cancellation</a>
          </div>
        </div>
      </section>

      {/* ============ PRIVACY ============ */}
      <section id="privacy" className="section">
        <div className="wrap">
          <span className="eyebrow">Policy 01</span>
          <h2 className="h2 mt-3 text-[24px] md:text-[32px]">Privacy Policy</h2>
          <p className="mt-3.5 text-ink/70 max-w-[70ch]">
            MA Creation (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) is committed to protecting your privacy. This policy explains how we collect, use and manage your information when you interact with this website or related services. It applies only to online interactions on the Site — offline services or those governed by a separate written agreement follow the terms of that agreement.
          </p>
          <div className="mt-9">
            <Accordion items={privacy} defaultOpen={0} />
          </div>
        </div>
      </section>

      {/* ============ TERMS ============ */}
      <section id="terms" className="bg-paper2 section">
        <div className="wrap">
          <span className="eyebrow">Policy 02</span>
          <h2 className="h2 mt-3 text-[24px] md:text-[32px]">Terms &amp; Conditions</h2>
          <p className="mt-3.5 text-ink/70 max-w-[70ch]">
            Effective date: [Insert Date]. By accessing or using this website or MA Creation&rsquo;s services, you agree to comply with these Terms. Please read carefully — if you do not agree, do not use our services.
          </p>
          <div className="mt-9">
            <Accordion items={terms} defaultOpen={0} />
          </div>
        </div>
      </section>

      {/* ============ REFUND ============ */}
      <section id="refund" className="section">
        <div className="wrap">
          <span className="eyebrow">Policy 03</span>
          <h2 className="h2 mt-3 text-[24px] md:text-[32px]">Refund &amp; Cancellation Policy</h2>
          <p className="mt-3.5 text-ink/70 max-w-[70ch]">
            This policy explains when a MA Creation subscription or service can be cancelled, how refunds are processed, and where refunds do not apply.
          </p>
          <div className="mt-9">
            <Accordion items={refunds} defaultOpen={0} />
          </div>

          <div className="mt-9 bg-accent/20 border border-goldlight rounded px-4.5 py-4 text-[13.5px] text-ink/70">
            <strong className="text-ink">Have a question about a specific order?</strong> Contact your assigned consultant directly, or reach our support desk —{' '}
            <a href="/#demo" className="text-gold2 underline">book a call here</a>.
          </div>
        </div>
      </section>
    </>
  )
}
