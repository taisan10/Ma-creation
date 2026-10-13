import { CourseService } from '../services/course.service.js'

export async function createCategory(req, res) {
  const category = await CourseService.createCategory(req.body)
  res.status(201).json({ success: true, category })
}

export async function listCategoriesAdmin(req, res) {
  const categories = await CourseService.listCategoriesAdmin()
  res.json({ success: true, categories })
}

export async function createCourse(req, res) {
  const course = await CourseService.createCourse(req.body)
  res.status(201).json({ success: true, course })
}

export async function listCoursesAdmin(req, res) {
  const courses = await CourseService.listCoursesAdmin()
  res.json({ success: true, courses })
}

export async function createVideoMeta(req, res) {
  const video = await CourseService.createVideoMeta(req.body)
  res.status(201).json({ success: true, video })
}

export async function listVideosAdmin(req, res) {
  const videos = await CourseService.listVideosAdmin(req.query.courseId)
  res.json({ success: true, videos })
}

export async function uploadVideoFile(req, res) {
  const video = await CourseService.finalizeVideoUpload(req.params.id, req.uploadedVideo)
  res.json({ success: true, video })
}

export async function deleteVideo(req, res) {
  await CourseService.deleteVideo(req.params.id)
  res.json({ success: true })
}

export async function deleteCourse(req, res) {
  await CourseService.deleteCourse(req.params.id)
  res.json({ success: true })
}

export async function deleteCategory(req, res) {
  await CourseService.deleteCategory(req.params.id)
  res.json({ success: true })
}

export async function hasAnyPaidCourse(req, res) {
  const hasCourses = await CourseService.hasAnyPaidCourse(req.user.sub)
  res.json({ success: true, hasCourses })
}

export async function listMyCourses(req, res) {
  const categories = await CourseService.listUserCourses(req.user.sub)
  res.json({ success: true, categories })
}

export async function getCourseVideos(req, res) {
  const videos = await CourseService.getCourseVideos(req.course._id)
  res.json({
    success: true,
    course: { _id: req.course._id, title: req.course.title, description: req.course.description },
    videos,
  })
}