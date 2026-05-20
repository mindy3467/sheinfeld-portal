import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import Card from '@/components/ui/Card'
import type { Amenity, AmenityType, ApartmentSpec, SpecTab } from '@/types'

const AMENITY_LABELS: Record<AmenityType, string> = {
  elevator: 'מעלית',
  parking: 'חניה',
  storage: 'מחסן',
  safe_room: 'ממ"ד',
  garden: 'גינה',
  gym: 'חדר כושר',
  pool: 'בריכה',
  bike_room: 'חדר אופניים',
}

const AMENITY_ICONS: Record<AmenityType, string> = {
  elevator: '🛗',
  parking: '🚗',
  storage: '📦',
  safe_room: '🛡️',
  garden: '🌿',
  gym: '💪',
  pool: '🏊',
  bike_room: '🚲',
}

const SPEC_TABS: { key: SpecTab; label: string }[] = [
  { key: 'finishes', label: 'גמרים' },
  { key: 'kitchen', label: 'מטבח ותברואה' },
  { key: 'electrical', label: 'חשמל וטכנולוגיה' },
  { key: 'plumbing', label: 'אינסטלציה' },
  { key: 'exterior', label: 'חזות ושטחים משותפים' },
]

export default function ApartmentPage() {
  const { profile } = useAuth()
  const [activeTab, setActiveTab] = useState<SpecTab>('finishes')

  const { data: apartment, isLoading: loadingApt } = useQuery({
    queryKey: ['apartment', profile?.apartment_id],
    enabled: !!profile?.apartment_id,
    queryFn: async () => {
      const { data } = await supabase
        .from('apartments')
        .select('*')
        .eq('id', profile!.apartment_id!)
        .single()
      return data
    },
  })

  const { data: amenities } = useQuery({
    queryKey: ['amenities', profile?.project_id],
    enabled: !!profile?.project_id,
    queryFn: async () => {
      const { data } = await supabase
        .from('amenities')
        .select('*')
        .eq('project_id', profile!.project_id!)
      return (data ?? []) as Amenity[]
    },
  })

  const { data: specs } = useQuery({
    queryKey: ['specs', profile?.apartment_id],
    enabled: !!profile?.apartment_id,
    queryFn: async () => {
      const { data } = await supabase
        .from('apartment_specs')
        .select('*')
        .eq('apartment_id', profile!.apartment_id!)
      return (data ?? []) as ApartmentSpec[]
    },
  })

  const { data: gallery } = useQuery({
    queryKey: ['gallery', profile?.project_id],
    enabled: !!profile?.project_id,
    queryFn: async () => {
      const { data } = await supabase
        .from('gallery_images')
        .select('*')
        .eq('project_id', profile!.project_id!)
        .order('sort_order', { ascending: true })
      return data ?? []
    },
  })

  if (loadingApt) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const tabSpecs = specs?.filter((s) => s.tab === activeTab) ?? []
  const projectType = 'pinuy_binuy' // will come from project data

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-heading font-semibold text-dark mb-6">הדירה שלי</h1>

      {/* Property details */}
      <Card className="mb-6">
        <h2 className="font-heading text-lg font-semibold text-dark mb-4">פרטי הנכס</h2>
        {apartment ? (
          <div className="divide-y divide-border">
            {[
              { label: 'כתובת', value: apartment.address },
              { label: 'קומה נוכחית', value: `קומה ${apartment.floor}` },
              { label: 'שטח נוכחי', value: `${apartment.current_area} מ"ר` },
              ...(projectType === 'pinuy_binuy' && apartment.new_area ? [
                { label: 'שטח חדש', value: `${apartment.new_area} מ"ר` },
                { label: 'תוספת שטח', value: `+${(apartment.new_area - apartment.current_area).toFixed(0)} מ"ר` },
              ] : []),
              ...(apartment.new_floor != null ? [
                { label: 'קומה חדשה', value: `קומה ${apartment.new_floor}` },
              ] : []),
              ...(projectType === 'pinuy_binuy' && apartment.appreciation_percent != null ? [
                { label: 'עליית ערך משוערת', value: `+${apartment.appreciation_percent}%` },
              ] : []),
              ...(projectType === 'pinuy_binuy' && apartment.appreciation_ils != null ? [
                { label: 'עליית ערך בש"ח', value: `+${apartment.appreciation_ils.toLocaleString('he-IL')} ₪` },
              ] : []),
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between items-center py-3">
                <span className="text-navy/60 text-sm">{label}</span>
                <span className="font-medium text-dark text-sm">{value}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-navy/40 text-sm">פרטי הדירה יעודכנו בקרוב</p>
        )}
      </Card>

      {/* Amenities */}
      <Card className="mb-6">
        <h2 className="font-heading text-lg font-semibold text-dark mb-4">מתקנים ושירותים</h2>
        {amenities && amenities.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {amenities.map((a) => (
              <div
                key={a.id}
                className={`flex flex-col items-center gap-2 p-3 rounded-xl border text-center ${
                  a.available
                    ? 'border-gold/30 bg-gold/5'
                    : 'border-border bg-light-gray opacity-50'
                }`}
              >
                <span className="text-2xl">{AMENITY_ICONS[a.type as AmenityType]}</span>
                <span className="text-xs font-medium text-dark">{AMENITY_LABELS[a.type as AmenityType]}</span>
                <span className={`text-xs ${a.available ? 'text-gold-dark' : 'text-navy/40'}`}>
                  {a.available ? '✓ כלול' : '✗ לא כלול'}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-navy/40 text-sm">פרטי המתקנים יעודכנו בקרוב</p>
        )}
      </Card>

      {/* Technical specs */}
      <Card className="mb-6">
        <h2 className="font-heading text-lg font-semibold text-dark mb-4">מפרט טכני</h2>
        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto pb-2 mb-4 no-scrollbar">
          {SPEC_TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === key
                  ? 'bg-gold text-white'
                  : 'bg-light-gray text-navy/70 hover:bg-border'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        {/* Tab content */}
        {tabSpecs.length > 0 ? (
          <div className="grid gap-4">
            {tabSpecs.map((spec) => (
              <div key={spec.id} className="border border-border rounded-xl overflow-hidden">
                {spec.image_path && (
                  <img
                    src={spec.image_path}
                    alt={spec.title}
                    className="w-full h-40 object-cover"
                  />
                )}
                <div className="p-4">
                  <h3 className="font-medium text-dark mb-1">{spec.title}</h3>
                  <p className="text-sm text-navy/60">{spec.description}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-navy/40 text-sm text-center py-6">המפרט יעודכן בקרוב</p>
        )}
      </Card>

      {/* Gallery */}
      {gallery && gallery.length > 0 && (
        <Card>
          <h2 className="font-heading text-lg font-semibold text-dark mb-4">גלריית הפרויקט</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {gallery.map((img) => (
              <div key={img.id} className="aspect-video rounded-xl overflow-hidden bg-light-gray">
                <img
                  src={img.storage_path}
                  alt={img.caption ?? ''}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
