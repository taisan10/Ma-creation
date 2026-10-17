import { useEffect, useState } from 'react'
import AdminShell from '../../components/admin/AdminShell'
import { api } from '../../lib/api'
import { ShieldAlert, CheckCircle, Ban, XCircle, RefreshCw, Clock, Video as VideoIcon, User } from 'lucide-react'

export default function AdminSecurity() {
  const [incidents, setIncidents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState(null)
  const [filter, setFilter] = useState('all') // 'all' | 'pending_review' | 'approved_unlocked' | 'plan_revoked' | 'user_banned'

  function loadIncidents() {
    setLoading(true)
    setError('')
    const query = filter !== 'all' ? `?status=${filter}` : ''
    api(`/admin/security-incidents${query}`)
      .then(res => setIncidents(res.incidents || []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadIncidents()
  }, [filter])

  async function handleAction(endpoint, incidentId, successMsg) {
    if (!window.confirm('Are you sure you want to proceed with this action?')) return
    setActionLoading(incidentId)
    try {
      await api(`/admin/security-incidents/${incidentId}/${endpoint}`, { method: 'POST' })
      loadIncidents()
    } catch (err) {
      alert(`Action failed: ${err.message}`)
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <AdminShell>
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="eyebrow">DRM & Intellectual Property Defense</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                Live Protection
              </span>
            </div>
            <h1 className="h2 mt-1 flex items-center gap-2">
              <ShieldAlert className="text-red-500" size={28} />
              Security Alerts & Recording Incidents
            </h1>
            <p className="mt-1 text-ink/60 text-sm">
              Review flagged screen recordings, unlock honest users to resume from their saved timestamp, or revoke plans.
            </p>
          </div>
          <button
            onClick={loadIncidents}
            disabled={loading}
            className="btn-outline btn-sm self-start sm:self-auto flex items-center gap-1.5"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2 mt-6 border-b border-paper/10 pb-3">
          {[
            ['all', 'All Incidents'],
            ['pending_review', '⚠️ Pending Review'],
            ['approved_unlocked', '✅ Approved & Unlocked'],
            ['plan_revoked', '❌ Plan Revoked'],
            ['user_banned', '🚫 User Banned'],
          ].map(([val, label]) => (
            <button
              key={val}
              onClick={() => setFilter(val)}
              className={`px-3 py-1.5 text-xs rounded-lg font-medium transition ${
                filter === val
                  ? 'bg-ink text-paper shadow-sm'
                  : 'bg-paper text-ink/70 hover:bg-paper/80'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {error && <div className="mt-4 p-3 rounded-lg bg-rust/10 text-rust text-sm">{error}</div>}

        {/* Incidents List */}
        <div className="mt-6">
          {loading ? (
            <div className="py-12 text-center text-sm text-ink/50">Loading security incidents…</div>
          ) : incidents.length === 0 ? (
            <div className="card py-12 text-center text-sm text-ink/50">
              <CheckCircle size={36} className="mx-auto mb-2 text-green-500/70" />
              No security incidents found in this category. All streams protected.
            </div>
          ) : (
            <div className="space-y-4">
              {incidents.map(inc => {
                const mins = Math.floor((inc.lastWatchedSeconds || 0) / 60)
                const secs = (inc.lastWatchedSeconds || 0) % 60
                const isPending = inc.status === 'pending_review'
                const isWorking = actionLoading === inc._id

                return (
                  <div
                    key={inc._id}
                    className={`card p-5 border transition ${
                      isPending ? 'border-red-300/80 bg-red-50/20 shadow-sm' : 'border-paper/20'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      {/* Left: User & Video info */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-ink flex items-center gap-1.5 text-sm">
                            <User size={15} className="text-ink/60" />
                            {inc.user?.name || 'Unknown User'} ({inc.user?.email || 'N/A'})
                          </span>
                          {inc.user?.phone && (
                            <span className="text-xs text-ink/50">· {inc.user.phone}</span>
                          )}
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-amber-100 text-amber-900 border border-amber-300">
                            Strikes: {inc.user?.recordingStrikes || 1}
                          </span>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${
                              isPending
                                ? 'bg-red-100 text-red-800 border border-red-300 animate-pulse'
                                : inc.status === 'approved_unlocked'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {inc.status}
                          </span>
                        </div>

                        <div className="text-xs text-ink/70 flex flex-wrap items-center gap-3">
                          <span className="flex items-center gap-1">
                            <VideoIcon size={13} className="text-ink/50" />
                            Video: <b>{inc.video?.title || 'Unknown Video'}</b>
                          </span>
                          {inc.course?.title && (
                            <span>Course: {inc.course.title}</span>
                          )}
                          <span className="flex items-center gap-1 text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            <Clock size={12} />
                            Last Watched: {mins}m {secs}s
                          </span>
                        </div>

                        <div className="text-[11px] text-ink/50 flex flex-wrap gap-2">
                          <span>Trigger: <b className="text-red-700">{inc.type}</b></span>
                          {inc.ip && <span>IP: {inc.ip}</span>}
                          <span>Time: {new Date(inc.createdAt).toLocaleString()}</span>
                        </div>
                      </div>

                      {/* Right: Action Buttons */}
                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        {isPending ? (
                          <>
                            <button
                              onClick={() => handleAction('resolve', inc._id, 'Playback unlocked')}
                              disabled={isWorking}
                              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-green-600 hover:bg-green-700 text-white flex items-center gap-1.5 transition shadow-sm"
                            >
                              <CheckCircle size={14} />
                              Approve & Unlock
                            </button>
                            <button
                              onClick={() => handleAction('revoke-plan', inc._id, 'Plan revoked')}
                              disabled={isWorking}
                              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-1.5 transition shadow-sm"
                            >
                              <XCircle size={14} />
                              Revoke Plan
                            </button>
                            <button
                              onClick={() => handleAction('ban-user', inc._id, 'User banned')}
                              disabled={isWorking}
                              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-700 hover:bg-red-800 text-white flex items-center gap-1.5 transition shadow-sm"
                            >
                              <Ban size={14} />
                              Ban User
                            </button>
                          </>
                        ) : (
                          <div className="text-xs text-ink/40 italic">
                            Resolved on {inc.resolvedAt ? new Date(inc.resolvedAt).toLocaleDateString() : 'N/A'}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </AdminShell>
  )
}
