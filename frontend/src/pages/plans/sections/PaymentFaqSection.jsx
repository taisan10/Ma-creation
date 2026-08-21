import Accordion from '../../../components/Accordion'
import { paymentFaq } from '../data'
export default function PaymentFaqSection(){return <section data-font-section="plans.faq" className="section"><div className="wrap max-w-[900px]"><span className="eyebrow">Payment FAQ</span><h2 className="h2 mt-3">Buying a package</h2><div className="mt-8"><Accordion items={paymentFaq}/></div></div></section>}
