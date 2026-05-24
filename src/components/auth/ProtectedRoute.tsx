// Auth disabled for UI review — restore checks before production
import { Outlet } from 'react-router-dom'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function ProtectedRoute(_props: { requiredRole: 'tenant' | 'admin'; redirectTo?: string }) {
  return <Outlet />
}
