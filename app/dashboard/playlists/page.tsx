'use client'

import { useEffect, useState } from 'react'
import { supabase, formatDuration } from '@/lib/supabase'
import { Playlist, PlaylistItem, Video } from '@/types'
import { Plus, Trash2, GripVertical, X, ChevronDown, ChevronUp, Save } from 'lucide-react'

export default function PlaylistsPage() {
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [videos, setVideos] = useState<Video[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [newName, setNewName] = useState('')
  const [selectedItems, setSelectedItems] = useState<{video_id: string, loop_count: number, display_duration_seconds: number}[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAll = async () => {
    const [{ data: pl }, { data: vd }] = await Promise.all([
      supabase.from('playlists').select('*, playlist_items(*, videos(*))').order('created_at', { ascending: false }),
      supabase.from('videos').select('*').order('title'),
    ])
    setPlaylists(pl || [])
    setVideos(vd || [])
    setLoading(false)
  }

  useEffect(() => { fetchAll() }, [])

  const createPlaylist = async () => {
    if (!newName.trim()) return
    const { data } = await supabase.from('playlists').insert({ name: newName }).select().single()
    if (data && selectedItems.length > 0) {
      await supabase.from('playlist_items').insert(
        selectedItems.map((item, i) => ({
          playlist_id: data.id,
          video_id: item.video_id,
          position: i,
          loop_count: item.loop_count,
          display_duration_seconds: item.display_duration_seconds,
        }))
      )
    }
    setNewName('')
    setSelectedItems([])
    setShowCreate(false)
    fetchAll()
  }

  const deletePlaylist = async (id: string) => {
    if (!confirm('Hapus playlist ini?')) return
    await supabase.from('playlist_items').delete().eq('playlist_id', id)
    await supabase.from('playlists').delete().eq('id', id)
    fetchAll()
  }

  const addVideoToNew = (videoId: string) => {
    const video = videos.find(v => v.id === videoId)
    if (!video) return
    setSelectedItems(prev => [...prev, {
      video_id: videoId,
      loop_count: 1,
      display_duration_seconds: video.duration_seconds,
    }])
  }

  const removeFromNew = (index: number) => {
    setSelectedItems(prev => prev.filter((_, i) => i !== index))
  }

  const getTotalDuration = (items: PlaylistItem[]) => {
    return items.reduce((sum, item) => sum + (item.display_duration_seconds * item.loop_count), 0)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Playlist</h1>
          <p className="text-gray-500 text-sm">{playlists.length} playlist dibuat</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-primary-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary-800 transition"
        >
          <Plus size={16} />
          Buat Playlist
        </button>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold">Buat Playlist Baru</h2>
              <button onClick={() => setShowCreate(false)}><X size={20} className="text-gray-400" /></button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Playlist *</label>
                <input
                  type="text"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="Contoh: Jadwal Pagi Senin"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-700"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tambah Video ke Playlist</label>
                <select
                  onChange={e => { if (e.target.value) addVideoToNew(e.target.value); e.target.value = '' }}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none"
                >
                  <option value="">-- Pilih video --</option>
                  {videos.map(v => (
                    <option key={v.id} value={v.id}>{v.title} ({formatDuration(v.duration_seconds)})</option>
                  ))}
                </select>
              </div>

              {selectedItems.length > 0 && (
                <div className="border border-gray-200 rounded-xl divide-y">
                  {selectedItems.map((item, i) => {
                    const video = videos.find(v => v.id === item.video_id)
                    return (
                      <div key={i} className="flex items-center gap-3 p-3">
                        <GripVertical size={16} className="text-gray-300" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{video?.title}</p>
                          <div className="flex gap-3 mt-1">
                            <label className="text-xs text-gray-500 flex items-center gap-1">
                              Durasi (detik):
                              <input
                                type="number"
                                value={item.display_duration_seconds}
                                onChange={e => {
                                  const copy = [...selectedItems]
                                  copy[i].display_duration_seconds = Number(e.target.value)
                                  setSelectedItems(copy)
                                }}
                                className="w-16 border border-gray-200 rounded px-1 py-0.5 text-xs"
                              />
                            </label>
                            <label className="text-xs text-gray-500 flex items-center gap-1">
                              Loop:
                              <select
                                value={item.loop_count}
                                onChange={e => {
                                  const copy = [...selectedItems]
                                  copy[i].loop_count = Number(e.target.value)
                                  setSelectedItems(copy)
                                }}
                                className="border border-gray-200 rounded px-1 py-0.5 text-xs"
                              >
                                {[1,2,3,5,10].map(n => <option key={n} value={n}>{n}×</option>)}
                                <option value={999}>∞ Loop</option>
                              </select>
                            </label>
                          </div>
                        </div>
                        <button onClick={() => removeFromNew(i)} className="text-red-400 hover:text-red-600">
                          <X size={16} />
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}

              <button
                onClick={createPlaylist}
                className="w-full bg-primary-700 text-white rounded-xl py-3 font-semibold hover:bg-primary-800 transition flex items-center justify-center gap-2"
              >
                <Save size={16} />
                Simpan Playlist
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Playlist List */}
      {loading ? (
        <p className="text-center py-20 text-gray-400">Memuat playlist...</p>
      ) : playlists.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-400 mb-4">Belum ada playlist</p>
          <button onClick={() => setShowCreate(true)} className="bg-primary-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold">
            Buat Playlist Pertama
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {playlists.map(pl => {
            const items = pl.playlist_items || []
            const expanded = expandedId === pl.id
            return (
              <div key={pl.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="flex items-center justify-between p-4">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{pl.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {items.length} video · Total {formatDuration(getTotalDuration(items))}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setExpandedId(expanded ? null : pl.id)}
                      className="text-gray-400 hover:text-gray-600 p-1"
                    >
                      {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                    <button onClick={() => deletePlaylist(pl.id)} className="text-red-400 hover:text-red-600 p-1">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {expanded && items.length > 0 && (
                  <div className="border-t border-gray-100 divide-y divide-gray-50">
                    {items
                      .sort((a, b) => a.position - b.position)
                      .map((item, i) => (
                        <div key={item.id} className="flex items-center gap-3 px-4 py-2.5">
                          <span className="text-xs text-gray-300 w-5 text-center">{i + 1}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{item.videos?.title}</p>
                          </div>
                          <div className="flex gap-3 text-xs text-gray-400">
                            <span>{formatDuration(item.display_duration_seconds)}</span>
                            <span className="bg-gray-100 px-2 py-0.5 rounded-full">
                              {item.loop_count === 999 ? '∞' : `${item.loop_count}×`}
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
