import { Link } from 'react-router-dom'
import {
  ArrowRight,
  ArrowUpRight,
  Award,
  Building2,
  FileCheck2,
  FileText,
  IndianRupee,
  PackageCheck,
  ShieldCheck,
} from 'lucide-react'
import CountUp from '../../../components/CountUp'

const DEFAULT_STATS = [
  {
    type: 'clients',
    value: '500+',
    label: 'Happy Clients / Partners',
    detail: 'Registered GeM sellers, MSMEs, OEMs, and institutional buyers across India',
  },
  {
    type: 'business',
    value: '₹50 Cr+',
    label: 'Business Executed on GeM',
    detail: 'Cumulative procurement value across direct orders, L1 tenders, and reverse auctions',
  },
  {
    type: 'brands',
    value: '200+',
    label: 'Brands Registered',
    detail: 'Trademark and OEM authorization panels verified for compliant GeM selling',
  },
  {
    type: 'products',
    value: '5,000+',
    label: 'Products Published',
    detail: 'Catalog listings, technical specs, and QCs maintained without rejection delays',
  },
]

function inferDetail(item) {
  if (item.detail) return item.detail
  const text = `${item.type || ''} ${item.label || ''}`.toLowerCase()
  if (text.includes('client') || text.includes('partner')) {
    return 'Registered GeM sellers, MSMEs, and institutional partners supported across India'
  }
  if (text.includes('business') || text.includes('order') || text.includes('cr')) {
    return 'Cumulative procurement value across direct orders, tenders, and reverse auctions'
  }
  if (text.includes('brand') || text.includes('oem')) {
    return 'OEM brand panels and trademark approvals cleared for GeM catalog publishing'
  }
  if (text.includes('product') || text.includes('catalog') || text.includes('listing')) {
    return 'Compliant SKU listings and technical specifications live on the GeM portal'
  }
  return 'Audited operational milestone maintained across active client accounts'
}

function resolveStatIcon(item) {
  const key = `${item.type || ''} ${item.label || ''}`.toLowerCase()
  if (key.includes('business') || key.includes('cr') || key.includes('order') || key.includes('value')) {
    return IndianRupee
  }
  if (key.includes('client') || key.includes('partner')) {
    return Building2
  }
  if (key.includes('brand') || key.includes('oem')) {
    return Award
  }
  if (key.includes('product') || key.includes('catalog') || key.includes('listing')) {
    return PackageCheck
  }
  return FileCheck2
}

export default function CaseFileSummarySection({ cms = {}, stats = [] }) {
  const items = Array.isArray(stats) && stats.length ? stats : DEFAULT_STATS

  // Highlight the procurement/order-value milestone in the lead dossier pane when present.
  const leadIndex = Math.max(
    0,
    items.findIndex((item) =>
      /business|executed|cr|value|order/i.test(`${item.type || ''} ${item.label || ''} ${item.value || item.num || ''}`)
    )
  )
  const leadItem = items[leadIndex] || items[0]
  const ledgerItems = items.filter((_, idx) => idx !== leadIndex)
  const LeadIcon = resolveStatIcon(leadItem)

  const title = cms.caseFileTitle || cms.recordTitle || 'Proven GeM filing & execution record'
  const summary =
    cms.caseFileText ||
    cms.recordText ||
    'Every client engagement is maintained as a structured compliance file—from initial GeM registration and brand approval to live tender participation.'
  const scopeLabel = cms.recordScope || 'Pan-India seller, buyer & OEM operations'

  return (
    <section
      data-font-section="home.caseFileSummary"
      id="record"
      aria-labelledby="record-heading"
      className="casefile-record bg-paper py-14 md:py-20 scroll-mt-20 md:scroll-mt-24 border-t border-ink/10"
    >
      <div className="wrap">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
          <div className="max-w-[640px]">
            <h2
              id="record-heading"
              className="h2 tracking-[-0.02em] text-balance"
            >
              {title}
            </h2>
            <p className="mt-3 text-[15.5px] leading-relaxed text-ink/75 max-w-[54ch] text-pretty">
              {summary}
            </p>
          </div>

          <a
            href="#demo"
            className="inline-flex items-center gap-2 self-start lg:self-end rounded-lg border border-ink/25 bg-card px-4 py-2.5 min-h-[44px] text-sm font-semibold text-primaryDark hover:border-primary/50 hover:bg-primary/[0.04] transition-colors shrink-0"
          >
            <span>Start your GeM case file</span>
            <ArrowUpRight className="w-4 h-4 shrink-0" aria-hidden="true" />
          </a>
        </div>

        <div className="rounded-2xl border border-ink/20 bg-card overflow-hidden shadow-[0_1px_2px_rgba(11,31,58,0.05),0_18px_40px_-22px_rgba(11,31,58,0.18)]">
          {/* Dossier Reference Header */}
          <div className="bg-paper2/60 border-b border-ink/15 px-5 sm:px-7 py-3 flex flex-wrap items-center justify-between gap-2">
            <div className="inline-flex items-center gap-2.5 min-w-0">
              <span className="h-2 w-2 rounded-full bg-secondary shrink-0" aria-hidden="true" />
              <FileText className="w-3.5 h-3.5 text-ink/70 shrink-0" aria-hidden="true" />
              <span className="font-['IBM_Plex_Mono',monospace] text-[11.5px] font-medium uppercase tracking-[0.14em] text-ink/80">
                MAC / GeM Case Record
              </span>
            </div>
            <span className="text-xs font-medium text-ink/75">{scopeLabel}</span>
          </div>

          {/* Asymmetric 2-Zone Dossier Body */}
          <div
            className={`grid grid-cols-1 ${
              ledgerItems.length ? 'lg:grid-cols-[0.9fr_1.1fr]' : ''
            }`}
          >
            {/* Lead Outcome Pane */}
            <div
              className={`bg-paper2/35 p-6 sm:p-8 flex flex-col justify-between gap-6 ${
                ledgerItems.length ? 'border-b lg:border-b-0 lg:border-r border-ink/15' : ''
              }`}
            >
              <div>
                <div className="inline-flex items-center gap-2 rounded-lg border border-ink/15 bg-card px-3 py-1.5 text-[13px] font-semibold text-primaryDark">
                  <LeadIcon className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>{leadItem.label}</span>
                </div>

                <div className="mt-5">
                  <CountUp
                    value={leadItem.value || leadItem.num}
                    className="block font-semibold text-[40px] sm:text-[48px] leading-none tracking-[-0.03em] text-ink"
                  />
                  <p className="mt-3 text-[14px] leading-relaxed text-ink/75 max-w-[38ch]">
                    {inferDetail(leadItem)}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-ink/15 flex flex-wrap items-center justify-between gap-3 text-[13px]">
                <span className="inline-flex items-center gap-1.5 text-ink/75">
                  <ShieldCheck className="w-4 h-4 text-secondary shrink-0" aria-hidden="true" />
                  <span>GeM portal compliant workflows</span>
                </span>
                <Link
                  to="/plans"
                  className="inline-flex items-center gap-1 font-semibold text-primaryDark hover:text-primary underline-offset-4 hover:underline"
                >
                  <span>Compare retainer plans</span>
                  <ArrowRight className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                </Link>
              </div>
            </div>

            {/* Itemized Verification Ledger */}
            {ledgerItems.length > 0 && (
              <dl className="divide-y divide-ink/15">
                {ledgerItems.map((item, idx) => {
                  const Icon = resolveStatIcon(item)
                  return (
                    <div
                      key={item.label || idx}
                      className="px-5 py-5 sm:px-7 sm:py-6 flex flex-wrap sm:flex-nowrap items-center justify-between gap-4 hover:bg-paper/55 transition-colors"
                    >
                      <div className="flex items-start gap-3.5 min-w-0">
                        <span className="w-10 h-10 rounded-xl border border-ink/15 bg-paper text-secondaryDark flex items-center justify-center shrink-0 mt-0.5">
                          <Icon className="w-[18px] h-[18px]" aria-hidden="true" />
                        </span>
                        <div className="min-w-0">
                          <dt className="text-[15px] font-semibold text-ink leading-snug">
                            {item.label}
                          </dt>
                          <dd className="text-[13px] text-ink/75 leading-snug mt-1 max-w-[40ch]">
                            {inferDetail(item)}
                          </dd>
                        </div>
                      </div>

                      <dd className="shrink-0 pl-[54px] sm:pl-0">
                        <CountUp
                          value={item.value || item.num}
                          className="font-semibold text-[26px] sm:text-[30px] leading-none tracking-[-0.02em] text-ink"
                        />
                      </dd>
                    </div>
                  )
                })}
              </dl>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
