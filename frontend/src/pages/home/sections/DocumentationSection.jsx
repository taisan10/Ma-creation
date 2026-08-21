

export default function DocumentationSection({ cms = {}, faqs = [], stats = [], industries = [] }) {
  return (

      <section data-font-section="home.documentation" className="section">
        <div className="wrap grid grid-cols-1 md:grid-cols-2 gap-12">
          <div>
            <span className="eyebrow">Documentation</span>
            <h3 className="mt-3 font-display text-2xl">For seller registration</h3>
            <div>
              {[
                'PAN Card / Aadhaar Card of key person & entity',
                'Email ID and mobile number linked with Aadhaar',
                'GST registration certificate',
                'Cancelled cheque copy',
                'MSME / ISO / NSIC / Trademark registration (if OEM)',
                'ITR of last 3 years (optional)',
                'Proof of government work experience (optional)',
              ].map((d, i) => (
                <div key={d} className="doc-item">
                  <span className="doc-idx">{String(i + 1).padStart(2, '0')}</span>
                  <span>{d}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <span className="eyebrow">Documentation</span>
            <h3 className="mt-3 font-display text-2xl">For buyer registration</h3>
            <div>
              {[
                'Aadhaar card of HOD, buyer, consignee & PAO',
                'Mobile numbers of all members (Aadhaar-linked)',
                'Email IDs of all users',
                'Organisation details — department & ministry name',
                'Complete office address with pin code & landline',
              ].map((d, i) => (
                <div key={d} className="doc-item">
                  <span className="doc-idx">{String(i + 1).padStart(2, '0')}</span>
                  <span>{d}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      
  )
}
