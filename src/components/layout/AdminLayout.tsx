import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import {
  LayoutDashboard,
  Users,
  Settings,
  FileText,
  MessageCircle,
  LogOut,
  Menu,
  X,
  Building2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/admin/dashboard', label: 'לוח בקרה', icon: LayoutDashboard },
  { to: '/admin/tenants', label: 'ניהול דיירים', icon: Users },
  { to: '/admin/content', label: 'ניהול תוכן', icon: Settings },
  { to: '/admin/documents', label: 'ניהול מסמכים', icon: FileText },
  { to: '/admin/chat', label: 'ניהול צ\'אט', icon: MessageCircle },
]

export default function AdminLayout() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  async function handleSignOut() {
    await signOut()
    navigate('/admin')
  }

  return (
    <div className="min-h-screen flex bg-light-gray">
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          'fixed top-0 end-0 h-full w-64 bg-dark flex flex-col z-30 transition-transform duration-300',
          'lg:translate-x-0 lg:static lg:z-auto',
          mobileOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0',
        )}
      >
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 size={20} className="text-gold" />
            <div>
              <span className="font-heading text-white text-base font-semibold block leading-tight">
                פאנל ניהול
              </span>
              <span className="text-white/40 text-xs">קבוצת שינפלד</span>
            </div>
          </div>
          <button className="lg:hidden text-white/60 hover:text-white" onClick={() => setMobileOpen(false)}>
            <X size={20} />
          </button>
        </div>

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

        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center text-gold text-sm font-semibold">
              {profile?.full_name?.charAt(0) ?? 'A'}
            </div>
            <span className="text-white/80 text-sm truncate">{profile?.full_name ?? 'מנהל'}</span>
          </div>
          <button
            onClick={() => void handleSignOut()}
            className="flex items-center gap-2 text-white/50 hover:text-white text-sm transition-colors"
          >
            <LogOut size={15} />
            <span>יציאה</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden bg-white border-b border-border px-4 py-3 flex items-center justify-between sticky top-0 z-10">
          <span className="font-heading text-navy font-semibold">פאנל ניהול</span>
          <button className="text-navy p-1" onClick={() => setMobileOpen(true)}>
            <Menu size={22} />
          </button>
        </header>
        <main className="flex-1 p-4 lg:p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
