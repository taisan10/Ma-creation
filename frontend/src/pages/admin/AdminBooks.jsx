import { useEffect, useRef, useState } from 'react'
import { BookOpen, Download, FileText, RefreshCw, Trash2, Upload } from 'lucide-react'
import AdminShell from '../../components/admin/AdminShell'
import { api } from '../../lib/api'

const API_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '')

export default function AdminBooks() {
  const [books, setBooks] = useState([])
  const [title, setTitle] = useState('GeM Government e-Marketplace Portal — The Ultimate Step-by-Step Guide')
  const [description, setDescription] = useState('A practical guide covering registration, product listing, bidding, orders, invoicing, growth strategies and compliance.')
  const [file, setFile] = useState(null)
  const [active, setActive] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const inputRef = useRef(null)

  async function load() {
    try {
      const response = await api('/admin/books')
      setBooks(Array.isArray(response.books) ? response.books : [])
    } catch (e) { setError(e.message) }
  }

  useEffect(() => { load() }, [])

  async function upload(e) {
    e.preventDefault()
    setError(''); setMessage('')
    if (!file) return setError('Please choose the PDF book file.')
    if (file.type !== 'application/pdf') return setError('Only PDF files are supported.')
    if (file.size > 50 * 1024 * 1024) return setError('Maximum PDF size is 50 MB.')

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('title', title)
      formData.append('description', description)
      formData.append('filename', file.name)
      formData.append('coverImageUrl', '/assets/gem-book-cover.png')
      formData.append('active', String(active))
      formData.append('file', file, file.name)

      const response = await api('/admin/books/upload', {
        method: 'POST',
        body: formData,
        retry: false,
      })
      const data = response
      setMessage('Book uploaded successfully. The public Services hero will now use this book.')
      setFile(null)
      if (inputRef.current) inputRef.current.value = ''
      await load()
    } catch (e) { setError(e.message) } finally { setLoading(false) }
  }

  async function toggle(book) {
    try {
      await api(`/admin/books/${book._id}`, { method: 'PATCH', body: JSON.stringify({ active: !book.active }) })
      await load()
    } catch (e) { setError(e.message) }
  }

  async function remove(book) {
    if (!confirm(`Delete "${book.title}" and its stored PDF?`)) return
    try {
      await api(`/admin/books/${book._id}`, { method: 'DELETE' })
      setMessage('Book deleted.')
      await load()
    } catch (e) { setError(e.message) }
  }

  return (
    <AdminShell>
      <div className="flex flex-wrap justify-between gap-4">
        <div>
          <div className="eyebrow">Digital Library</div>
          <h1 className="h2 mt-2">GeM Books</h1>
          <p className="mt-2 text-muted max-w-2xl">Upload the official PDF guide here. Files are stored in MongoDB GridFS, so the same storage layer works with local MongoDB now and MongoDB Atlas later.</p>
        </div>
        <button className="btn-outline btn-sm inline-flex items-center gap-2" onClick={load}><RefreshCw size={15} />Refresh</button>
      </div>

      {message && <p className="mt-5 rounded-lg bg-success/10 border border-success/20 text-success text-sm px-4 py-3">{message}</p>}
      {error && <p className="mt-5 rounded-lg bg-danger/10 border border-danger/20 text-danger text-sm px-4 py-3">{error}</p>}

      <div className="grid xl:grid-cols-[1.1fr_.9fr] gap-6 mt-7">
        <form className="card" onSubmit={upload}>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gold/10 text-gold grid place-items-center"><Upload size={20} /></div>
            <div><h2 className="font-display text-xl">Upload a book</h2><p className="text-xs text-muted mt-1">PDF only · maximum 50 MB</p></div>
          </div>

          <label className="field-label mt-6">Book title</label>
          <input className="field-input" value={title} onChange={e => setTitle(e.target.value)} maxLength={180} required />
          <label className="field-label mt-4">Description</label>
          <textarea className="field-input min-h-[120px]" value={description} onChange={e => setDescription(e.target.value)} maxLength={2000} />
          <label className="field-label mt-4">PDF file</label>
          <input ref={inputRef} type="file" accept="application/pdf,.pdf" onChange={e => setFile(e.target.files?.[0] || null)} className="block w-full text-sm" required />

          <label className="mt-4 flex items-center gap-3 text-sm">
            <input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} /> Publish immediately on Services page
          </label>

          {file && <div className="mt-4 rounded-lg border border-border bg-paper2 px-4 py-3 text-sm flex items-center gap-3"><FileText size={18} /><span className="min-w-0 truncate">{file.name}</span><span className="text-muted ml-auto">{(file.size / 1024 / 1024).toFixed(1)} MB</span></div>}
          <button className="btn-gold btn-sm mt-5 inline-flex items-center gap-2" disabled={loading}>{loading ? 'Uploading…' : 'Upload Book'}</button>
        </form>

        <div className="card">
          <h2 className="font-display text-xl">How it works</h2>
          <div className="mt-5 space-y-4 text-sm text-muted">
            <p><b className="text-ink">1. Admin uploads PDF</b><br />The PDF is streamed into MongoDB GridFS instead of being kept as a fragile local upload.</p>
            <p><b className="text-ink">2. Public hero updates</b><br />The Services page reads the latest active book record from the API.</p>
            <p><b className="text-ink">3. Read online</b><br />The browser receives the PDF with <code>inline</code> disposition so visitors can read it in the built-in PDF viewer.</p>
            <p><b className="text-ink">4. Download</b><br />The Download Now button uses the same protected storage stream with <code>attachment</code> disposition.</p>
          </div>
        </div>
      </div>

      <div className="card mt-6">
        <div className="flex items-center justify-between gap-3"><div><h2 className="font-display text-xl">Uploaded books</h2><p className="text-xs text-muted mt-1">Only active books appear publicly.</p></div><BookOpen size={20} /></div>
        <div className="mt-5 space-y-3">
          {books.length === 0 ? <p className="text-sm text-muted">No book uploaded yet.</p> : books.map(book => (
            <div key={book._id} className="border border-border rounded-xl p-4 flex flex-col md:flex-row md:items-center gap-4">
              <img src={book.coverImageUrl || '/assets/gem-book-cover.png'} alt="" className="w-16 h-20 object-cover rounded shadow-sm" />
              <div className="min-w-0 flex-1"><b className="text-sm block truncate">{book.title}</b><span className="text-xs text-muted">{book.filename} · {(book.size / 1024 / 1024).toFixed(1)} MB · {book.downloads || 0} downloads</span></div>
              <div className="flex flex-wrap gap-2">
                <a href={`${API_URL}/public/books/${book._id}/read`} target="_blank" rel="noreferrer" className="btn-outline btn-sm inline-flex items-center gap-2"><BookOpen size={14} />Read</a>
                <a href={`${API_URL}/public/books/${book._id}/download`} className="btn-outline btn-sm inline-flex items-center gap-2"><Download size={14} />Download</a>
                <button className="btn-outline btn-sm" onClick={() => toggle(book)}>{book.active ? 'Hide' : 'Publish'}</button>
                <button className="btn-outline btn-sm text-rust inline-flex items-center gap-2" onClick={() => remove(book)}><Trash2 size={14} />Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminShell>
  )
}
