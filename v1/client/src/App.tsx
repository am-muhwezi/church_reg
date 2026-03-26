import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

// Registration flow
import CheckIn from './pages/CheckIn'
import MemberFound from './pages/MemberFound'
import Register from './pages/Register'
import Welcome from './pages/Welcome'

// Admin
import AdminLayout from './components/AdminLayout'
import AdminLogin from './pages/admin/Login'
import Dashboard from './pages/admin/Dashboard'
import Saints from './pages/admin/Saints'
import SaintDetail from './pages/admin/SaintDetail'
import Reports from './pages/admin/Reports'
import AdminSettings from './pages/admin/AdminSettings'
import RequireAuth from './components/RequireAuth'
import { AuthProvider } from './context/AuthContext'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* --- Public registration flow --- */}
          <Route path="/" element={<CheckIn />} />
          <Route path="/confirm" element={<MemberFound />} />
          <Route path="/register" element={<Register />} />
          <Route path="/welcome" element={<Welcome />} />

          {/* --- Admin login (public) --- */}
          <Route path="/admin/login" element={<AdminLogin />} />

          {/* --- Protected admin area --- */}
          <Route element={<RequireAuth />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="saints" element={<Saints />} />
              <Route path="saints/:id" element={<SaintDetail />} />
              <Route path="checkin" element={<Navigate to="/" replace />} />
              <Route path="reports" element={<Reports />} />
              <Route path="settings" element={<AdminSettings />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
