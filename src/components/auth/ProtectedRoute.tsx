import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

interface Props {
  requiredRole: 'tenant' | 'admin'
  redirectTo?: string
}

export default function ProtectedRoute({ requiredRole, redirectTo = '/login' }: Props) {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-light-gray">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-3 border-gold border-t-transparent rounded-full animate-spin" />
          <p className="text-navy font-body text-sm">טוען...</p>
        </div>
      </div>
    )
  }

  if (!user || !profile) {
    return <Navigate to={redirectTo} replace />
  }

  if (profile.role !== requiredRole) {
    const fallback = profile.role === 'admin' ? '/admin/dashboard' : '/dashboard'
    return <Navigate to={fallback} replace />
  }

  return <Outlet />
}
