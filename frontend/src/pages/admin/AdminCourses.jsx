import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Boxes,
  FolderPlus,
  Layers,
  RefreshCw,
  Trash2,
  Upload,
  Video as VideoIcon,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  Clock,
  Film,
  Tag,
  CheckCircle2,
  X,
  ChevronRight,
  Sparkles
} from 'lucide-react'
import AdminShell from '../../components/admin/AdminShell'
import { api } from '../../lib/api'

export default function AdminCourses() {
  const [activeTab, setActiveTab] = useState('courses') // 'courses' | 'videos' | 'categories'
  const [categories, setCategories] = useState([])
  const [plans, setPlans] = useState([])
  const [courses, setCourses] = useState([])
  const [videos, setVideos] = useState([])
  const [selectedCourseId, setSelectedCourseId] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  // Universal Delete Confirmation Modal State
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    type: '', // 'course' | 'category' | 'video'
    item: null,
    title: '',
    warning: '',
  })

  async function loadAll() {
    setLoading(true)
    setError('')
    try {
      const [catRes, planRes, courseRes] = await Promise.all([
        api('/admin/lms/categories'),
        api('/catalog/plans'),
        api('/admin/lms/courses'),
      ])
      const fetchedCategories = catRes.categories || []
      const fetchedCourses = courseRes.courses || []
      setCategories(fetchedCategories)
      setPlans(planRes.plans || [])
      setCourses(fetchedCourses)

      if (fetchedCourses.length > 0 && !selectedCourseId) {
        setSelectedCourseId(fetchedCourses[0]._id)
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAll()
  }, [])

  function openDeleteModal(type, item) {
    let title = ''
    let warning = ''

    if (type === 'course') {
      title = `Delete Course "${item.title}"`
      warning = 'This will permanently delete this course and all associated video lessons from MinIO storage.'
    } else if (type === 'category') {
      title = `Delete Category "${item.name}"`
      warning = 'This will delete the category. Warning: any courses and videos linked to it will also be deleted.'
    } else if (type === 'video') {
      title = `Delete Video "${item.title}"`
      warning = 'This will permanently remove the video and delete all encoded HLS stream segments from MinIO storage.'
    }

    setDeleteModal({ isOpen: true, type, item, title, warning })
  }

  async function handleConfirmDelete() {
    const { type, item } = deleteModal
    if (!item) return
    setError('')
    setMessage('')
    try {
      if (type === 'course') {
        await api(`/admin/lms/courses/${item._id}`, { method: 'DELETE' })
        setMessage(`Course "${item.title}" deleted successfully.`)
        if (selectedCourseId === item._id) setSelectedCourseId('')
      } else if (type === 'category') {
        await api(`/admin/lms/categories/${item._id}`, { method: 'DELETE' })
        setMessage(`Category "${item.name}" deleted successfully.`)
      } else if (type === 'video') {
        await api(`/admin/lms/videos/${item._id}`, { method: 'DELETE' })
        setMessage(`Video "${item.title}" deleted successfully.`)
        // Refresh videos for active course
        if (selectedCourseId) {
          const res = await api(`/admin/lms/videos?courseId=${selectedCourseId}`)
          setVideos(res.videos || [])
        }
      }
      setDeleteModal({ isOpen: false, type: '', item: null, title: '', warning: '' })
      await loadAll()
    } catch (e) {
      setError(e.message)
      setDeleteModal({ isOpen: false, type: '', item: null, title: '', warning: '' })
    }
  }

  function handleNavigateToVideos(courseId) {
    setSelectedCourseId(courseId)
    setActiveTab('videos')
  }

  return (
    <AdminShell>
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-ink/10">
        <div>
          <div className="eyebrow flex items-center gap-2 text-gold">
            <Sparkles size={14} /> Learning Management System
          </div>
          <h1 className="h2 mt-1">Course & Video Studio</h1>
          <p className="mt-1 text-sm text-ink/60 max-w-2xl">
            Organize course categories, link paid plans for student enrollment, and stream DRM-encrypted video lessons directly into MinIO storage.
          </p>
        </div>
        <button
          className="btn-outline btn-sm inline-flex items-center gap-2 border-ink/20 hover:border-gold"
          onClick={loadAll}
          disabled={loading}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>{loading ? 'Refreshing…' : 'Refresh Data'}</span>
        </button>
      </div>

      {/* Global Alerts */}
      {message && (
        <div className="mt-5 rounded-xl bg-teal/10 border border-teal/20 text-teal px-4 py-3 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} />
            <span>{message}</span>
          </div>
          <button onClick={() => setMessage('')} className="text-teal hover:opacity-75">
            <X size={15} />
          </button>
        </div>
      )}
      {error && (
        <div className="mt-5 rounded-xl bg-rust/10 border border-rust/20 text-rust px-4 py-3 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} />
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')} className="text-rust hover:opacity-75">
            <X size={15} />
          </button>
        </div>
      )}

      {/* Modern Tabs Navigation Bar */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 bg-paper rounded-2xl p-1.5 border border-ink/10">
        <div className="flex flex-wrap gap-1 sm:gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('courses')}
            className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'courses'
                ? 'bg-gold text-white shadow-md'
                : 'text-ink/70 hover:text-ink hover:bg-card/60'
            }`}
          >
            <Layers size={17} />
            <span>Courses</span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-mono ${
                activeTab === 'courses' ? 'bg-white/20 text-white' : 'bg-ink/10 text-ink/70'
              }`}
            >
              {courses.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('videos')}
            className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'videos'
                ? 'bg-gold text-white shadow-md'
                : 'text-ink/70 hover:text-ink hover:bg-card/60'
            }`}
          >
            <VideoIcon size={17} />
            <span>Video Library & Upload</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('categories')}
            className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'categories'
                ? 'bg-gold text-white shadow-md'
                : 'text-ink/70 hover:text-ink hover:bg-card/60'
            }`}
          >
            <FolderPlus size={17} />
            <span>Categories</span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-mono ${
                activeTab === 'categories' ? 'bg-white/20 text-white' : 'bg-ink/10 text-ink/70'
              }`}
            >
              {categories.length}
            </span>
          </button>
        </div>

        {/* Quick Quick Info Badge */}
        <div className="hidden md:flex items-center gap-4 px-3 text-xs text-ink/60">
          <span>Plans Available: <strong className="text-ink">{plans.length}</strong></span>
          <span>•</span>
          <span>Storage: <strong className="text-teal font-semibold">MinIO NVMe</strong></span>
        </div>
      </div>

      {/* Tab Panels */}
      <div className="mt-6">
        {activeTab === 'courses' && (
          <CoursesSection
            courses={courses}
            categories={categories}
            plans={plans}
            onDone={loadAll}
            setMessage={setMessage}
            setError={setError}
            onManageVideos={handleNavigateToVideos}
            onOpenDelete={(course) => openDeleteModal('course', course)}
          />
        )}

        {activeTab === 'videos' && (
          <VideosSection
            courses={courses}
            videos={videos}
            setVideos={setVideos}
            selectedCourseId={selectedCourseId}
            setSelectedCourseId={setSelectedCourseId}
            setMessage={setMessage}
            setError={setError}
            onOpenDelete={(video) => openDeleteModal('video', video)}
          />
        )}

        {activeTab === 'categories' && (
          <CategoriesSection
            categories={categories}
            courses={courses}
            onDone={loadAll}
            setMessage={setMessage}
            setError={setError}
            onOpenDelete={(cat) => openDeleteModal('category', cat)}
          />
        )}
      </div>

      {/* Universal Safe Delete Confirmation Modal */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadein">
          <div className="bg-card w-full max-w-md rounded-2xl p-6 shadow-2xl border border-ink/15">
            <div className="w-12 h-12 rounded-xl bg-rust/10 text-rust flex items-center justify-center mb-4">
              <AlertTriangle size={24} />
            </div>
            <h3 className="font-display text-lg font-semibold text-ink">{deleteModal.title}</h3>
            <p className="mt-2 text-sm text-ink/70 leading-relaxed">{deleteModal.warning}</p>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                className="btn-outline btn-sm px-4"
                onClick={() => setDeleteModal({ isOpen: false, type: '', item: null, title: '', warning: '' })}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-sm rounded-lg bg-rust text-white font-semibold hover:bg-rust/90 shadow-sm px-5"
                onClick={handleConfirmDelete}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  )
}

// =====================================================================
// SECTION 1: COURSES (With Search, Filter, Multi-Course Scaling)
// =====================================================================
function CoursesSection({ courses, categories, plans, onDone, setMessage, setError, onManageVideos, onOpenDelete }) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL')
  const [category, setCategory] = useState('')
  const [plan, setPlan] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)

  // Filter courses by search and category
  const filteredCourses = useMemo(() => {
    return courses.filter((c) => {
      const matchesSearch =
        c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.category?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.plan?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory =
        selectedCategoryFilter === 'ALL' || c.category?._id === selectedCategoryFilter
      return matchesSearch && matchesCategory
    })
  }, [courses, searchTerm, selectedCategoryFilter])

  async function submit(e) {
    e.preventDefault()
    setError('')
    setMessage('')
    if (!category || !plan) return setError('Please choose both a category and an unlocking plan.')
    setLoading(true)
    try {
      await api('/admin/lms/courses', {
        method: 'POST',
        body: JSON.stringify({ category, plan, title, description }),
      })
      setMessage(`Course "${title}" created successfully.`)
      setTitle('')
      setDescription('')
      setShowAddForm(false)
      await onDone()
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Action Bar & Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-card p-4 rounded-2xl border border-ink/10 shadow-sm">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/40" />
          <input
            type="text"
            className="w-full bg-paper2/60 border border-ink/15 rounded-xl pl-10 pr-4 py-2.5 text-sm text-ink placeholder:text-ink/40 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold"
            placeholder="Search from 20+ courses, plans or categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/40 hover:text-ink"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filter & Add Course Button */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter size={15} className="text-ink/50" />
            <select
              className="bg-paper2/60 border border-ink/15 rounded-xl px-3 py-2 text-sm text-ink focus:outline-none focus:border-gold"
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
            >
              <option value="ALL">All Categories ({courses.length})</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="btn-gold btn-sm rounded-xl inline-flex items-center gap-2 shadow-sm"
          >
            {showAddForm ? <X size={16} /> : <Plus size={16} />}
            <span>{showAddForm ? 'Close Form' : 'Add Course'}</span>
          </button>
        </div>
      </div>

      {/* Expandable Course Creation Drawer/Card */}
      {showAddForm && (
        <div className="card p-6 sm:p-7 border-2 border-gold/30 bg-card rounded-2xl shadow-card animate-fadein">
          <div className="flex items-center gap-3 pb-4 border-b border-ink/10">
            <div className="w-10 h-10 rounded-xl bg-gold/15 text-gold flex items-center justify-center font-bold">
              <Plus size={20} />
            </div>
            <div>
              <h2 className="font-display text-lg font-semibold text-ink">Create New Course</h2>
              <p className="text-xs text-ink/60">
                Link this course to a paid plan so buyers automatically unlock streaming access.
              </p>
            </div>
          </div>

          <form onSubmit={submit} className="mt-5 grid md:grid-cols-2 gap-5">
            <div>
              <label className="field-label">Category *</label>
              <select
                className="field-input"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
              >
                <option value="">Select category…</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="field-label">Unlocking Plan *</label>
              <select
                className="field-input"
                value={plan}
                onChange={(e) => setPlan(e.target.value)}
                required
              >
                <option value="">Select unlocking plan…</option>
                {plans.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name} — ₹{p.price.toLocaleString('en-IN')}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="field-label">Course Title *</label>
              <input
                className="field-input"
                placeholder="e.g. GeM Seller Masterclass 2026"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="field-label">Course Description</label>
              <textarea
                className="field-input min-h-[90px]"
                placeholder="Brief summary of syllabus and student learning outcomes..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="md:col-span-2 flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="btn-outline btn-sm"
              >
                Cancel
              </button>
              <button type="submit" className="btn-gold btn-sm px-6" disabled={loading}>
                {loading ? 'Creating Course…' : 'Publish Course'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Courses List / Grid */}
      {filteredCourses.length === 0 ? (
        <div className="card p-12 text-center rounded-2xl border-dashed border-2 border-ink/15">
          <Layers size={36} className="mx-auto text-ink/30 mb-3" />
          <h3 className="font-display text-lg font-semibold text-ink">No courses found</h3>
          <p className="text-sm text-ink/60 mt-1 max-w-sm mx-auto">
            {searchTerm || selectedCategoryFilter !== 'ALL'
              ? 'Try adjusting your search query or category filter.'
              : 'Create your first course above to start uploading protected video lectures.'}
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredCourses.map((course) => (
            <div
              key={course._id}
              className="card p-5 rounded-2xl flex flex-col justify-between hover:border-gold/50 transition-all duration-200 group"
            >
              <div>
                {/* Top Badges */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="badge bg-gold/10 text-gold border-gold/20 font-medium">
                    <Tag size={11} /> {course.category?.name || 'General'}
                  </span>
                  <span className="text-xs font-mono text-teal bg-teal/10 px-2 py-0.5 rounded-full border border-teal/20">
                    Active
                  </span>
                </div>

                {/* Title */}
                <h3 className="font-display text-lg font-semibold text-ink group-hover:text-gold transition-colors line-clamp-2">
                  {course.title}
                </h3>

                {/* Description */}
                <p className="text-xs text-ink/60 mt-2 line-clamp-3 leading-relaxed">
                  {course.description || 'No course description provided.'}
                </p>

                {/* Unlocking Plan Badge */}
                <div className="mt-4 p-2.5 rounded-xl bg-paper2/70 border border-ink/10 flex items-center justify-between gap-2">
                  <span className="text-xs text-ink/70">Unlocks with:</span>
                  <span className="text-xs font-semibold text-ink truncate font-mono">
                    {course.plan?.name || 'Direct'} {course.plan?.price ? `(₹${course.plan.price})` : ''}
                  </span>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="mt-5 pt-4 border-t border-ink/10 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => onManageVideos(course._id)}
                  className="btn-outline btn-sm text-xs py-2 px-3 inline-flex items-center gap-1.5 hover:bg-gold hover:text-white hover:border-gold transition-colors"
                >
                  <Film size={13} />
                  <span>Manage Videos</span>
                  <ChevronRight size={13} />
                </button>

                <button
                  type="button"
                  onClick={() => onOpenDelete(course)}
                  className="p-2 text-ink/40 hover:text-rust rounded-lg hover:bg-rust/10 transition-colors"
                  title="Delete course"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// =====================================================================
// SECTION 2: VIDEOS & DIRECT MINIO UPLOAD (Lesson Management)
// =====================================================================
function VideosSection({
  courses,
  videos,
  setVideos,
  selectedCourseId,
  setSelectedCourseId,
  setMessage,
  setError,
  onOpenDelete,
}) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [file, setFile] = useState(null)
  const [detectedDuration, setDetectedDuration] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const inputRef = useRef(null)

  // Load videos whenever the selected course changes
  async function loadVideos(cId) {
    if (!cId) {
      setVideos([])
      return
    }
    try {
      const res = await api(`/admin/lms/videos?courseId=${cId}`)
      setVideos(res.videos || [])
    } catch (e) {
      setError(e.message)
    }
  }

  // 1. Initial load on course selection change
  useEffect(() => {
    if (selectedCourseId) {
      loadVideos(selectedCourseId)
    } else {
      setVideos([])
    }
  }, [selectedCourseId])

  // 2. Dedicated Live Transcoding Poller (Runs every 2s only while an active transcoding job exists)
  useEffect(() => {
    if (!selectedCourseId) return

    const hasActiveTranscode = videos.some(
      (v) =>
        v.status === 'PENDING' ||
        v.status === 'UPLOADING' ||
        v.status === 'QUEUED' ||
        v.status === 'PROCESSING'
    )

    if (!hasActiveTranscode) return

    const timer = setInterval(async () => {
      try {
        const res = await api(`/admin/lms/videos?courseId=${selectedCourseId}`)
        if (res?.videos) {
          setVideos(res.videos)
        }
      } catch (err) {
        // Silent fail on background poll
      }
    }, 2000)

    return () => clearInterval(timer)
  }, [selectedCourseId, videos])

  function handleFileChange(e) {
    const selectedFile = e.target.files?.[0] || null
    setFile(selectedFile)
    setDetectedDuration(0)
    if (selectedFile) {
      if (!title) {
        // Auto-populate video title from filename
        const cleanName = selectedFile.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ')
        setTitle(cleanName)
      }
      const vid = document.createElement('video')
      vid.preload = 'metadata'
      vid.onloadedmetadata = () => {
        setDetectedDuration(Math.ceil(vid.duration))
        URL.revokeObjectURL(vid.src)
      }
      vid.onerror = () => {
        // MKV format may not decode in browser; worker ffprobe will probe accurately
        URL.revokeObjectURL(vid.src)
      }
      vid.src = URL.createObjectURL(selectedFile)
    }
  }

  async function submit(e) {
    e.preventDefault()
    setError('')
    setMessage('')
    if (!selectedCourseId) return setError('Please choose a course first.')
    if (!file) return setError('Please choose a video file to upload.')

    setUploading(true)
    setUploadProgress(15)
    try {
      // Step 1: Create metadata record in MongoDB
      const created = await api('/admin/lms/videos', {
        method: 'POST',
        body: JSON.stringify({
          course: selectedCourseId,
          title,
          description,
          durationSeconds: detectedDuration,
        }),
      })
      const videoId = created.video._id

      // 🚀 Optimistic Instant Insert: Show video in playlist immediately so user knows it started!
      const initialDoc = {
        ...created.video,
        status: 'UPLOADING',
        processingProgress: 5,
        fileSizeBytes: file.size,
      }
      setVideos((prev) => [...prev, initialDoc])
      setUploadProgress(40)

      // Step 2: Stream file directly into MinIO (multipart field: "video")
      const formData = new FormData()
      formData.append('video', file, file.name)

      const uploadRes = await api(`/admin/lms/videos/${videoId}/upload`, {
        method: 'POST',
        body: formData,
        retry: false,
      })

      setUploadProgress(100)

      // Update state to QUEUED immediately
      setVideos((prev) =>
        prev.map((v) =>
          v._id === videoId
            ? { ...v, status: 'QUEUED', processingProgress: 10, fileSizeBytes: uploadRes.fileSizeBytes || file.size }
            : v
        )
      )

      setMessage(`Video lesson "${title}" uploaded! Background HLS AES-128 transcoding started.`)
      setTitle('')
      setDescription('')
      setFile(null)
      if (inputRef.current) inputRef.current.value = ''

      // Sync fresh list from database
      await loadVideos(selectedCourseId)
    } catch (e) {
      setError(e.message)
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const activeCourseObj = courses.find((c) => c._id === selectedCourseId)

  return (
    <div className="grid lg:grid-cols-12 gap-6">
      {/* Left Column: Upload Form */}
      <div className="lg:col-span-5">
        <div className="card p-6 rounded-2xl shadow-card border border-ink/10 sticky top-6">
          <div className="flex items-center gap-3 pb-4 border-b border-ink/10">
            <div className="w-10 h-10 rounded-xl bg-gold/15 text-gold flex items-center justify-center font-bold">
              <Upload size={20} />
            </div>
            <div>
              <h2 className="font-display text-lg font-semibold text-ink">Upload Video Lesson</h2>
              <p className="text-xs text-ink/60">Streams to MinIO; Worker converts to 1080p/720p/360p ABR.</p>
            </div>
          </div>

          <form onSubmit={submit} className="mt-5 space-y-4">
            {/* Course Selector */}
            <div>
              <label className="field-label">Target Course *</label>
              <select
                className="field-input font-medium"
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                required
              >
                <option value="">Select a course to add videos…</option>
                {courses.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.title} ({c.category?.name || 'General'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="field-label">Lesson Title *</label>
              <input
                className="field-input"
                placeholder="e.g. Module 1: GeM Portal Introduction"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="field-label">Description (Optional)</label>
              <textarea
                className="field-input min-h-[70px]"
                placeholder="Key concepts covered in this lesson..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* Drag & Drop File Picker */}
            <div>
              <label className="field-label">Video File (MP4, WebM, MOV, MKV) *</label>
              <div
                onClick={() => inputRef.current?.click()}
                className="border-2 border-dashed border-ink/20 hover:border-gold rounded-xl p-5 text-center cursor-pointer transition-colors bg-paper2/40 hover:bg-paper2"
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime,video/x-matroska,.mkv"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Film size={28} className="mx-auto text-ink/40 mb-2" />
                <p className="text-sm font-semibold text-ink">
                  {file ? file.name : 'Click to browse video file'}
                </p>
                <p className="text-xs text-ink/50 mt-1">Supports files up to 5 GB (Direct NVMe Streaming)</p>
              </div>

              {/* Selected File Stats Preview */}
              {file && (
                <div className="mt-3 p-3 rounded-xl bg-gold/10 border border-gold/20 text-xs flex items-center justify-between text-ink">
                  <div className="flex items-center gap-2 truncate">
                    <VideoIcon size={15} className="text-gold shrink-0" />
                    <span className="truncate font-medium">{file.name}</span>
                  </div>
                  <span className="font-mono shrink-0 ml-2 text-ink/70">
                    {detectedDuration > 0
                      ? `${Math.floor(detectedDuration / 60)}m ${detectedDuration % 60}s`
                      : 'Auto-probed by server'}{' '}
                    · {(file.size / 1024 / 1024).toFixed(1)} MB
                  </span>
                </div>
              )}
            </div>

            {/* Upload Button & Progress */}
            {uploading && (
              <div className="space-y-1 mt-2">
                <div className="flex justify-between text-xs font-semibold text-ink/70">
                  <span>
                    {uploadProgress < 30
                      ? 'Creating record...'
                      : uploadProgress < 100
                      ? 'Streaming to NVMe storage...'
                      : 'Handing off to BullMQ worker...'}
                  </span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-paper2 rounded-full h-2 overflow-hidden border border-ink/10">
                  <div
                    className="bg-gold h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={uploading || !selectedCourseId || !file}
              className="btn-gold btn-block rounded-xl py-3 mt-3 shadow-md disabled:opacity-50"
            >
              {uploading ? 'Uploading to NVMe storage…' : 'Upload & Encrypt Video'}
            </button>
          </form>
        </div>
      </div>

      {/* Right Column: Playlist of Existing Videos */}
      <div className="lg:col-span-7">
        <div className="card p-6 rounded-2xl shadow-card border border-ink/10">
          <div className="flex items-center justify-between gap-4 pb-4 border-b border-ink/10">
            <div>
              <h2 className="font-display text-lg font-semibold text-ink">
                {activeCourseObj ? activeCourseObj.title : 'Course Videos'}
              </h2>
              <p className="text-xs text-ink/60 mt-0.5">
                {activeCourseObj
                  ? `Category: ${activeCourseObj.category?.name || 'General'} · Plan: ${activeCourseObj.plan?.name || 'Standard'}`
                  : 'Select a course to review its video playlist.'}
              </p>
            </div>
            <span className="badge bg-paper2 text-ink/80 border-ink/15 font-mono">
              {videos.length} {videos.length === 1 ? 'Lesson' : 'Lessons'}
            </span>
          </div>

          <div className="mt-5 space-y-3">
            {!selectedCourseId ? (
              <div className="py-12 text-center text-ink/40 text-sm">
                <Film size={32} className="mx-auto mb-2 opacity-50" />
                Select a course on the left to see its lessons.
              </div>
            ) : videos.length === 0 ? (
              <div className="py-12 text-center text-ink/40 text-sm">
                <VideoIcon size={32} className="mx-auto mb-2 opacity-50" />
                No video lessons uploaded for this course yet.
              </div>
            ) : (
              videos.map((vid, idx) => {
                const isReady = vid.status === 'READY' || vid.isHlsReady
                const isFailed = vid.status === 'FAILED'
                const isProcessing =
                  vid.status === 'PROCESSING' ||
                  vid.status === 'QUEUED' ||
                  vid.status === 'UPLOADING' ||
                  vid.status === 'PENDING'
                const progress =
                  vid.processingProgress ||
                  (vid.status === 'QUEUED' ? 10 : vid.status === 'UPLOADING' ? 5 : vid.status === 'PENDING' ? 2 : 0)

                let stageText = 'Waiting...'
                if (vid.status === 'PENDING') {
                  stageText = '1/5: Initializing video record in MongoDB...'
                } else if (vid.status === 'UPLOADING') {
                  stageText = '1/5: Streaming to NVMe storage (/tmp) via Busboy (Zero RAM)...'
                } else if (vid.status === 'QUEUED') {
                  stageText = '2/5: Saved to disk! Queued in BullMQ worker (1.0 vCPU lock)...'
                } else if (vid.status === 'PROCESSING') {
                  if (progress < 85) {
                    stageText = `3/5: FFmpeg ABR Multi-Bitrate Encoding (1080p + 720p + 360p) · ${progress}%`
                  } else {
                    stageText = `4/5: AES-128 DRM Packaging & MinIO S3 Upload · ${progress}%`
                  }
                } else if (isReady) {
                  stageText = '5/5: 100% Ready (Multi-bitrate HLS AES-128 Stream)'
                } else if (isFailed) {
                  stageText = `Failed: ${vid.errorMessage || 'Transcoding error'}`
                }

                return (
                  <div
                    key={vid._id}
                    className={`p-4 rounded-xl border transition-all ${
                      isFailed
                        ? 'border-rust/30 bg-rust/5'
                        : isProcessing
                        ? 'border-gold/40 bg-gold/5 shadow-sm'
                        : 'border-ink/10 bg-paper2/30 hover:bg-paper2/60'
                    }`}
                  >
                    {/* Top Row: Title, Duration, Status, Delete */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <span className="w-7 h-7 rounded-lg bg-gold/15 text-gold text-xs font-mono font-bold flex items-center justify-center shrink-0 mt-0.5">
                          #{idx + 1}
                        </span>
                        <div className="min-w-0">
                          <h4 className="text-sm font-semibold text-ink truncate">{vid.title}</h4>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-ink/60 mt-1">
                            <span className="flex items-center gap-1 font-mono">
                              <Clock size={12} />
                              {vid.durationSeconds
                                ? `${Math.floor(vid.durationSeconds / 60)}m ${vid.durationSeconds % 60}s`
                                : '0m 00s'}
                            </span>
                            <span>•</span>
                            <span className="font-mono">
                              {vid.fileSizeBytes
                                ? `${(vid.fileSizeBytes / 1024 / 1024).toFixed(1)} MB`
                                : 'MP4'}
                            </span>
                            <span>•</span>
                            <span
                              className={`font-semibold px-2 py-0.5 rounded-full text-[11px] font-mono border ${
                                isReady
                                  ? 'bg-teal/10 text-teal border-teal/20'
                                  : isFailed
                                  ? 'bg-rust/10 text-rust border-rust/20'
                                  : 'bg-gold/15 text-gold border-gold/30 animate-pulse'
                              }`}
                            >
                              {vid.status || (isReady ? 'READY' : 'PENDING')}
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => onOpenDelete(vid)}
                        className="p-1.5 text-ink/40 hover:text-rust rounded-lg hover:bg-rust/10 transition-colors shrink-0"
                        title="Delete video"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>

                    {/* Live Pipeline Stepper Box (Shows for Processing & Queued videos) */}
                    {isProcessing && (
                      <div className="mt-3.5 pt-3 border-t border-ink/10 space-y-2">
                        {/* Progress Header */}
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-gold flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-gold animate-ping" />
                            {stageText}
                          </span>
                          <span className="font-mono font-bold text-ink">{progress}%</span>
                        </div>

                        {/* Animated Progress Bar */}
                        <div className="w-full bg-paper2 rounded-full h-2 overflow-hidden border border-ink/10">
                          <div
                            className="bg-gradient-to-r from-gold to-teal h-2 rounded-full transition-all duration-500"
                            style={{ width: `${Math.max(progress, 5)}%` }}
                          />
                        </div>

                        {/* 5-Step Pipeline Chips */}
                        <div className="grid grid-cols-5 gap-1 text-[10px] font-mono pt-1 text-center">
                          <span
                            className={`p-1 rounded ${
                              progress >= 5 ? 'bg-teal/10 text-teal font-bold' : 'text-ink/40'
                            }`}
                          >
                            1. Busboy /tmp
                          </span>
                          <span
                            className={`p-1 rounded ${
                              progress >= 10 ? 'bg-teal/10 text-teal font-bold' : 'text-ink/40'
                            }`}
                          >
                            2. BullMQ 1vCPU
                          </span>
                          <span
                            className={`p-1 rounded ${
                              progress >= 15 && progress < 85
                                ? 'bg-gold/15 text-gold font-bold'
                                : progress >= 85
                                ? 'bg-teal/10 text-teal font-bold'
                                : 'text-ink/40'
                            }`}
                          >
                            3. FFmpeg ABR
                          </span>
                          <span
                            className={`p-1 rounded ${
                              progress >= 85 && progress < 100
                                ? 'bg-gold/15 text-gold font-bold'
                                : progress >= 100
                                ? 'bg-teal/10 text-teal font-bold'
                                : 'text-ink/40'
                            }`}
                          >
                            4. MinIO S3
                          </span>
                          <span
                            className={`p-1 rounded ${
                              isReady ? 'bg-teal/10 text-teal font-bold' : 'text-ink/40'
                            }`}
                          >
                            5. Ready
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Ready Badge: Shows ABR Resolutions & AES-128 Encryption */}
                    {isReady && (
                      <div className="mt-3 pt-2.5 border-t border-ink/10 flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-1.5 text-teal text-[11px] font-medium font-mono">
                          <CheckCircle2 size={13} />
                          <span>ABR Streams: 1080p · 720p · 360p</span>
                        </div>
                        <span className="text-[11px] font-mono text-ink/50 bg-paper2 px-2 py-0.5 rounded border border-ink/10">
                          🔐 AES-128 DRM Protected · MinIO
                        </span>
                      </div>
                    )}

                    {/* Failed Error Message Box */}
                    {isFailed && (
                      <div className="mt-3 pt-2.5 border-t border-rust/20 text-xs text-rust font-mono">
                        ⚠️ Transcode Failed: {vid.errorMessage || 'FFmpeg error encountered during conversion.'}
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// =====================================================================
// SECTION 3: CATEGORIES (Well-Structured Card Grid & Counter)
// =====================================================================
function CategoriesSection({ categories, courses, onDone, setMessage, setError, onOpenDelete }) {
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)
    try {
      await api('/admin/lms/categories', {
        method: 'POST',
        body: JSON.stringify({ name, slug }),
      })
      setMessage(`Category "${name}" created successfully.`)
      setName('')
      setSlug('')
      await onDone()
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  // Count courses per category
  const courseCountMap = useMemo(() => {
    const map = {}
    courses.forEach((c) => {
      const catId = c.category?._id || 'other'
      map[catId] = (map[catId] || 0) + 1
    })
    return map
  }, [courses])

  return (
    <div className="grid lg:grid-cols-12 gap-6">
      {/* Add Category Form */}
      <div className="lg:col-span-4">
        <div className="card p-6 rounded-2xl shadow-card border border-ink/10 sticky top-6">
          <div className="flex items-center gap-3 pb-4 border-b border-ink/10">
            <div className="w-10 h-10 rounded-xl bg-gold/15 text-gold flex items-center justify-center font-bold">
              <FolderPlus size={20} />
            </div>
            <div>
              <h2 className="font-display text-lg font-semibold text-ink">New Category</h2>
              <p className="text-xs text-ink/60">Organize courses by industry or department.</p>
            </div>
          </div>

          <form onSubmit={submit} className="mt-5 space-y-4">
            <div>
              <label className="field-label">Category Name *</label>
              <input
                className="field-input"
                placeholder="e.g. GeM Registration"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  if (!slug) {
                    setSlug(e.target.value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-'))
                  }
                }}
                required
              />
            </div>

            <div>
              <label className="field-label">URL Slug *</label>
              <input
                className="field-input font-mono text-xs"
                placeholder="gem-registration"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'))}
                required
              />
            </div>

            <button type="submit" disabled={loading} className="btn-gold btn-block rounded-xl py-3 mt-4">
              {loading ? 'Creating…' : 'Add Category'}
            </button>
          </form>
        </div>
      </div>

      {/* Categories Grid List */}
      <div className="lg:col-span-8">
        <div className="card p-6 rounded-2xl shadow-card border border-ink/10">
          <div className="flex items-center justify-between pb-4 border-b border-ink/10">
            <div>
              <h2 className="font-display text-lg font-semibold text-ink">Active Categories</h2>
              <p className="text-xs text-ink/60 mt-0.5">
                Categories group courses for student browsing and dashboard navigation.
              </p>
            </div>
            <span className="badge bg-paper2 text-ink/80 border-ink/15 font-mono">
              {categories.length} Total
            </span>
          </div>

          {categories.length === 0 ? (
            <p className="text-sm text-ink/50 py-10 text-center">No categories created yet.</p>
          ) : (
            <div className="mt-5 grid sm:grid-cols-2 gap-4">
              {categories.map((cat) => {
                const count = courseCountMap[cat._id] || 0
                return (
                  <div
                    key={cat._id}
                    className="p-4 rounded-xl border border-ink/10 bg-paper2/40 hover:bg-paper2 hover:border-gold/40 transition-all flex flex-col justify-between gap-3 group"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-mono text-ink/50 bg-paper px-2 py-0.5 rounded border border-ink/10">
                          /{cat.slug}
                        </span>
                        <span className="badge bg-gold/10 text-gold border-gold/20 text-xs">
                          {count} {count === 1 ? 'Course' : 'Courses'}
                        </span>
                      </div>
                      <h4 className="font-display text-base font-semibold text-ink mt-2 group-hover:text-gold transition-colors">
                        {cat.name}
                      </h4>
                    </div>

                    <div className="pt-2 border-t border-ink/10 flex items-center justify-between">
                      <span className="text-[11px] text-ink/40">ID: {cat._id.slice(-6)}</span>
                      <button
                        type="button"
                        onClick={() => onOpenDelete(cat)}
                        className="text-ink/40 hover:text-rust p-1 rounded transition-colors"
                        title="Delete category"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}