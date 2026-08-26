import { useEffect, useState } from 'react'
import { BookOpen, Download, ExternalLink, FileText, Loader2 } from 'lucide-react'
import { api } from '../../../lib/api'

const FALLBACK_COVER = '/assets/gem-book-cover.png'

function Book3D({ cover }) {
  return (
    <div className="book-stage" aria-label="3D GeM guide book preview">
      <div className="book-glow" />
      <div className="book-3d">
        <div className="book-cover-face">
          <img src={cover || FALLBACK_COVER} alt="GeM Government e-Marketplace guide cover" />
        </div>
        <div className="book-spine"><span>GeM GUIDE</span></div>
        <div className="book-pages" />
        <div className="book-back" />
      </div>
    </div>
  )
}

export default function ServiceHero({ cms = {} }) {
  const [book, setBook] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    api('/public/books')
      .then(response => { if (active) setBook(response.book || null) })
      .catch(() => { if (active) setBook(null) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const cover = book?.coverImageUrl || FALLBACK_COVER
  const heroTitle = cms.bookTitle || 'The GeM guide your business can actually use.'
  const heroIntro = cms.bookIntro || 'Download the complete Government e-Marketplace step-by-step guide covering registration, product listing, bidding, orders, invoicing, growth strategies and compliance.'
  const readUrl = book?.readUrl ? `${book.readUrl}` : ''
  const downloadUrl = book?.downloadUrl ? `${book.downloadUrl}` : ''

  return (
    <section data-font-section="services.hero" className="relative overflow-hidden border-b border-border bg-paper2 pt-10 pb-14 lg:pt-14 lg:pb-20">
      <div className="wrap">
        <div className="grid lg:grid-cols-[1.05fr_.95fr] items-center gap-10 lg:gap-14">
          <div>
            <span className="eyebrow">{cms.eyebrow || 'GeM Knowledge Library'}</span>
            <h1 className="mt-4 font-display font-semibold text-[34px] sm:text-[44px] lg:text-[56px] leading-[1.04] text-text max-w-[12ch]">
              {heroTitle}
            </h1>
            <p className="mt-5 text-lg text-muted max-w-[64ch]">
              {heroIntro}
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              {downloadUrl ? (
                <a href={downloadUrl} className="btn-gold inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg font-semibold shadow-sm" download>
                  <Download size={18} /> Download Now
                </a>
              ) : (
                <span className="inline-flex items-center gap-2 px-5 py-3 rounded-lg font-semibold bg-ink/10 text-ink/45 cursor-not-allowed">
                  {loading ? <Loader2 size={18} className="animate-spin" /> : <FileText size={18} />}
                  {loading ? 'Checking book…' : 'Book coming soon'}
                </span>
              )}
              {readUrl && (
                <a href={readUrl} target="_blank" rel="noreferrer" className="btn-outline inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg">
                  <BookOpen size={18} /> Read Online <ExternalLink size={14} />
                </a>
              )}
            </div>

            <div className="mt-6 flex flex-wrap gap-3 text-xs text-muted">
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-2"><FileText size={14} /> PDF Guide</span>
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-2"><BookOpen size={14} /> Step-by-step</span>
              {book?.size ? <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-2">{(book.size / 1024 / 1024).toFixed(1)} MB</span> : null}
            </div>
          </div>

          <div className="min-h-[420px] grid place-items-center">
            <Book3D cover={cover} />
          </div>
        </div>
      </div>
    </section>
  )
}
