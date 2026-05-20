import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/contexts/AuthContext'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import TenantLayout from '@/components/layout/TenantLayout'
import AdminLayout from '@/components/layout/AdminLayout'

import LoginPage from '@/pages/auth/LoginPage'
import DashboardPage from '@/pages/tenant/DashboardPage'
import ProjectStatusPage from '@/pages/tenant/ProjectStatusPage'
import ApartmentPage from '@/pages/tenant/ApartmentPage'
import DocumentsPage from '@/pages/tenant/DocumentsPage'
import TeamPage from '@/pages/tenant/TeamPage'
import ChatPage from '@/pages/tenant/ChatPage'

import AdminLoginPage from '@/pages/admin/AdminLoginPage'
import AdminDashboardPage from '@/pages/admin/AdminDashboardPage'
import AdminTenantsPage from '@/pages/admin/AdminTenantsPage'
import AdminContentPage from '@/pages/admin/AdminContentPage'
import AdminDocumentsPage from '@/pages/admin/AdminDocumentsPage'
import AdminChatPage from '@/pages/admin/AdminChatPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/admin" element={<AdminLoginPage />} />

            {/* Tenant portal */}
            <Route element={<ProtectedRoute requiredRole="tenant" />}>
              <Route element={<TenantLayout />}>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/project-status" element={<ProjectStatusPage />} />
                <Route path="/apartment" element={<ApartmentPage />} />
                <Route path="/documents" element={<DocumentsPage />} />
                <Route path="/team" element={<TeamPage />} />
                <Route path="/chat" element={<ChatPage />} />
              </Route>
            </Route>

            {/* Admin panel */}
            <Route element={<ProtectedRoute requiredRole="admin" redirectTo="/admin" />}>
              <Route element={<AdminLayout />}>
                <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
                <Route path="/admin/tenants" element={<AdminTenantsPage />} />
                <Route path="/admin/content" element={<AdminContentPage />} />
                <Route path="/admin/documents" element={<AdminDocumentsPage />} />
                <Route path="/admin/chat" element={<AdminChatPage />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}
