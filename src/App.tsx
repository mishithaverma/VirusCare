import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './state/AuthContext'
import { ToastProvider } from './state/ToastContext'
import { FacilityProvider } from './state/FacilityContext'
import { ConfirmProvider } from './components/ConfirmDialog'
import { ErrorBoundary } from './components/ErrorBoundary'
import { Toaster } from './components/Toaster'
import { Layout } from './components/Layout'
import { RequireAuth, RequireRole } from './components/RouteGuard'
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import { TemperaturePage } from './pages/Temperature'
import { VisitsPage } from './pages/Visits'
import { DischargePage } from './pages/Discharge'
import { PatientsPage } from './pages/Patients'
import { ReportsPage } from './pages/Reports'
import { SettingsPage } from './pages/Settings'
import { NotFound } from './pages/NotFound'

function LoginRoute() {
  const { role } = useAuth()
  if (role) return <Navigate to="/dashboard" replace />
  return <Login />
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ToastProvider>
          <ConfirmProvider>
            <FacilityProvider>
              <BrowserRouter>
                <Routes>
                  <Route path="/login" element={<LoginRoute />} />
                  <Route
                    element={
                      <RequireAuth>
                        <Layout />
                      </RequireAuth>
                    }
                  >
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route
                      path="/temperature"
                      element={
                        <RequireRole roles={['nurse']}>
                          <TemperaturePage />
                        </RequireRole>
                      }
                    />
                    <Route
                      path="/visits"
                      element={
                        <RequireRole roles={['doctor']}>
                          <VisitsPage />
                        </RequireRole>
                      }
                    />
                    <Route
                      path="/discharge"
                      element={
                        <RequireRole roles={['admin', 'doctor']}>
                          <DischargePage />
                        </RequireRole>
                      }
                    />
                    <Route
                      path="/patients"
                      element={
                        <RequireRole roles={['admin', 'manager']}>
                          <PatientsPage />
                        </RequireRole>
                      }
                    />
                    <Route
                      path="/reports"
                      element={
                        <RequireRole roles={['manager']}>
                          <ReportsPage />
                        </RequireRole>
                      }
                    />
                    <Route path="/settings" element={<SettingsPage />} />
                    <Route path="*" element={<NotFound />} />
                  </Route>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </BrowserRouter>
              <Toaster />
            </FacilityProvider>
          </ConfirmProvider>
        </ToastProvider>
      </AuthProvider>
    </ErrorBoundary>
  )
}
