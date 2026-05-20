import { useQuery } from '@tanstack/react-query'
import { User } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import Card from '@/components/ui/Card'
import type { TeamMember } from '@/types'

export default function TeamPage() {
  const { profile } = useAuth()

  const { data: team, isLoading } = useQuery({
    queryKey: ['team', profile?.project_id],
    enabled: !!profile?.project_id,
    queryFn: async () => {
      const { data } = await supabase
        .from('project_team')
        .select('*')
        .eq('project_id', profile!.project_id!)
        .order('role', { ascending: true })
      return (data ?? []) as TeamMember[]
    },
  })

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-heading font-semibold text-dark mb-2">צוות הפרויקט</h1>
      <p className="text-navy/50 text-sm mb-6">
        לפניות ושאלות, השתמשו בלשונית הצ'אט — אין מענה ישיר לאנשי הצוות דרך הפורטל.
      </p>

      {isLoading ? (
        <div className="flex justify-center h-32 items-center">
          <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
        </div>
      ) : team?.length === 0 ? (
        <Card className="text-center py-12">
          <User size={40} className="text-navy/20 mx-auto mb-3" />
          <p className="text-navy/40">פרטי הצוות יעודכנו בקרוב</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {team?.map((member) => (
            <Card key={member.id} className="flex flex-col items-center text-center gap-3 py-6">
              {/* Photo or initials */}
              {member.photo_path ? (
                <img
                  src={member.photo_path}
                  alt={member.full_name}
                  className="w-16 h-16 rounded-full object-cover border-2 border-gold/30"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-navy/10 flex items-center justify-center">
                  <span className="font-heading text-xl font-semibold text-navy">
                    {member.full_name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                  </span>
                </div>
              )}
              <div>
                <h3 className="font-heading font-semibold text-dark">{member.full_name}</h3>
                <p className="text-gold-dark text-sm font-medium">{member.role}</p>
                {member.company && (
                  <p className="text-navy/50 text-xs mt-1">{member.company}</p>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
