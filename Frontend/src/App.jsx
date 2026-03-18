import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import ResetPassword from './pages/ResetPassword'
import AdminDashboard from './pages/AdminDashboard'
import EmployeeDashboard from './pages/EmployeeDashboard'
import RootDashboard from './pages/RootDashboard'
import ChangePassword from './pages/ChangePassword'
import ForgotPassword from './pages/ForgotPassword'

import DeveloperDashboard from './pages/DeveloperDashboard'
import Payslips from './pages/Payslips'
import Chat from './pages/Chat'
import Announcements from './pages/Announcements'
import { useAuth } from './context/authContext.jsx'

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user } = useAuth()

  if (!user) return <Navigate to="/login" replace />
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/login" replace />

  return children
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<Navigate to="/login" />} />
        <Route path='/login' element={<Login />} />
        <Route path='/reset-password' element={<ResetPassword />} />
        <Route path='/change-password' element={<ChangePassword />} />
        <Route path='/forgot-password' element={<ForgotPassword />} />

        <Route
          path='/root-dashboard'
          element={
            <ProtectedRoute allowedRoles={['root']}>
              <RootDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path='/admin-dashboard'
          element={
            <ProtectedRoute allowedRoles={['admin', 'manager']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path='/employee-dashboard'
          element={
            <ProtectedRoute allowedRoles={['developer']}>
              <EmployeeDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path='/developer-dashboard'
          element={
            <ProtectedRoute allowedRoles={['developer', 'teamlead']}>
              <DeveloperDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path='/payslips'
          element={
            <ProtectedRoute allowedRoles={['developer', 'teamlead']}>
              <Payslips />
            </ProtectedRoute>
          }
        />

        <Route
          path='/chat'
          element={
            <ProtectedRoute allowedRoles={['developer', 'teamlead', 'manager', 'hr', 'admin', 'root']}>
              <Chat />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App