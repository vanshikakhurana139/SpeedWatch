import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import { authApi } from './api/auth'

// ProtectedRoute: if not logged in, send to /login
function ProtectedRoute({ children }) {
  if (!authApi.isAuthenticated()) {
    return <Navigate to="/login" replace />
  }
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      {/* All dashboard pages (live map, reports, leaderboard) render inside DashboardPage
                using the activePage state from dashboardStore — no separate routes needed */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />

      {/* Root → dashboard if logged in, else login */}
      <Route
        path="/"
        element={
          authApi.isAuthenticated()
            ? <Navigate to="/dashboard" replace />
            : <Navigate to="/login" replace />
        }
      />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}