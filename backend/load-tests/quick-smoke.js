import http from 'k6/http'
import { check, sleep } from 'k6'

export const options = {
  vus: 5,
  duration: '15s',
  thresholds: {
    http_req_duration: ['p(95)<1000'],
    http_req_failed: ['rate<0.01'],
  },
}

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000'

export default function () {
  // 1. Health
  const healthRes = http.get(`${BASE_URL}/api/health`)
  check(healthRes, {
    'health check is 200': (r) => r.status === 200,
  })

  // 2. Catalog Plans
  const plansRes = http.get(`${BASE_URL}/api/catalog/plans`)
  check(plansRes, {
    'plans status is 200': (r) => r.status === 200,
  })

  // 3. Catalog Services
  const servicesRes = http.get(`${BASE_URL}/api/catalog/services`)
  check(servicesRes, {
    'services status is 200': (r) => r.status === 200,
  })

  sleep(1)
}

