import { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import { faqItems } from './data'
import { HeroSection, GemOverviewSection, FeaturedIndustriesSection, ServicesOverviewSection, CertificationsSection, DemoSection, CaseFileSummarySection, IndustriesSection, DocumentationSection, PartnersSection, TrainingHubSection, TestimonialsSection, FaqSection, CtaBandSection, CustomerReviewsSection, WhyChooseGemSection } from './sections'

export default function HomePage() {
  const [cms, setCms] = useState({})
  const [faqs, setFaqs] = useState(faqItems)
  useEffect(() => {
    let active = true
    Promise.all([api('/public/pages/home'), api('/public/faqs')]).then(([p, f]) => {
      if (!active) return
      setCms(p.page?.content || {})
      if (f.faqs?.length) setFaqs(f.faqs.map(x => ({ q: x.question, a: x.answer })))
    }).catch(() => {})
    return () => { active = false }
  }, [])
  const stats = cms.stats || []
  const industries = cms.industries || []
  return <>
    <HeroSection cms={cms} />
    <GemOverviewSection cms={cms} />
    <FeaturedIndustriesSection cms={cms} />
    <ServicesOverviewSection cms={cms} />
    <CertificationsSection cms={cms} />
      <WhyChooseGemSection cms={cms} />
    {/* <CustomerReviewsSection /> */}
    <DemoSection cms={cms} />
    <CaseFileSummarySection cms={cms} stats={stats} />
    <IndustriesSection cms={cms} industries={industries} />
    <DocumentationSection cms={cms} />
    <PartnersSection cms={cms} />
    <TrainingHubSection cms={cms} />
    <TestimonialsSection cms={cms} />
    <FaqSection cms={cms} faqs={faqs} />
    <CtaBandSection cms={cms} />
  </>
}
