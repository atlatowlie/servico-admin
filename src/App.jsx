import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Tenants from './pages/Tenants'
import TenantDetail from './pages/TenantDetail'
import PhoneNumbers from './pages/PhoneNumbers'
import SystemHealth from './pages/SystemHealth'
import TwilioSettings from './pages/TwilioSettings'

function ProtectedRoute({ children }) {
  const { user, isLoading } = useAuth()
  if (isLoading) return <div className="flex items-center justify-center h-screen text-slate-400">Loading...</div>
  if (!user) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="tenants" element={<Tenants />} />
        <Route path="tenants/:id" element={<TenantDetail />} />
        <Route path="phone-numbers" element={<PhoneNumbers />} />
        <Route path="twilio-settings" element={<TwilioSettings />} />
        <Route path="health" element={<SystemHealth />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
