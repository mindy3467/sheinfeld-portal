// Auth disabled for UI review — restore real auth before production
import { createContext, useContext, type ReactNode } from 'react'
import type { User } from '@supabase/supabase-js'
import type { UserProfile } from '@/types'

const MOCK_PROFILE: UserProfile = {
  id: 'mock-profile-id',
  user_id: 'mock-user-id',
  email: 'demo@sheinfeld.co.il',
  full_name: 'משתמש הדגמה',
  role: 'tenant',
  phone: '050-0000000',
  project_id: null,
  apartment_id: null,
  is_active: true,
}

interface AuthContextValue {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: string | null }>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const mockUser = { id: 'mock-user-id' } as User

  async function signIn(_email: string, _password: string): Promise<{ error: string | null }> {
    return { error: null }
  }
  async function signOut() {}
  async function resetPassword(_email: string): Promise<{ error: string | null }> {
    return { error: null }
  }

  return (
    <AuthContext.Provider value={{ user: mockUser, profile: MOCK_PROFILE, loading: false, signIn, signOut, resetPassword }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
