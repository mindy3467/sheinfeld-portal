export type ProjectType = 'pinuy_binuy' | 'tama38'
export type UserRole = 'tenant' | 'admin'
export type TimelineStatus = 'completed' | 'active' | 'upcoming'
export type AmenityType = 'elevator' | 'parking' | 'storage' | 'safe_room' | 'garden' | 'gym' | 'pool' | 'bike_room'
export type DocumentCategory = 'contracts' | 'guarantees' | 'deposits' | 'power_of_attorney' | 'approvals' | 'blueprints'
export type SpecTab = 'finishes' | 'kitchen' | 'electrical' | 'plumbing' | 'exterior'

export interface Project {
  id: string
  name: string
  type: ProjectType
  address: string
  signature_count: number
  signature_total: number
  handover_date: string | null
  handover_note: string | null
  created_at: string
}

export interface Apartment {
  id: string
  project_id: string
  address: string
  floor: number
  current_area: number
  new_area: number | null
  new_floor: number | null
  appreciation_percent: number | null
  appreciation_ils: number | null
}

export interface UserProfile {
  id: string
  user_id: string
  full_name: string
  email: string
  phone: string | null
  role: UserRole
  project_id: string | null
  apartment_id: string | null
  is_active: boolean
}

export interface Document {
  id: string
  tenant_id: string
  project_id: string
  category: DocumentCategory
  name: string
  storage_path: string
  file_size: number
  uploaded_at: string
}

export interface TeamMember {
  id: string
  project_id: string
  full_name: string
  role: string
  company: string | null
  photo_path: string | null
}

export interface TimelineStep {
  id: string
  project_id: string
  title: string
  date: string | null
  status: TimelineStatus
  admin_note: string | null
  sort_order: number
}

export interface Amenity {
  id: string
  project_id: string
  type: AmenityType
  available: boolean
}

export interface ChatMessage {
  id: string
  project_id: string
  tenant_id: string
  sender_role: UserRole
  content: string
  is_read: boolean
  created_at: string
}

export interface ApartmentSpec {
  id: string
  apartment_id: string
  tab: SpecTab
  title: string
  description: string
  image_path: string | null
}

export interface GalleryImage {
  id: string
  project_id: string
  storage_path: string
  caption: string | null
  sort_order: number
}
