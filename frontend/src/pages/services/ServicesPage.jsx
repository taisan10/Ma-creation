import { Link } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { api } from '../../lib/api'
import { ServiceHero, ServiceCatalogSection, ServicePillarsSection, ServiceDocumentsSection } from './sections'

export default function ServicesPage() {
  const [cms, setCms] = useState({})
  const [services, setServices] = useState([])
  const [plans, setPlans] = useState([])
  const [error, setError] = useState('')
  const [catalogError, setCatalogError] = useState('')

  useEffect(() => {
    let active = true

    Promise.allSettled([
      api('/public/pages/services'),
      api('/catalog/services'),
      api('/catalog/plans'),
    ]).then(([pageResult, servicesResult, plansResult]) => {
      if (!active) return

      if (pageResult.status === 'fulfilled') {
        setCms(pageResult.value.page?.content || {})
      } else {
        setError(pageResult.reason?.message || 'Could not load the Services page content.')
      }

      const catalogMessages = []

      if (servicesResult.status === 'fulfilled') {
        setServices(Array.isArray(servicesResult.value.services) ? servicesResult.value.services : [])
      } else {
        catalogMessages.push(servicesResult.reason?.message || 'Services catalog is unavailable.')
      }

      if (plansResult.status === 'fulfilled') {
        setPlans(Array.isArray(plansResult.value.plans) ? plansResult.value.plans : [])
      } else {
        catalogMessages.push(plansResult.reason?.message || 'Plans catalog is unavailable.')
      }

      setCatalogError(catalogMessages.join(' '))
    })

    return () => { active = false }
  }, [])

  const registration = useMemo(() => services.filter(x => x.category === 'registration'), [services])
  const oem = useMemo(() => services.filter(x => x.category === 'oem'), [services])
  const addon = useMemo(() => services.filter(x => x.category === 'addon'), [services])
  const packagePlans = useMemo(() => plans.filter(x => x.category === 'service'), [plans])

  return (
    <>
      <div className="wrap pt-6 font-mono text-xs text-muted"><Link to="/">Home</Link> / Services</div>
      <ServiceHero cms={cms} />
      {error && <div className="wrap pt-5 text-danger text-sm">Could not load the page content: {error}</div>}
      {catalogError && (
        <div className="wrap pt-5">
          <div className="rounded-xl border border-danger/20 bg-danger/5 px-4 py-3 text-danger text-sm">
            Could not load the live catalog. {catalogError} Start the backend API and make sure MongoDB is connected.
          </div>
        </div>
      )}
      <ServiceCatalogSection registration={registration} oem={oem} addon={addon} packagePlans={packagePlans} />
      <ServicePillarsSection cms={cms} />
      <ServiceDocumentsSection cms={cms} />
    </>
  )
}
