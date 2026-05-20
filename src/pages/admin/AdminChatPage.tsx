import { useEffect, useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Send, CheckCheck } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import type { UserProfile } from '@/types'

interface Message {
  id: string
  tenant_id: string
  sender_role: 'tenant' | 'admin'
  content: string
  is_read: boolean
  created_at: string
}

export default function AdminChatPage() {
  const queryClient = useQueryClient()
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  const { data: tenants } = useQuery({
    queryKey: ['admin-tenants'],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('*').eq('role', 'tenant').eq('is_active', true).order('full_name')
      return (data ?? []) as UserProfile[]
    },
  })

  // Unread counts per tenant
  const { data: unreadMap } = useQuery({
    queryKey: ['admin-unread-map'],
    refetchInterval: 10_000,
    queryFn: async () => {
      const { data } = await supabase
        .from('chat_messages')
        .select('tenant_id')
        .eq('sender_role', 'tenant')
        .eq('is_read', false)
      const map: Record<string, number> = {}
      for (const row of data ?? []) {
        map[row.tenant_id] = (map[row.tenant_id] ?? 0) + 1
      }
      return map
    },
  })

  const { data: messages } = useQuery({
    queryKey: ['admin-chat', selectedTenantId],
    enabled: !!selectedTenantId,
    queryFn: async () => {
      const { data } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('tenant_id', selectedTenantId!)
        .order('created_at', { ascending: true })

      // Mark tenant messages as read
      await supabase
        .from('chat_messages')
        .update({ is_read: true })
        .eq('tenant_id', selectedTenantId!)
        .eq('sender_role', 'tenant')
        .eq('is_read', false)

      void queryClient.invalidateQueries({ queryKey: ['admin-unread-map'] })
      return (data ?? []) as Message[]
    },
  })

  // Realtime subscription
  useEffect(() => {
    if (!selectedTenantId) return
    const channel = supabase
      .channel(`admin-chat-${selectedTenantId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `tenant_id=eq.${selectedTenantId}`,
      }, () => {
        void queryClient.invalidateQueries({ queryKey: ['admin-chat', selectedTenantId] })
      })
      .subscribe()
    return () => { void supabase.removeChannel(channel) }
  }, [selectedTenantId, queryClient])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const selectedTenant = tenants?.find((t) => t.id === selectedTenantId)

  async function sendReply() {
    if (!input.trim() || !selectedTenantId || !selectedTenant) return
    const content = input.trim()
    setInput('')

    await supabase.from('chat_messages').insert({
      project_id: selectedTenant.project_id,
      tenant_id: selectedTenantId,
      sender_role: 'admin',
      content,
      is_read: false,
    })
    void queryClient.invalidateQueries({ queryKey: ['admin-chat', selectedTenantId] })
  }

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-2xl font-heading font-semibold text-dark mb-6">ניהול צ'אט</h1>
      <div className="flex gap-4" style={{ height: 'calc(100vh - 180px)' }}>

        {/* Tenant list */}
        <Card padding="none" className="w-64 shrink-0 flex flex-col overflow-hidden">
          <div className="p-3 border-b border-border">
            <p className="text-sm font-medium text-dark">דיירים</p>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-border">
            {tenants?.map((t) => {
              const unread = unreadMap?.[t.id] ?? 0
              return (
                <button
                  key={t.id}
                  onClick={() => setSelectedTenantId(t.id)}
                  className={`w-full flex items-center gap-3 px-3 py-3 text-start transition-colors ${
                    selectedTenantId === t.id ? 'bg-gold/10' : 'hover:bg-light-gray'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-navy/10 flex items-center justify-center text-navy text-xs font-semibold shrink-0">
                    {t.full_name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-dark truncate">{t.full_name}</p>
                  </div>
                  {unread > 0 && (
                    <span className="w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold shrink-0">
                      {unread}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </Card>

        {/* Chat area */}
        <div className="flex-1 flex flex-col min-w-0">
          {selectedTenantId ? (
            <>
              <Card padding="sm" className="mb-2 flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-navy/10 flex items-center justify-center text-navy text-sm font-semibold">
                  {selectedTenant?.full_name.charAt(0)}
                </div>
                <p className="font-medium text-dark text-sm">{selectedTenant?.full_name}</p>
                <Badge variant="gray" className="me-auto">{selectedTenant?.email}</Badge>
              </Card>

              <Card padding="none" className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
                  {messages?.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.sender_role === 'tenant' ? 'justify-start' : 'justify-end'}`}>
                      <div className={`max-w-sm px-4 py-2.5 rounded-2xl text-sm ${
                        msg.sender_role === 'tenant'
                          ? 'bg-light-gray text-dark rounded-ss-sm'
                          : 'bg-navy text-white rounded-se-sm'
                      }`}>
                        {msg.content}
                        <p className={`text-xs mt-1 flex items-center gap-1 ${msg.sender_role === 'tenant' ? 'text-navy/40' : 'text-white/50'}`}>
                          {new Date(msg.created_at).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                          {msg.sender_role === 'admin' && msg.is_read && <CheckCheck size={12} />}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={bottomRef} />
                </div>

                <div className="border-t border-border p-3 flex gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') void sendReply() }}
                    placeholder="כתוב תשובה..."
                    className="flex-1 rounded-xl border border-border px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold bg-white"
                  />
                  <Button variant="gold" onClick={() => void sendReply()} disabled={!input.trim()}>
                    <Send size={15} />
                  </Button>
                </div>
              </Card>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-navy/40 text-sm">
              בחר דייר כדי לצפות בשיחה
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
