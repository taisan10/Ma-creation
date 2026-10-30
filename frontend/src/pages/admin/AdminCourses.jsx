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
  Sparkles,
  Lock,
  Play,
  Copy,
  Check,
  HardDrive
} from 'lucide-react'
import AdminShell from '../../components/admin/AdminShell'
import { api } from '../../lib/api'
import { uploadVideoWithRealProgress } from '../../lib/videoUpload'
import VideoUploadFloatingDock from './components/VideoUploadFloatingDock'
import AdminVideoPreviewModal from './components/AdminVideoPreviewModal'

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
  const [activeUpload, setActiveUpload] = useState(null)
  const [previewVideo, setPreviewVideo] = useState(null)
  const abortUploadRef = useRef(null)

  // Background poller for active floating dock upload across all tabs
  useEffect(() => {
    if (!activeUpload?.id || !activeUpload?.courseId) return
    if (activeUpload.status === 'READY' || activeUpload.status === 'FAILED') return

    const timer = setInterval(async () => {
      try {
        const res = await api(`/admin/lms/videos?courseId=${activeUpload.courseId}`)
        if (res?.videos) {
          const target = res.videos.find((v) => v._id === activeUpload.id)
          if (target) {
            if (target.status === 'READY') {
              setActiveUpload((prev) => (prev ? { ...prev, status: 'READY', percent: 100 } : null))
              setVideos((prev) => prev.map((v) => (v._id === target._id ? target : v)))
            } else if (target.status === 'PROCESSING') {
              setActiveUpload((prev) =>
                prev ? { ...prev, status: 'PROCESSING', percent: target.processingProgress || 30 } : null
              )
              setVideos((prev) => prev.map((v) => (v._id === target._id ? target : v)))
            } else if (target.status === 'FAILED') {
              setActiveUpload((prev) => (prev ? { ...prev, status: 'FAILED' } : null))
              setVideos((prev) => prev.map((v) => (v._id === target._id ? target : v)))
            }
          }
        }
      } catch (_) {
        // Silent fail on background poll
      }
    }, 2500)

    return () => clearInterval(timer)
  }, [activeUpload?.id, activeUpload?.status, activeUpload?.courseId])

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
            activeUpload={activeUpload}
            setActiveUpload={setActiveUpload}
            abortUploadRef={abortUploadRef}
            onPreviewVideo={setPreviewVideo}
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
      {/* Floating YouTube Studio Style Upload Dock */}
      {activeUpload && (
        <VideoUploadFloatingDock
          upload={activeUpload}
          onCancel={() => {
            if (abortUploadRef.current) {
              abortUploadRef.current()
              abortUploadRef.current = null
            }
            setActiveUpload(null)
            setMessage('Video upload was cancelled.')
          }}
          onDismiss={() => setActiveUpload(null)}
        />
      )}
      {/* In-Place Video Lesson Preview Modal */}
      {previewVideo && (
        <AdminVideoPreviewModal
          video={previewVideo}
          onClose={() => setPreviewVideo(null)}
        />
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
  activeUpload,
  setActiveUpload,
  abortUploadRef,
  onPreviewVideo,
}) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [file, setFile] = useState(null)
  const [detectedDuration, setDetectedDuration] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadStats, setUploadStats] = useState({
    percent: 0,
    formattedLoaded: '',
    formattedSpeed: '',
    formattedEta: '',
  })
  const [videoSearch, setVideoSearch] = useState('')
  const [videoFilter, setVideoFilter] = useState('ALL') // 'ALL' | 'READY' | 'PROCESSING' | 'FAILED'
  const [copiedId, setCopiedId] = useState(null)
  const copyTimerRef = useRef(null)
  const inputRef = useRef(null)

  function copyVideoId(id) {
    if (!id) return
    try {
      navigator.clipboard?.writeText(id)
      setCopiedId(id)
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current)
      copyTimerRef.current = setTimeout(() => setCopiedId(null), 2000)
    } catch (_) {}
  }

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current)
    }
  }, [])

  const courseStats = useMemo(() => {
    let totalSecs = 0
    let totalBytes = 0
    let readyCount = 0
    let processingCount = 0

    videos.forEach((v) => {
      totalSecs += v.durationSeconds || 0
      totalBytes += v.fileSizeBytes || 0
      if (v.status === 'READY' || v.isHlsReady) readyCount++
      if (
        v.status === 'PROCESSING' ||
        v.status === 'QUEUED' ||
        v.status === 'UPLOADING' ||
        v.status === 'PENDING'
      ) {
        processingCount++
      }
    })

    const hours = Math.floor(totalSecs / 3600)
    const minutes = Math.floor((totalSecs % 3600) / 60)
    const durationStr =
      hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m ${totalSecs % 60}s`
    const sizeStr =
      totalBytes >= 1024 * 1024 * 1024
        ? `${(totalBytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
        : `${(totalBytes / (1024 * 1024)).toFixed(1)} MB`

    return { totalSecs, durationStr, totalBytes, sizeStr, readyCount, processingCount }
  }, [videos])

  const filteredVideos = useMemo(() => {
    return videos.filter((v) => {
      const q = videoSearch.trim().toLowerCase()
      const matchesSearch =
        !q ||
        v.title?.toLowerCase().includes(q) ||
        v.description?.toLowerCase().includes(q)

      if (!matchesSearch) return false

      if (videoFilter === 'READY') return v.status === 'READY' || v.isHlsReady
      if (videoFilter === 'PROCESSING') {
        return (
          v.status === 'PROCESSING' ||
          v.status === 'QUEUED' ||
          v.status === 'UPLOADING' ||
          v.status === 'PENDING'
        )
      }
      if (videoFilter === 'FAILED') return v.status === 'FAILED'

      return true
    })
  }, [videos, videoSearch, videoFilter])

  function handleCancelUpload() {
    if (abortUploadRef.current) {
      abortUploadRef.current()
      abortUploadRef.current = null
    }
    setUploading(false)
    setUploadProgress(0)
    setActiveUpload(null)
    setMessage('Video upload was cancelled.')
  }

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
    const fileExt = '.' + file.name.split('.').pop().toLowerCase()
    const allowedExts = ['.mp4', '.webm', '.mov', '.mkv']
    if (!allowedExts.includes(fileExt)) {
      return setError('Invalid video format. Only MP4, WebM, MOV, and MKV files are allowed.')
    }
    if (file.size > 5 * 1024 * 1024 * 1024) {
      return setError('File size exceeds the 5 GB server limit.')
    }
    setUploading(true)
    setUploadProgress(0)
    setUploadStats({
      percent: 0,
      formattedLoaded: `0 B / ${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      formattedSpeed: 'Connecting…',
      formattedEta: '',
    })

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

      // Set active floating dock upload state
      setActiveUpload({
        id: videoId,
        courseId: selectedCourseId,
        title: title || file.name,
        fileName: file.name,
        fileSizeFormatted: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        status: 'UPLOADING',
        percent: 0,
        formattedLoaded: `0 B / ${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        formattedSpeed: 'Connecting…',
        formattedEta: '',
      })

      // 🚀 Optimistic Instant Insert: Show video in playlist immediately
      const initialDoc = {
        ...created.video,
        status: 'UPLOADING',
        processingProgress: 0,
        fileSizeBytes: file.size,
      }
      setVideos((prev) => [...prev, initialDoc])

      // Step 2: Stream file with REAL byte-by-byte XHR progress and speed tracking
      const uploadRes = await uploadVideoWithRealProgress({
        videoId,
        file,
        onProgress: (stats) => {
          setUploadProgress(stats.percent)
          setUploadStats(stats)
          setActiveUpload((prev) => (prev ? { ...prev, ...stats } : prev))
        },
        onAbortRef: (abortFn) => {
          abortUploadRef.current = abortFn
        },
      })

      // Update state to QUEUED immediately after file is safely saved on server disk
      setActiveUpload((prev) =>
        prev
          ? {
              ...prev,
              status: 'QUEUED',
              percent: 10,
            }
          : null
      )

      setVideos((prev) =>
        prev.map((v) =>
          v._id === videoId
            ? { ...v, status: 'QUEUED', processingProgress: 5, fileSizeBytes: uploadRes.fileSizeBytes || file.size }
            : v
        )
      )

      setMessage(`✓ Video "${title}" uploaded! Queued for background transcoding. You can safely close or navigate away.`)
      setTitle('')
      setDescription('')
      setFile(null)
      if (inputRef.current) inputRef.current.value = ''

      // Sync fresh list from database
      await loadVideos(selectedCourseId)
    } catch (e) {
      if (e.message !== 'Upload cancelled by user.') {
        setError(e.message)
      }
      setActiveUpload((prev) => (prev ? { ...prev, status: 'FAILED' } : null))
    } finally {
      setUploading(false)
      setUploadProgress(0)
      setUploadStats({ percent: 0, formattedLoaded: '', formattedSpeed: '', formattedEta: '' })
      abortUploadRef.current = null
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

            {/* Upload Button & Real-Time Metrics */}
            {uploading && (
              <div className="space-y-2 mt-3 p-4 rounded-xl border border-gold/30 bg-gold/5 shadow-sm">
                <div className="flex items-center justify-between text-xs font-semibold text-ink">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-gold animate-ping" />
                    Streaming file to server storage...
                  </span>
                  <span className="font-mono text-sm text-gold font-bold">{uploadStats.percent}%</span>
                </div>

                <div className="w-full bg-paper2 rounded-full h-2.5 overflow-hidden border border-ink/10">
                  <div
                    className="bg-gold h-2.5 rounded-full transition-all duration-200"
                    style={{ width: `${uploadStats.percent}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-ink/70 font-mono">
                  <span>{uploadStats.formattedLoaded || 'Preparing file…'}</span>
                  <div className="flex items-center gap-2">
                    {uploadStats.formattedSpeed && <span>{uploadStats.formattedSpeed}</span>}
                    {uploadStats.formattedEta && <span className="text-gold font-semibold">· {uploadStats.formattedEta}</span>}
                  </div>
                </div>

                <div className="pt-1.5 flex items-center justify-between border-t border-gold/15">
                  <span className="text-[10px] text-rust font-medium">⚠️ Keep this tab open until upload reaches 100%</span>
                  {abortUploadRef.current && (
                    <button
                      type="button"
                      onClick={handleCancelUpload}
                      className="text-[11px] text-rust hover:underline font-semibold"
                    >
                      Cancel Upload
                    </button>
                  )}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={uploading || !selectedCourseId || !file}
              className="btn-gold btn-block rounded-xl py-3 mt-3 shadow-md disabled:opacity-50"
            >
              {uploading ? 'Streaming to Server…' : 'Upload Video Lesson'}
            </button>
          </form>
        </div>
      </div>

      {/* Right Column: Playlist of Existing Videos */}
      <div className="lg:col-span-7">
        <div className="card p-6 rounded-2xl shadow-card border border-ink/10">
          {/* Header with Title and Course Aggregate Stats */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-ink/10">
            <div>
              <h2 className="font-display text-lg font-semibold text-ink flex items-center gap-2">
                <span>{activeCourseObj ? activeCourseObj.title : 'Course Videos'}</span>
                <span className="badge bg-gold/15 text-gold border-gold/30 text-[11px] font-mono">
                  {videos.length} {videos.length === 1 ? 'Lesson' : 'Lessons'}
                </span>
              </h2>
              <p className="text-xs text-ink/60 mt-0.5">
                {activeCourseObj
                  ? `Category: ${activeCourseObj.category?.name || 'General'} · Plan: ${activeCourseObj.plan?.name || 'Standard'}`
                  : 'Select a course to review its video playlist.'}
              </p>
            </div>

            {/* Quick Metrics Pills */}
            {selectedCourseId && videos.length > 0 && (
              <div className="flex items-center gap-2 text-xs font-mono">
                <span
                  className="px-2.5 py-1 rounded-lg bg-paper2 border border-ink/10 text-ink/70 flex items-center gap-1.5"
                  title="Total Course Runtime"
                >
                  <Clock size={13} className="text-gold" />
                  <span>{courseStats.durationStr}</span>
                </span>
                <span
                  className="px-2.5 py-1 rounded-lg bg-paper2 border border-ink/10 text-ink/70 flex items-center gap-1.5"
                  title="Total Encrypted Storage"
                >
                  <HardDrive size={13} className="text-teal" />
                  <span>{courseStats.sizeStr}</span>
                </span>
              </div>
            )}
          </div>

          {/* Search & Status Filter Bar */}
          {selectedCourseId && videos.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-1">
              {/* Search input */}
              <div className="relative flex-1 min-w-[180px]">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/40" />
                <input
                  type="text"
                  placeholder="Search lessons by title..."
                  value={videoSearch}
                  onChange={(e) => setVideoSearch(e.target.value)}
                  className="w-full pl-9 pr-7 py-1.5 text-xs rounded-xl bg-paper2/60 border border-ink/15 focus:border-gold focus:outline-none text-ink placeholder:text-ink/40 font-medium"
                />
                {videoSearch && (
                  <button
                    type="button"
                    onClick={() => setVideoSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink/40 hover:text-ink"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>

              {/* Status Filter Chips */}
              <div className="flex items-center gap-1 text-xs">
                {['ALL', 'READY', 'PROCESSING', 'FAILED'].map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setVideoFilter(st)}
                    className={`px-2.5 py-1 rounded-lg font-medium text-[11px] transition-colors ${
                      videoFilter === st
                        ? 'bg-gold text-white shadow-sm'
                        : 'bg-paper2 text-ink/60 hover:text-ink hover:bg-paper2/80'
                    }`}
                  >
                    {st === 'ALL'
                      ? 'All'
                      : st === 'READY'
                      ? `Ready (${courseStats.readyCount})`
                      : st === 'PROCESSING'
                      ? `Active (${courseStats.processingCount})`
                      : 'Failed'}
                  </button>
                ))}
              </div>
            </div>
          )}

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
            ) : filteredVideos.length === 0 ? (
              <div className="py-10 text-center text-ink/40 text-sm">
                <Search size={28} className="mx-auto mb-2 opacity-40" />
                No video lessons match your filter "{videoSearch || videoFilter}".
              </div>
            ) : (
              filteredVideos.map((vid, idx) => {
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
                  stageText = 'Initializing video record...'
                } else if (vid.status === 'UPLOADING') {
                  stageText = 'Phase 1: Streaming file to server storage (Do not close tab)...'
                } else if (vid.status === 'QUEUED') {
                  stageText = 'Phase 2: Saved on server! Queued for background worker (Safe to leave)...'
                } else if (vid.status === 'PROCESSING') {
                  if (progress < 85) {
                    stageText = `Phase 2: FFmpeg Multi-bitrate Transcoding (1080p+720p+360p) · ${progress}%`
                  } else {
                    stageText = `Phase 2: AES-128 DRM Packaging & Storage Upload · ${progress}%`
                  }
                } else if (isReady) {
                  stageText = '✓ Live: Protected Multi-Bitrate HLS Stream'
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
                    {/* Top Row: Index, Title, Meta, and Action Buttons */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <span className="w-8 h-8 rounded-xl bg-gold/15 text-gold text-xs font-mono font-bold flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                          {String(idx + 1).padStart(2, '0')}
                        </span>
                        <div className="min-w-0">
                          <h4 className="text-sm font-semibold text-ink truncate leading-tight">
                            {vid.title}
                          </h4>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-ink/60 mt-1.5 font-mono">
                            <span className="flex items-center gap-1 text-[11px]">
                              <Clock size={12} className="text-gold" />
                              {vid.durationSeconds
                                ? `${Math.floor(vid.durationSeconds / 60)}m ${vid.durationSeconds % 60}s`
                                : '0m 00s'}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1 text-[11px]">
                              <HardDrive size={12} className="text-teal" />
                              {vid.fileSizeBytes
                                ? `${(vid.fileSizeBytes / 1024 / 1024).toFixed(1)} MB`
                                : 'MP4'}
                            </span>
                            <span>•</span>
                            <span
                              className={`font-semibold px-2 py-0.5 rounded-full text-[10px] font-mono border ${
                                isReady
                                  ? 'bg-teal/10 text-teal border-teal/20'
                                  : isFailed
                                  ? 'bg-rust/10 text-rust border-rust/20'
                                  : 'bg-gold/15 text-gold border-gold/30 animate-pulse'
                              }`}
                            >
                              {isReady ? 'PUBLISHED' : vid.status || 'PENDING'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Top-Right Action Controls */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => copyVideoId(vid._id)}
                          className="p-1.5 text-ink/40 hover:text-ink rounded-lg hover:bg-paper2 transition-colors"
                          title={copiedId === vid._id ? 'Copied Video ID!' : 'Copy Video ID'}
                        >
                          {copiedId === vid._id ? (
                            <Check size={14} className="text-teal" />
                          ) : (
                            <Copy size={14} />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => onOpenDelete(vid)}
                          className="p-1.5 text-ink/40 hover:text-rust rounded-lg hover:bg-rust/10 transition-colors shrink-0"
                          title="Delete video lesson"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
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
                            5. Stream Live
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Ready Badges: Enterprise ABR Resolution Badges & DRM Lock */}
                    {isReady && (
                      <div className="mt-3 pt-2.5 border-t border-ink/10 flex flex-wrap items-center justify-between gap-2 text-xs">
                        {/* ABR Resolution Badges */}
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold bg-gold/15 text-gold border border-gold/25 shadow-2xs">
                            1080p FHD
                          </span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold bg-teal/10 text-teal border border-teal/20 shadow-2xs">
                            720p HD
                          </span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold bg-paper2 text-ink/70 border border-ink/10 shadow-2xs">
                            360p SD
                          </span>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold bg-card text-ink/70 border border-ink/10">
                            <Lock size={10} className="text-teal" />
                            <span>AES-128 DRM</span>
                          </span>
                        </div>

                        {/* Preview Stream trigger (Ready for Step 4) */}
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-ink/40 hidden sm:inline">
                            HLS Multi-Bitrate
                          </span>
                          {onPreviewVideo && (
                            <button
                              type="button"
                              onClick={() => onPreviewVideo(vid)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-gold/10 text-gold hover:bg-gold hover:text-white transition-all shadow-sm"
                            >
                              <Play size={11} fill="currentColor" />
                              <span>Preview</span>
                            </button>
                          )}
                        </div>
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