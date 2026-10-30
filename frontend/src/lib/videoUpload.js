import { API_URL } from './api'

function formatBytes(bytes, decimals = 1) {
  if (!bytes || bytes === 0) return '0 B'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

function formatDuration(seconds) {
  if (!seconds || seconds <= 0 || !isFinite(seconds)) return ''
  const s = Math.round(seconds)
  if (s < 60) return `${s}s left`
  const m = Math.floor(s / 60)
  const remSec = s % 60
  return remSec > 0 ? `${m}m ${remSec}s left` : `${m}m left`
}

/**
 * Enterprise XHR Upload with Real-time Byte Progress, Speed & ETA tracking
 * Directly streams file to the backend without fake jumps.
 *
 * @param {Object} options
 * @param {string} options.videoId - The MongoDB ID of the video record
 * @param {File} options.file - The video file to stream
 * @param {Function} options.onProgress - Callback with rich progress metrics
 * @param {Function} [options.onAbortRef] - Callback receiving the abort handler
 * @returns {Promise<Object>} Parsed JSON response from server
 */
export function uploadVideoWithRealProgress({ videoId, file, onProgress, onAbortRef }) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    const url = `${API_URL}/admin/lms/videos/${encodeURIComponent(videoId)}/upload`

    if (typeof onAbortRef === 'function') {
      onAbortRef(() => {
        xhr.abort()
        reject(new Error('Upload cancelled by user.'))
      })
    }

    const formData = new FormData()
    formData.append('video', file, file.name)

    const startTime = Date.now()
    let lastTime = startTime
    let lastLoaded = 0
    let smoothedSpeed = 0

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) return

      const now = Date.now()
      const timeDiff = (now - lastTime) / 1000

      if (timeDiff >= 0.3) {
        const bytesDiff = event.loaded - lastLoaded
        const currentSpeed = bytesDiff / timeDiff
        smoothedSpeed = smoothedSpeed === 0 ? currentSpeed : smoothedSpeed * 0.7 + currentSpeed * 0.3
        lastTime = now
        lastLoaded = event.loaded
      }

      const percent = Math.min(100, Math.round((event.loaded / event.total) * 100))
      const remainingBytes = Math.max(0, event.total - event.loaded)
      const etaSeconds = smoothedSpeed > 0 ? remainingBytes / smoothedSpeed : null

      const stats = {
        percent,
        loadedBytes: event.loaded,
        totalBytes: event.total,
        formattedLoaded: `${formatBytes(event.loaded)} / ${formatBytes(event.total)}`,
        formattedSpeed: smoothedSpeed > 0 ? `${formatBytes(smoothedSpeed)}/s` : 'Calculating...',
        formattedEta: formatDuration(etaSeconds),
      }

      if (typeof onProgress === 'function') {
        onProgress(stats)
      }
    }

    xhr.onload = () => {
      try {
        const res = xhr.responseText ? JSON.parse(xhr.responseText) : {}
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(res)
        } else {
          reject(new Error(res.message || `Upload failed with HTTP ${xhr.status}`))
        }
      } catch {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve({ success: true })
        } else {
          reject(new Error(`Server error (${xhr.status}): Could not parse upload response`))
        }
      }
    }

    xhr.onerror = () => {
      reject(new Error('Network error: Connection lost while streaming video to server.'))
    }

    xhr.ontimeout = () => {
      reject(new Error('Upload timed out. Please check your connection and try again.'))
    }

    xhr.open('POST', url)
    const token = localStorage.getItem('mac_token')
    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`)
    }
    xhr.withCredentials = true

    xhr.send(formData)
  })
}

