import './App.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LandingPage from './pages/landing'
import UserDashboard from './pages/welcome'
import UserHistoryPage from './pages/user-history'
import SpellCheckPage from './pages/spell-check'
import UserLayout from './components/user/UserLayout'
import AdminLayout from './components/admin/AdminLayout'
import AdminDashboard from './pages/admin/dashboard'
import AdminJournals from './pages/admin/journals'
import AdminDictionary from './pages/admin/dictionary'
import AdminHistory from './pages/admin/history'
import AdminSettings from './pages/admin/settings'
import LoginPage from './pages/login'
import SignUpPage from './pages/signup'
import ProtectedRoute from './components/ProtectedRoute'


function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />

        {/* Protected User Routes — dibungkus UserLayout untuk header konsisten */}
        <Route path="/dashboard" element={
          <ProtectedRoute requiredRole="user">
            <UserLayout />
          </ProtectedRoute>
        }>
          <Route index element={<UserDashboard />} />
          <Route path="history" element={<UserHistoryPage />} />
        </Route>

        <Route path="/spell-check" element={
          <ProtectedRoute requiredRole="user">
            <SpellCheckPage />
          </ProtectedRoute>
        } />

        {/* Admin Routes */}
        <Route path="/admin" element={
          <ProtectedRoute requiredRole="admin">
            <AdminLayout />
          </ProtectedRoute>
        }>
          <Route index element={<AdminDashboard />} />
          <Route path="journals" element={<AdminJournals />} />
          <Route path="dictionary" element={<AdminDictionary />} />
          <Route path="history" element={<AdminHistory />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
