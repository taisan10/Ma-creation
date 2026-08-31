import { useEffect, useRef, useState } from 'react'
import { Boxes, FolderPlus, Layers, RefreshCw, Trash2, Upload, Video as VideoIcon } from 'lucide-react'
import AdminShell from '../../components/admin/AdminShell'
import { api } from '../../lib/api'

export default function AdminCourses() {
  const [categories, setCategories] = useState([])
  const [plans, setPlans] = useState([])
  const [courses, setCourses] = useState([])
  const [videos, setVideos] = useState([])
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  async function loadAll() {
    try {
      const [catRes, planRes, courseRes] = await Promise.all([
        api('/admin/lms/categories'),
        api('/catalog/plans'), // existing public endpoint, no need for a new one just to list plans
        api('/admin/lms/courses')
      ])
      setCategories(catRes.categories || [])
      setPlans(planRes.plans || [])
      setCourses(courseRes.courses || [])
    } catch (e) { setError(e.message) }
  }

  useEffect(() => { loadAll() }, [])

  return (
    <AdminShell>
      <div className="flex flex-wrap justify-between gap-4">
        <div>
          <div className="eyebrow">Learning Management</div>
          <h1 className="h2 mt-2">Courses & Videos</h1>
          <p className="mt-2 text-muted max-w-2xl">
            Manage categories, link courses to a paid plan, and upload video lessons -- videos are streamed
            straight into MinIO, never held fully in server memory.
          </p>
        </div>
        <button className="btn-outline btn-sm inline-flex items-center gap-2" onClick={loadAll}>
          <RefreshCw size={15} />Refresh
        </button>
      </div>

      {message && <p className="mt-5 rounded-lg bg-success/10 border border-success/20 text-success text-sm px-4 py-3">{message}</p>}
      {error && <p className="mt-5 rounded-lg bg-danger/10 border border-danger/20 text-danger text-sm px-4 py-3">{error}</p>}

      <div className="grid xl:grid-cols-2 gap-6 mt-7">
        <CategoryPanel categories={categories} onDone={loadAll} setMessage={setMessage} setError={setError} />
        <CoursePanel categories={categories} plans={plans} courses={courses} onDone={loadAll} setMessage={setMessage} setError={setError} />
      </div>

      <div className="mt-6">
        <VideoPanel courses={courses} videos={videos} setVideos={setVideos} setMessage={setMessage} setError={setError} />
      </div>
    </AdminShell>
  )
}

// ============================================================
// Category create + list
// ============================================================
function CategoryPanel({ categories, onDone, setMessage, setError }) {
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setError(''); setMessage('')
    setLoading(true)
    try {
      await api('/admin/lms/categories', { method: 'POST', body: JSON.stringify({ name, slug }) })
      setMessage(`Category "${name}" created.`)
      setName(''); setSlug('')
      await onDone()
    } catch (e) { setError(e.message) } finally { setLoading(false) }
  }

  return (
    <div className="card">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-gold/10 text-gold grid place-items-center"><FolderPlus size={20} /></div>
        <div><h2 className="font-display text-xl">Categories</h2><p className="text-xs text-muted mt-1">Groups courses for display, e.g. "GeM Registration"</p></div>
      </div>

      <form onSubmit={submit} className="mt-6">
        <label className="field-label">Name</label>
        <input className="field-input" value={name} onChange={e => setName(e.target.value)} placeholder="GeM Registration" required />
        <label className="field-label mt-4">Slug</label>
        <input className="field-input" value={slug} onChange={e => setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))} placeholder="gem-registration" required />
        <button className="btn-gold btn-sm mt-5" disabled={loading}>{loading ? 'Saving…' : 'Add Category'}</button>
      </form>

      <div className="mt-6 space-y-2">
        {categories.length === 0 ? <p className="text-sm text-muted">No categories yet.</p> : categories.map(cat => (
          <div key={cat._id} className="border border-border rounded-lg px-4 py-2.5 text-sm flex justify-between">
            <span>{cat.name}</span><span className="text-muted">{cat.slug}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ============================================================
// Course create + list
// ============================================================
function CoursePanel({ categories, plans, courses, onDone, setMessage, setError }) {
  const [category, setCategory] = useState('')
  const [plan, setPlan] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setError(''); setMessage('')
    if (!category || !plan) return setError('Choose both a category and a plan.')
    setLoading(true)
    try {
      await api('/admin/lms/courses', { method: 'POST', body: JSON.stringify({ category, plan, title, description }) })
      setMessage(`Course "${title}" created.`)
      setTitle(''); setDescription('')
      await onDone()
    } catch (e) { setError(e.message) } finally { setLoading(false) }
  }

  return (
    <div className="card">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-gold/10 text-gold grid place-items-center"><Layers size={20} /></div>
        <div><h2 className="font-display text-xl">Courses</h2><p className="text-xs text-muted mt-1">Each course is unlocked by exactly one plan</p></div>
      </div>

      <form onSubmit={submit} className="mt-6">
        <label className="field-label">Category</label>
        <select className="field-input" value={category} onChange={e => setCategory(e.target.value)} required>
          <option value="">Select category…</option>
          {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>

        <label className="field-label mt-4">Unlocking plan</label>
        <select className="field-input" value={plan} onChange={e => setPlan(e.target.value)} required>
          <option value="">Select plan…</option>
          {plans.map(p => <option key={p._id} value={p._id}>{p.name} — ₹{p.price}</option>)}
        </select>

        <label className="field-label mt-4">Course title</label>
        <input className="field-input" value={title} onChange={e => setTitle(e.target.value)} required />
        <label className="field-label mt-4">Description</label>
        <textarea className="field-input min-h-[90px]" value={description} onChange={e => setDescription(e.target.value)} />

        <button className="btn-gold btn-sm mt-5" disabled={loading}>{loading ? 'Saving…' : 'Add Course'}</button>
      </form>

      <div className="mt-6 space-y-2">
        {courses.length === 0 ? <p className="text-sm text-muted">No courses yet.</p> : courses.map(course => (
          <div key={course._id} className="border border-border rounded-lg px-4 py-2.5 text-sm flex justify-between items-center gap-2">
            <span className="truncate">{course.title}</span>
            <span className="text-muted text-xs shrink-0">{course.category?.name} · {course.plan?.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ============================================================
// Video: two-step create (metadata JSON) + upload (multipart, field "video")
// ============================================================
function VideoPanel({ courses, videos, setVideos, setMessage, setError }) {
  const [course, setCourse] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef(null)

  async function loadVideos(courseId) {
    if (!courseId) return setVideos([])
    try {
      const res = await api(`/admin/lms/videos?courseId=${courseId}`)
      setVideos(res.videos || [])
    } catch (e) { setError(e.message) }
  }

  useEffect(() => { loadVideos(course) }, [course])

  async function submit(e) {
    e.preventDefault()
    setError(''); setMessage('')
    if (!course) return setError('Choose a course first.')
    if (!file) return setError('Choose a video file.')

    setUploading(true)
    try {
      // Step 1: create the metadata record (JSON, no file yet) -- see Part 3.
      const created = await api('/admin/lms/videos', {
        method: 'POST',
        body: JSON.stringify({ course, title, description })
      })
      const videoId = created.video._id

      // Step 2: stream the actual file into MinIO. Field name MUST be
      // "video" -- this is exactly what middleware/streamUpload.js (Part 3)
      // looks for; anything else gets silently ignored by that middleware.
      const formData = new FormData()
      formData.append('video', file, file.name)

      await api(`/admin/lms/videos/${videoId}/upload`, {
        method: 'POST',
        body: formData,
        retry: false
      })

      setMessage(`Video "${title}" uploaded and published.`)
      setTitle(''); setDescription(''); setFile(null)
      if (inputRef.current) inputRef.current.value = ''
      await loadVideos(course)
    } catch (e) { setError(e.message) } finally { setUploading(false) }
  }

  async function remove(video) {
    if (!confirm(`Delete "${video.title}" and its stored video file?`)) return
    try {
      await api(`/admin/lms/videos/${video._id}`, { method: 'DELETE' })
      setMessage('Video deleted.')
      await loadVideos(course)
    } catch (e) { setError(e.message) }
  }

  return (
    <div className="card">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-gold/10 text-gold grid place-items-center"><Upload size={20} /></div>
        <div><h2 className="font-display text-xl">Upload a video</h2><p className="text-xs text-muted mt-1">Streams directly into MinIO -- large files never sit fully in server memory</p></div>
      </div>

      <form onSubmit={submit} className="mt-6 grid md:grid-cols-2 gap-4">
        <div>
          <label className="field-label">Course</label>
          <select className="field-input" value={course} onChange={e => setCourse(e.target.value)} required>
            <option value="">Select course…</option>
            {courses.map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
          </select>
          <label className="field-label mt-4">Video title</label>
          <input className="field-input" value={title} onChange={e => setTitle(e.target.value)} required />
          <label className="field-label mt-4">Description</label>
          <textarea className="field-input min-h-[80px]" value={description} onChange={e => setDescription(e.target.value)} />
        </div>
        <div>
          <label className="field-label">Video file (MP4/WebM/MOV)</label>
          <input
            ref={inputRef}
            type="file"
            accept="video/mp4,video/webm,video/quicktime"
            onChange={e => setFile(e.target.files?.[0] || null)}
            className="block w-full text-sm"
            required
          />
          {file && (
            <div className="mt-4 rounded-lg border border-border bg-paper2 px-4 py-3 text-sm flex items-center gap-3">
              <VideoIcon size={18} />
              <span className="min-w-0 truncate">{file.name}</span>
              <span className="text-muted ml-auto">{(file.size / 1024 / 1024).toFixed(1)} MB</span>
            </div>
          )}
          <button className="btn-gold btn-sm mt-5" disabled={uploading}>
            {uploading ? 'Uploading… (large files take a while)' : 'Upload Video'}
          </button>
        </div>
      </form>

      <div className="mt-6">
        <div className="flex items-center gap-2 text-sm text-muted mb-3"><Boxes size={15} />Videos in selected course</div>
        <div className="space-y-2">
          {!course ? <p className="text-sm text-muted">Select a course above to see its videos.</p>
            : videos.length === 0 ? <p className="text-sm text-muted">No videos uploaded yet for this course.</p>
              : videos.map(video => (
                <div key={video._id} className="border border-border rounded-lg px-4 py-2.5 text-sm flex justify-between items-center gap-2">
                  <span className="truncate">{video.title}</span>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs text-muted">{video.active ? 'Published' : 'Pending upload'}</span>
                    <button className="text-rust" onClick={() => remove(video)}><Trash2 size={15} /></button>
                  </div>
                </div>
              ))}
        </div>
      </div>
    </div>
  )
}