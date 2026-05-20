import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import {
  LayoutDashboard,
  TrendingUp,
  Home,
  FileText,
  Users,
  MessageCircle,
  LogOut,
  Menu,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/dashboard', label: 'לוח בקרה', icon: LayoutDashboard },
  { to: '/project-status', label: 'מצב הפרויקט', icon: TrendingUp },
  { to: '/apartment', label: 'הדירה שלי', icon: Home },
  { to: '/documents', label: 'מסמכים', icon: FileText },
  { to: '/team', label: 'צוות הפרויקט', icon: Users },
  { to: '/chat', label: 'צ\'אט ופניות', icon: MessageCircle },
]

export default function TenantLayout() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen flex bg-light-gray">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 end-0 h-full w-64 bg-navy-dark flex flex-col z-30 transition-transform duration-300',
          'lg:translate-x-0 lg:static lg:z-auto',
          mobileOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0',
        )}
      >
        {/* Logo area */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="font-heading text-gold text-lg font-semibold leading-tight">
              קבוצת שינפלד
            </span>
            <span className="text-white/50 text-xs mt-0.5">פורטל דיירים</span>
          </div>
          <button
            className="lg:hidden text-white/60 hover:text-white"
            onClick={() => setMobileOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-6 py-3 text-sm transition-colors duration-150',
                  isActive
                    ? 'bg-gold/15 text-gold border-e-2 border-gold'
                    : 'text-white/70 hover:bg-white/5 hover:text-white',
                )
              }
            >
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User footer */}
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center text-gold text-sm font-semibold">
              {profile?.full_name?.charAt(0) ?? '?'}
            </div>
            <span className="text-white/80 text-sm truncate">{profile?.full_name ?? ''}</span>
          </div>
          <button
            onClick={() => void handleSignOut()}
            className="flex items-center gap-2 text-white/50 hover:text-white text-sm transition-colors w-full"
          >
            <LogOut size={15} />
            <span>יציאה</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="lg:hidden bg-white border-b border-border px-4 py-3 flex items-center justify-between sticky top-0 z-10">
          <span className="font-heading text-navy font-semibold">קבוצת שינפלד</span>
          <button
            className="text-navy p-1"
            onClick={() => setMobileOpen(true)}
          >
            <Menu size={22} />
          </button>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
