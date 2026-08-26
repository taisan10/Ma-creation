import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { api, getUser } from '../../lib/api'
import { PlansHero, RetainerSection, ServicePackagesSection, TrainingPackagesSection, TrustBuilderSection, PaymentFaqSection } from './sections'

export default function PlansPage() {
  const [plans, setPlans] = useState([])
  const [cms, setCms] = useState({})
  const [purchasedByPlan, setPurchasedByPlan] = useState({})

  useEffect(() => {
    let active = true
    api('/catalog/plans').then(d => { if (active) setPlans(d.plans || []) }).catch(() => {})
    api('/public/pages/plans').then(r => { if (active) setCms(r.page?.content || {}) }).catch(() => {})
    // Only logged-in users can be matched against a paid purchase, so guests
    // simply see the normal "Buy Now" state.
    if (getUser()) {
      api('/payments/mine').then(d => {
        if (!active || !Array.isArray(d.payments)) return
        const byPlan = {}
        d.payments.forEach(payment => {
          if (payment.status !== 'paid' || !payment.plan?._id) return
          const existing = byPlan[payment.plan._id]
          if (!existing || new Date(payment.createdAt) > new Date(existing.createdAt)) byPlan[payment.plan._id] = payment
        })
        setPurchasedByPlan(byPlan)
      }).catch(() => {})
    }
    return () => { active = false }
  }, [])

  const training = plans.filter(p => p.category === 'training')
  const service = plans.filter(p => p.category === 'service')

  return (
    <>
      <div className="wrap pt-6 font-mono text-xs text-ink/50"><Link to="/">Home</Link> / Plans & Pricing</div>
      <PlansHero cms={cms} />
      <RetainerSection cms={cms} />
      <ServicePackagesSection plans={service} cms={cms} purchasedByPlan={purchasedByPlan} />
      <TrainingPackagesSection plans={training} cms={cms} purchasedByPlan={purchasedByPlan} />
      <TrustBuilderSection />
      <PaymentFaqSection />
    </>
  )
}
