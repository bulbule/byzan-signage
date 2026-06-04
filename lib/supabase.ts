import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export const getCategoryLabel = (category: string) => {
  const labels: Record<string, string> = {
    education: 'Edukasi',
    promo: 'Promosi',
    byzan: 'Konten Byzan',
    partner: 'Iklan Partner',
  }
  return labels[category] || category
}

export const getCategoryColor = (category: string) => {
  const colors: Record<string, string> = {
    education: 'bg-blue-100 text-blue-800',
    promo: 'bg-green-100 text-green-800',
    byzan: 'bg-purple-100 text-purple-800',
    partner: 'bg-amber-100 text-amber-800',
  }
  return colors[category] || 'bg-gray-100 text-gray-800'
}

export const formatDuration = (seconds: number) => {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}
