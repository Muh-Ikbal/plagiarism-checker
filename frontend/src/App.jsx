import './App.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Welcome from './pages/welcome'
import SpellCheckPage from './pages/spell-check'
import AdminLayout from './components/admin/AdminLayout'
import AdminDashboard from './pages/admin/dashboard'
import AdminJournals from './pages/admin/journals'
import AdminDictionary from './pages/admin/dictionary'
import AdminHistory from './pages/admin/history'
import AdminSettings from './pages/admin/settings'
import LoginPage from './pages/login'
import SignUpPage from './pages/signup'


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/spell-check" element={<SpellCheckPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />

        {/* Admin Routes */}
        <Route path="/admin" element={<AdminLayout />}>
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

