import Accordion from '../../../components/Accordion'

export default function FaqSection({ cms = {}, faqs = [], stats = [], industries = [] }) {
  return (

      <section data-font-section="home.faq" id="faq" className="bg-paper2 section">
        <div className="wrap">
          <div className="max-w-[640px] mb-12">
            <span className="eyebrow">FAQ</span>
            <h2 className="h2 mt-3">Frequently asked questions</h2>
            <p className="lede mt-4">Answers to what people usually ask about MA Creation&rsquo;s GeM services, training and support.</p>
          </div>
          <Accordion items={faqs} defaultOpen={-1} />
        </div>
      </section>

      
  )
}
