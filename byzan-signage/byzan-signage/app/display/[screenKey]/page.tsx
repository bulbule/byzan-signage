'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { PlaylistItem } from '@/types'

interface Props {
  params: { screenKey: string }
}

export default function DisplayPage({ params }: Props) {
  const { screenKey } = params
  const videoRef = useRef<HTMLVideoElement>(null)
  const [queue, setQueue] = useState<PlaylistItem[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loopCount, setLoopCount] = useState(0)
  const [screenId, setScreenId] = useState<string | null>(null)
  const [noSchedule, setNoSchedule] = useState(false)
  const [ready, setReady] = useState(false)

  const loadSchedule = async (sId: string) => {
    const now = new Date().toISOString()
    const { data } = await supabase
      .from('schedules')
      .select('*, playlists(*, playlist_items(*, videos(*)))')
      .eq('screen_id', sId)
      .eq('is_active', true)
      .lte('start_at', now)
      .gte('end_at', now)
      .order('start_at', { ascending: false })
      .limit(1)
      .single()

    if (data?.playlists?.playlist_items) {
      const items = [...data.playlists.playlist_items].sort((a, b) => a.position - b.position)
      setQueue(items)
      setCurrentIndex(0)
      setLoopCount(0)
      setNoSchedule(false)
    } else {
      setNoSchedule(true)
    }
    setReady(true)
  }

  const initScreen = async () => {
    const { data } = await supabase
      .from('screens')
      .select('id')
      .eq('screen_key', screenKey)
      .single()

    if (data) {
      setScreenId(data.id)
      await loadSchedule(data.id)

      // Heartbeat every 60s
      setInterval(async () => {
        await supabase.from('screens').update({ last_seen_at: new Date().toISOString() }).eq('id', data.id)
      }, 60000)

      // First heartbeat
      await supabase.from('screens').update({ last_seen_at: new Date().toISOString() }).eq('id', data.id)
    }
  }

  useEffect(() => {
    initScreen()
  }, [screenKey])

  // Subscribe to realtime updates
  useEffect(() => {
    if (!screenId) return
    const channel = supabase
      .channel(`screen:${screenId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'schedules' }, () => {
        loadSchedule(screenId)
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [screenId])

  // Reload schedule at midnight
  useEffect(() => {
    if (!screenId) return
    const now = new Date()
    const midnight = new Date()
    midnight.setHours(24, 0, 0, 0)
    const msToMidnight = midnight.getTime() - now.getTime()
    const timer = setTimeout(() => {
      loadSchedule(screenId)
    }, msToMidnight)
    return () => clearTimeout(timer)
  }, [screenId])

  const handleVideoEnd = () => {
    if (!queue.length) return
    const currentItem = queue[currentIndex]
    const maxLoops = currentItem.loop_count === 999 ? Infinity : currentItem.loop_count

    if (loopCount + 1 < maxLoops) {
      setLoopCount(prev => prev + 1)
      videoRef.current?.load()
      videoRef.current?.play()
    } else {
      const nextIndex = (currentIndex + 1) % queue.length
      setCurrentIndex(nextIndex)
      setLoopCount(0)
    }
  }

  useEffect(() => {
    if (queue.length && videoRef.current) {
      videoRef.current.load()
      videoRef.current.play().catch(() => {})
    }
  }, [currentIndex, queue])

  const currentItem = queue[currentIndex]
  const currentVideoUrl = currentItem?.videos?.file_url

  if (!ready) {
    return (
      <div className="w-screen h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/40 text-sm">Memuat konten...</p>
        </div>
      </div>
    )
  }

  if (noSchedule || !currentVideoUrl) {
    return (
      <div className="w-screen h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="text-white/10 text-8xl font-bold mb-4">B</div>
          <p className="text-white/30 text-lg font-semibold">Byzan Signage</p>
          <p className="text-white/20 text-sm mt-2">Tidak ada konten terjadwal saat ini</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-screen h-screen bg-black relative overflow-hidden">
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        autoPlay
        muted
        playsInline
        onEnded={handleVideoEnd}
      >
        <source src={currentVideoUrl} />
      </video>

      {/* Live indicator */}
      <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-full">
        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
        <span className="text-white/70 text-xs font-medium">LIVE</span>
      </div>
    </div>
  )
}
