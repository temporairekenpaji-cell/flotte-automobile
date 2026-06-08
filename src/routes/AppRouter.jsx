import { Routes, Route, Outlet, Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import DefaultLayout from '../layouts/DefaultLayout'
import Login from '../pages/Login'
import Dashboard from '../pages/Dashboard'
import Vehicles from '../pages/Vehicles'
import Drivers from '../pages/Drivers'
import Missions from '../pages/Missions'
import Maintenance from '../pages/Maintenance'
import Fuel from '../pages/Fuel'
import Alerts from '../pages/Alerts'
import Notifications from '../pages/Notifications'
import Tolls from '../pages/Tolls'
import RoadChecks from '../pages/RoadChecks'
import Statistics from '../pages/Statistics'
import Settings from '../pages/Settings'
import NotFound from '../pages/NotFound'
import PrivacyPolicy from '../pages/PrivacyPolicy'
import TermsOfUse from '../pages/TermsOfUse'

function AuthLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
      <div className="rounded-3xl border border-slate-800 bg-slate-900/95 p-8 shadow-xl shadow-slate-950/30">
        <p className="text-lg font-semibold text-emerald-400">Chargement...</p>
      </div>
    </div>
  )
}

function ProtectedRoute({ children }) {
  const { user, token, loading } = useAuth()

  if (loading) {
    return <AuthLoading />
  }

  if (!user || !token) {
    return <Navigate to="/login" replace />
  }

  return children
}

function GuestRoute({ children }) {
  const { user, token, loading } = useAuth()

  if (loading) {
    return <AuthLoading />
  }

  if (user && token) {
    return <Navigate to="/" replace />
  }

  return children
}

function DefaultRoute() {
  return (
    <ProtectedRoute>
      <DefaultLayout>
        <Outlet />
      </DefaultLayout>
    </ProtectedRoute>
  )
}

export default function AppRouter() {
  return (
    <Routes>
      {/* Public routes — accessible sans authentification */}
      <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      <Route path="/terms-of-use" element={<TermsOfUse />} />
      <Route path="/register" element={<Navigate to="/login" replace />} />
      {/* Protected routes */}
      <Route element={<DefaultRoute />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/vehicles" element={<Vehicles />} />
        <Route path="/drivers" element={<Drivers />} />
        <Route path="/missions" element={<Missions />} />
        <Route path="/maintenance" element={<Maintenance />} />
        <Route path="/fuel" element={<Fuel />} />
        <Route path="/alerts" element={<Alerts />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/tolls" element={<Tolls />} />
        <Route path="/road-checks" element={<RoadChecks />} />
        <Route path="/statistics" element={<Statistics />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
