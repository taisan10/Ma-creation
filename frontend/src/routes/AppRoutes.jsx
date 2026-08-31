import { Navigate, Route, Routes } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Home from '../pages/Home'
import About from '../pages/About'
import Services from '../pages/Services'
import Plans from '../pages/Plans'
import Login from '../pages/Login'
import Policies from '../pages/Policies'
import Account from '../pages/Account'
import Courses from '../pages/Courses'
import CourseDetail from '../pages/CourseDetail'
import WatchVideo from '../pages/WatchVideo'
import Theme from '../pages/Theme'
import NotFound from '../pages/NotFound'
import AdminDashboard from '../pages/admin/AdminDashboard'
import AdminUsers from '../pages/admin/AdminUsers'
import AdminLeads from '../pages/admin/AdminLeads'
import AdminPayments from '../pages/admin/AdminPayments'
import AdminCatalog from '../pages/admin/AdminCatalog'
import AdminPages from '../pages/admin/AdminPages'
import AdminFaqs from '../pages/admin/AdminFaqs'
import AdminPartners from '../pages/admin/AdminPartners'
import AdminSettings from '../pages/admin/AdminSettings'
import AdminBooks from '../pages/admin/AdminBooks'
import AdminCourses from '../pages/admin/AdminCourses'
import { getUser } from '../lib/api'

function AdminRoute({ children }) {
  const [user, setUser] = useState(() => getUser())
  useEffect(() => {
    const handleStorage = () => setUser(getUser())
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])
  return user?.role === 'admin' ? children : <Navigate to="/login" replace />
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/about" element={<About />} />
      <Route path="/services" element={<Services />} />
      <Route path="/plans" element={<Plans />} />
      <Route path="/login" element={<Login />} />
      <Route path="/policies" element={<Policies />} />
      <Route path="/account" element={<Account />} />
       <Route path="/courses" element={<Courses />} />
      <Route path="/courses/:courseId" element={<CourseDetail />} />
      <Route path="/courses/:courseId/watch/:videoId" element={<WatchVideo />} />
      <Route path="/theme" element={<Theme />} />
      <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
      <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
      <Route path="/admin/leads" element={<AdminRoute><AdminLeads /></AdminRoute>} />
      <Route path="/admin/payments" element={<AdminRoute><AdminPayments /></AdminRoute>} />
      <Route path="/admin/catalog" element={<AdminRoute><AdminCatalog /></AdminRoute>} />
      <Route path="/admin/pages" element={<AdminRoute><AdminPages /></AdminRoute>} />
      <Route path="/admin/faqs" element={<AdminRoute><AdminFaqs /></AdminRoute>} />
      <Route path="/admin/partners" element={<AdminRoute><AdminPartners /></AdminRoute>} />
      <Route path="/admin/settings" element={<AdminRoute><AdminSettings /></AdminRoute>} />
      <Route path="/admin/books" element={<AdminRoute><AdminBooks /></AdminRoute>} />
      <Route path="/admin/courses" element={<AdminRoute><AdminCourses /></AdminRoute>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
