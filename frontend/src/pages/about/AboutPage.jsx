import { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import { AboutHeroSection, StorySection, FounderSection, MissionVisionSection, WhyDifferentSection, HowWeWorkSection, CapabilityMapSection, ClientOutcomesSection, GemJourneySection, AiAdvantageSection, AiRoadmapSection, CertificationsCtaSection } from './sections'

export default function AboutPage() {
  const [cms, setCms] = useState({})
  useEffect(() => {
    let active = true
    api('/public/pages/about').then(r => { if (active) setCms(r.page?.content || {}) }).catch(() => {})
    return () => { active = false }
  }, [])
  return <>
    <AboutHeroSection cms={cms} />
    <StorySection cms={cms} /><FounderSection cms={cms} /><MissionVisionSection cms={cms} /><WhyDifferentSection cms={cms} /><HowWeWorkSection cms={cms} /><CapabilityMapSection cms={cms} /><ClientOutcomesSection cms={cms} /><GemJourneySection cms={cms} /><AiAdvantageSection cms={cms} /><AiRoadmapSection cms={cms} /><CertificationsCtaSection cms={cms} />
  </>
}
