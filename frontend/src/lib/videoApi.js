import { api } from './api'


export function hasPaidCourses() {
  return api('/courses/has-access')
}

// Returns { categories: [{ category, courses: [...] }] } -- courses the
// logged-in user has actually paid for, grouped by category. Powers
// CoursesUnlockedPage.
export function fetchMyCourses() {
  return api('/courses/mine')
}

// Returns { course, videos: [...] } for one course -- only succeeds if the
// backend's requireCourseEntitlement middleware confirms this user owns the
// plan that unlocks it (see Part 4). If not, api() throws with e.status===403.
export function fetchCourseVideos(courseId) {
  return api(`/courses/${courseId}/videos`)
}

// Requests a one-time-use presigned playback URL + PlaybackSession token.
// Throws with e.code === 'WATCH_LIMIT_REACHED' if this user has already hit
// the max-watches cap for this video (see Part 5's videoController).
export function requestPlaybackToken(videoId) {
  return api(`/videos/${videoId}/playback-token`, { method: 'POST' })
}

// Reports what actually happened during playback: 'started', 'ended',
// 'recording_suspected', or 'incognito_suspected'. Used by Part 7's player
// and Part 8's detection logic.
export function reportWatchEvent(videoId, token, type, seconds = 0 ) {
  return api(`/videos/${videoId}/watch-event`, {
    method: 'POST',
    body: JSON.stringify({ token, type, seconds })
  })
}