import { useEffect, useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Send, Clock } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import Button from '@/components/ui/Button'
import type { ChatMessage } from '@/types'

const ACTIVE_HOURS = { start: 9, end: 15 }
const FAQ: { q: string; a: string }[] = [
  { q: 'מה שלב הפרויקט הנוכחי?', a: 'ניתן לראות את שלב הפרויקט הנוכחי בלשונית "מצב הפרויקט".' },
  { q: 'מתי תאריך המסירה הצפוי?', a: 'תאריך המסירה המשוער מופיע בלוח הבקרה ובלשונית "מצב הפרויקט".' },
  { q: 'איפה החוזה שלי?', a: 'החוזה שלכם נמצא בלשונית "מסמכים" תחת הקטגוריה "חוזים".' },
  { q: 'מי האדריכל / הקבלן?', a: 'פרטי הצוות המקצועי מופיעים בלשונית "צוות הפרויקט".' },
  { q: 'מה אחוז החתימות?', a: 'אחוז החתימות מופיע בלוח הבקרה ובלשונית "מצב הפרויקט".' },
  { q: 'איך מאפסים סיסמה?', a: 'בדף הכניסה, לחצו על "שכחתי סיסמה" והזינו את כתובת האימייל שלכם.' },
]

function isActiveHours(): boolean {
  const now = new Date()
  const h = now.getHours()
  return h >= ACTIVE_HOURS.start && h < ACTIVE_HOURS.end
}

export default function ChatPage() {
  const { profile } = useAuth()
  const queryClient = useQueryClient()
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [botReply, setBotReply] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const active = isActiveHours()

  const { data: messages } = useQuery({
    queryKey: ['chat', profile?.id],
    enabled: !!profile?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('tenant_id', profile!.id)
        .order('created_at', { ascending: true })

      // Mark admin messages as read
      await supabase
        .from('chat_messages')
        .update({ is_read: true })
        .eq('tenant_id', profile!.id)
        .eq('sender_role', 'admin')
        .eq('is_read', false)

      return (data ?? []) as ChatMessage[]
    },
  })

  // Real-time subscription
  useEffect(() => {
    if (!profile?.id) return
    const channel = supabase
      .channel(`chat-${profile.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `tenant_id=eq.${profile.id}`,
      }, () => {
        void queryClient.invalidateQueries({ queryKey: ['chat', profile.id] })
      })
      .subscribe()
    return () => { void supabase.removeChannel(channel) }
  }, [profile?.id, queryClient])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, botReply])

  function getFaqAnswer(q: string): string | null {
    const lower = q.toLowerCase()
    for (const item of FAQ) {
      if (item.q.toLowerCase().split(' ').some((w) => w.length > 3 && lower.includes(w))) {
        return item.a
      }
    }
    return null
  }

  async function sendMessage() {
    if (!input.trim() || !profile) return
    const content = input.trim()
    setInput('')
    setBotReply(null)
    setSending(true)

    if (active) {
      await supabase.from('chat_messages').insert({
        project_id: profile.project_id,
        tenant_id: profile.id,
        sender_role: 'tenant',
        content,
        is_read: false,
      })
      void queryClient.invalidateQueries({ queryKey: ['chat', profile.id] })
    } else {
      const answer = getFaqAnswer(content)
      setBotReply(
        answer ?? 'פנייתכם התקבלה. נחזור אליכם בשעות הפעילות (09:00–15:00). תודה על סבלנותכם.',
      )
    }
    setSending(false)
  }

  return (
    <div className="max-w-2xl mx-auto flex flex-col" style={{ height: 'calc(100vh - 120px)' }}>
      <div className="mb-4">
        <h1 className="text-2xl font-heading font-semibold text-dark">צ'אט ופניות</h1>
        <div className={`inline-flex items-center gap-1.5 mt-1 text-xs font-medium px-3 py-1 rounded-full ${
          active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
        }`}>
          <span className={`w-2 h-2 rounded-full ${active ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
          {active ? 'פעיל כעת' : 'שעות פעילות: 09:00–15:00'}
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-3 bg-white rounded-2xl border border-border p-4 mb-3">
        {/* Welcome */}
        <div className="text-center py-4">
          <p className="text-xs text-navy/40">ניתן לפנות אלינו בכל שאלה. שעות מענה: 09:00–15:00</p>
        </div>

        {messages?.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender_role === 'tenant' ? 'justify-start' : 'justify-end'}`}
          >
            <div
              className={`max-w-xs lg:max-w-sm px-4 py-2.5 rounded-2xl text-sm ${
                msg.sender_role === 'tenant'
                  ? 'bg-light-gray text-dark rounded-ss-sm'
                  : 'bg-navy text-white rounded-se-sm'
              }`}
            >
              {msg.content}
              <p className={`text-xs mt-1 ${msg.sender_role === 'tenant' ? 'text-navy/40' : 'text-white/50'}`}>
                {new Date(msg.created_at).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}

        {/* Bot reply */}
        {botReply && (
          <div className="flex justify-end">
            <div className="max-w-xs lg:max-w-sm px-4 py-2.5 rounded-2xl rounded-se-sm bg-gold/10 border border-gold/20 text-sm text-dark">
              <p className="text-xs text-gold-dark font-medium mb-1">מענה אוטומטי</p>
              {botReply}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* FAQ chips (outside active hours) */}
      {!active && (
        <div className="flex gap-2 flex-wrap mb-2">
          {FAQ.slice(0, 3).map((item) => (
            <button
              key={item.q}
              onClick={() => { setInput(item.q) }}
              className="text-xs px-3 py-1.5 bg-white border border-border rounded-full text-navy/70 hover:border-gold hover:text-gold-dark transition-colors"
            >
              {item.q}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="flex gap-2">
        {!active && (
          <div className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700 shrink-0">
            <Clock size={12} />
            <span>בוט</span>
          </div>
        )}
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void sendMessage() } }}
          placeholder={active ? 'כתבו הודעה...' : 'שאלו שאלה — הבוט יענה'}
          className="flex-1 rounded-xl border border-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold bg-white"
        />
        <Button
          variant="gold"
          onClick={() => void sendMessage()}
          loading={sending}
          disabled={!input.trim()}
          className="shrink-0"
        >
          <Send size={16} />
        </Button>
      </div>
    </div>
  )
}
