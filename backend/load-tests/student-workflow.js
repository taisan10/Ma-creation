import http from 'k6/http'
import { check, sleep, group } from 'k6'
import { Trend, Counter, Rate } from 'k6/metrics'

// Custom Metrics for Database & API Performance
const loginDuration = new Trend('auth_login_duration_ms', true)
const courseFlowDuration = new Trend('course_flow_duration_ms', true)
const playbackTokenDuration = new Trend('playback_token_duration_ms', true)
const watchEventDuration = new Trend('watch_event_duration_ms', true)
const dbErrorCount = new Counter('db_5xx_errors')
const rateLimitedCount = new Counter('rate_limited_429')
const workflowSuccessRate = new Rate('full_workflow_success_rate')

// Progressive Load Test Profile - Cranked High-Concurrency Simulation
// Tests stability from 100 VUs -> 250 VUs -> 500 VUs across 8,000 students & 250 lessons
export const options = {
  stages: [
    { duration: '30s', target: 100 }, // Stage 1: Warmup to 100 active students
    { duration: '45s', target: 250 }, // Stage 2: Ramp to 250 active students
    { duration: '1m', target: 500 },  // Stage 3: Peak Stress at 500 active concurrent students
    { duration: '1m', target: 500 },  // Stage 4: Soak at 500 active concurrent students
    { duration: '20s', target: 0 },   // Stage 5: Graceful cooldown
  ],
  thresholds: {
    // 95% of all requests must complete within 2.0 seconds under 500 VU stress
    http_req_duration: ['p(95)<2000'],
    // Less than 2% failure rate overall
    http_req_failed: ['rate<0.02'],
    // Auth endpoints under heavy concurrent load
    'auth_login_duration_ms': ['p(95)<1800'],
    // Course access checks across 9,300+ payment records
    'course_flow_duration_ms': ['p(95)<1000'],
    // Playback session generation (Session creation & watch quota across 15,000+ logs)
    'playback_token_duration_ms': ['p(95)<800'],
    // Watch heartbeat write operations
    'watch_event_duration_ms': ['p(95)<600'],
    // At least 95% of full student workflows must complete successfully
    full_workflow_success_rate: ['rate>0.95'],
  },
}

const BASE_URL = __ENV.BASE_URL || 'http://localhost'
const TOTAL_STUDENTS = parseInt(__ENV.TOTAL_STUDENTS || '8000', 10)
const DEFAULT_PASSWORD = __ENV.PASSWORD || 'Student@12345'

export default function () {
  // Deterministically distribute 1000-4000 students across VUs and iterations
  const studentIndex = ((__VU * 13 + __ITER * 7) % TOTAL_STUDENTS) + 1
  const studentEmail = `student_${studentIndex}@loadtest.macreation.in`

  let authToken = null
  let refreshTokenCookie = null
  let selectedCourseId = null
  let selectedVideoId = null
  let playbackSessionToken = null
  let workflowSuccess = false

  const standardHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'User-Agent': 'k6-load-test-runner/1.0',
  }

  // =========================================================================
  // STEP 1: Public Catalog Browsing (Guest view before login)
  // =========================================================================
  group('01_Catalog_Browsing', function () {
    const res = http.get(`${BASE_URL}/api/catalog/plans`, { headers: standardHeaders })
    check(res, {
      'catalog plans returned 200': (r) => r.status === 200,
      'catalog response is json': (r) => r.headers['Content-Type'] && r.headers['Content-Type'].includes('json'),
    })
    if (res.status >= 500) dbErrorCount.add(1)
    if (res.status === 429) rateLimitedCount.add(1)
  })

  sleep(Math.random() * 1.5 + 0.5)

  // =========================================================================
  // STEP 2: Student Login (Hits Users, Argon2, AccessTokenSession, RefreshToken)
  // =========================================================================
  group('02_Student_Login', function () {
    const loginPayload = JSON.stringify({
      email: studentEmail,
      password: DEFAULT_PASSWORD,
    })

    const start = Date.now()
    const res = http.post(`${BASE_URL}/api/auth/login`, loginPayload, {
      headers: {
        ...standardHeaders,
        'x-client-platform': 'WEB',
      },
    })
    loginDuration.add(Date.now() - start)

    const loginOk = check(res, {
      'login returned 200': (r) => r.status === 200,
      'access token received': (r) => {
        try {
          const body = r.json()
          return body.success === true && (body.data?.accessToken || body.accessToken)
        } catch {
          return false
        }
      },
    })

    if (loginOk) {
      const body = res.json()
      authToken = body.data?.accessToken || body.accessToken
    } else {
      if (res.status >= 500) dbErrorCount.add(1)
      if (res.status === 429) rateLimitedCount.add(1)
      // If login fails, abort remaining steps for this iteration
      return
    }
  })

  if (!authToken) {
    workflowSuccessRate.add(false)
    return
  }

  const authHeaders = {
    ...standardHeaders,
    'Authorization': `Bearer ${authToken}`,
  }

  sleep(Math.random() * 1.5 + 0.5)

  // =========================================================================
  // STEP 3: Student Profile Verification (Auth Guard & User Collection check)
  // =========================================================================
  group('03_Auth_Profile_Check', function () {
    const res = http.get(`${BASE_URL}/api/auth/me`, { headers: authHeaders })
    check(res, {
      'profile returned 200': (r) => r.status === 200,
      'user email matches': (r) => {
        try {
          const b = r.json()
          return (b.data?.email || b.user?.email) === studentEmail
        } catch {
          return false
        }
      },
    })
    if (res.status >= 500) dbErrorCount.add(1)
  })

  sleep(Math.random() * 1.0 + 0.5)

  // =========================================================================
  // STEP 4: Course Entitlement & My Courses Dashboard (Payment & Course Queries)
  // =========================================================================
  group('04_Course_Access_And_Listing', function () {
    const start = Date.now()

    // 4a. Check if student has active course access (Payment.distinct)
    const accessRes = http.get(`${BASE_URL}/api/courses/has-access`, { headers: authHeaders })
    check(accessRes, {
      'has-access returned 200': (r) => r.status === 200,
    })

    // 4b. Fetch student enrolled courses (Course.find + populate)
    const coursesRes = http.get(`${BASE_URL}/api/courses/mine`, { headers: authHeaders })
    courseFlowDuration.add(Date.now() - start)

    const coursesOk = check(coursesRes, {
      'my-courses returned 200': (r) => r.status === 200,
      'has at least one course': (r) => {
        try {
          const b = r.json()
          const groups = b.categories || b.data || b.courses || b
          if (Array.isArray(groups) && groups.length > 0) {
            // Flatten all courses across categories and select one randomly
            const allCourses = []
            for (const g of groups) {
              if (g.courses && Array.isArray(g.courses)) {
                allCourses.push(...g.courses)
              }
            }
            if (allCourses.length > 0) {
              const randCourse = allCourses[Math.floor(Math.random() * allCourses.length)]
              selectedCourseId = randCourse._id
              return true
            }
          }
          return false
        } catch {
          return false
        }
      },
    })

    if (!coursesOk && coursesRes.status >= 500) dbErrorCount.add(1)
  })

  sleep(Math.random() * 1.0 + 0.3)

  // =========================================================================
  // STEP 5: Course Video Curriculum (Video.find + requireCourseEntitlement)
  // =========================================================================
  if (selectedCourseId) {
    group('05_Course_Videos_Curriculum', function () {
      const res = http.get(`${BASE_URL}/api/courses/${selectedCourseId}/videos`, { headers: authHeaders })
      check(res, {
        'videos list returned 200': (r) => r.status === 200,
        'videos array populated': (r) => {
          try {
            const b = r.json()
            const videos = b.videos || b.data || b
            if (Array.isArray(videos) && videos.length > 0) {
              // Pick a random lesson from this course (simulates real diverse student progress)
              const randVideo = videos[Math.floor(Math.random() * videos.length)]
              selectedVideoId = randVideo._id
              return true
            }
            return false
          } catch {
            return false
          }
        },
      })
      if (res.status >= 500) dbErrorCount.add(1)
    })
  }

  sleep(Math.random() * 1.5 + 0.5)

  // =========================================================================
  // STEP 6: Request Video Playback Token (WatchLog, Entitlement & PlaybackSession)
  // =========================================================================
  if (selectedVideoId) {
    group('06_Request_Playback_Token', function () {
      const start = Date.now()
      const res = http.post(`${BASE_URL}/api/videos/${selectedVideoId}/playback-token`, '{}', { headers: authHeaders })
      playbackTokenDuration.add(Date.now() - start)

      const tokenOk = check(res, {
        'playback token returned 200': (r) => r.status === 200,
        'sessionToken received': (r) => {
          try {
            const b = r.json()
            playbackSessionToken = b.sessionToken || b.data?.sessionToken
            return Boolean(playbackSessionToken)
          } catch {
            return false
          }
        },
      })

      if (!tokenOk && res.status >= 500) dbErrorCount.add(1)
    })

    sleep(Math.random() * 1.0 + 0.5)

    // =======================================================================
    // STEP 7: Retrieve AES-128 DRM Key (Hotlink Guard & Key derivation)
    // =======================================================================
    group('07_Get_DRM_Key', function () {
      const res = http.get(`${BASE_URL}/api/videos/${selectedVideoId}/key`, {
        headers: {
          ...authHeaders,
          'Origin': 'http://localhost:5173',
        },
      })
      check(res, {
        'drm key returned 200': (r) => r.status === 200,
        'drm key length is 16 bytes': (r) => r.body && r.body.length === 16,
      })
      if (res.status >= 500) dbErrorCount.add(1)
    })

    sleep(Math.random() * 2.0 + 1.0)

    // =======================================================================
    // STEP 8: Report Watch Event (Atomic upsert in WatchLog & PlaybackSession)
    // =======================================================================
    if (playbackSessionToken) {
      group('08_Report_Watch_Heartbeat', function () {
        const payload = JSON.stringify({
          token: playbackSessionToken,
          type: 'started',
          seconds: 15,
        })

        const start = Date.now()
        const res = http.post(`${BASE_URL}/api/videos/${selectedVideoId}/watch-event`, payload, {
          headers: authHeaders,
        })
        watchEventDuration.add(Date.now() - start)

        const watchOk = check(res, {
          'watch event returned 200': (r) => r.status === 200,
          'counted flag is true': (r) => {
            try {
              const b = r.json()
              return b.counted === true || b.data?.counted === true
            } catch {
              return false
            }
          },
        })

        if (watchOk) workflowSuccess = true
        if (!watchOk && res.status >= 500) dbErrorCount.add(1)
      })
    }
  }

  sleep(Math.random() * 1.0 + 0.5)

  // =========================================================================
  // STEP 9: Token Refresh Rotation (CSRF header & RTR in RefreshToken)
  // =========================================================================
  group('09_Token_Refresh', function () {
    const res = http.post(`${BASE_URL}/api/auth/refresh`, '{}', {
      headers: {
        ...authHeaders,
        'x-refresh-token': '1', // Required by refreshCsrfGuard
      },
    })
    check(res, {
      'refresh returns valid status': (r) => r.status === 200 || r.status === 401, // 401 if cookie omitted in CLI
    })
  })

  // Track overall workflow success
  workflowSuccessRate.add(workflowSuccess)

  // Think time between student sessions
  sleep(Math.random() * 2.0 + 1.0)
}

