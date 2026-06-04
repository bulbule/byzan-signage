export type VideoCategory = 'education' | 'promo' | 'byzan' | 'partner'

export interface Institution {
  id: string
  name: string
  location: string
  created_at: string
}

export interface Screen {
  id: string
  institution_id: string
  name: string
  screen_key: string
  is_active: boolean
  last_seen_at: string | null
  institutions?: Institution
}

export interface Video {
  id: string
  institution_id: string | null
  title: string
  description: string | null
  category: VideoCategory
  file_url: string
  thumbnail_url: string | null
  duration_seconds: number
  tags: string[]
  uploaded_by: string | null
  created_at: string
  institutions?: Institution
}

export interface Playlist {
  id: string
  institution_id: string | null
  name: string
  created_by: string | null
  created_at: string
  playlist_items?: PlaylistItem[]
}

export interface PlaylistItem {
  id: string
  playlist_id: string
  video_id: string
  position: number
  display_duration_seconds: number
  loop_count: number
  videos?: Video
}

export interface Schedule {
  id: string
  screen_id: string
  playlist_id: string
  start_at: string
  end_at: string
  repeat_type: 'none' | 'daily' | 'weekly'
  repeat_days: number[]
  is_active: boolean
  playlists?: Playlist
  screens?: Screen
}
