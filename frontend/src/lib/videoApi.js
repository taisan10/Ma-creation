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
