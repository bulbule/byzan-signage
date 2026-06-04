'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase, getCategoryLabel, getCategoryColor, formatDuration } from '@/lib/supabase'
import { Video as VideoType, VideoCategory } from '@/types'
import { Upload, Trash2, Play, Search, Filter, X } from 'lucide-react'

export default function VideosPage() {
  const [videos, setVideos] = useState<VideoType[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [showUpload, setShowUpload] = useState(false)
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'education' as VideoCategory,
    tags: '',
  })

  const fetchVideos = async () => {
    const { data } = await supabase
      .from('videos')
      .select('*')
      .order('created_at', { ascending: false })
    setVideos(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchVideos() }, [])

  const handleUpload = async () => {
    const file = fileRef.current?.files?.[0]
    if (!file || !form.title) return alert('Pilih file dan isi judul dulu')

    setUploading(true)
    const fileName = `${Date.now()}-${file.name}`

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('videos')
      .upload(fileName, file, { contentType: file.type })

    if (uploadError) {
      alert('Gagal upload: ' + uploadError.message)
      setUploading(false)
      return
    }

    const { data: urlData } = supabase.storage.from('videos').getPublicUrl(fileName)

    const video = document.createElement('video')
    video.src = URL.createObjectURL(file)
    const duration = await new Promise<number>(resolve => {
      video.onloadedmetadata = () => resolve(Math.round(video.duration))
    })

    await supabase.from('videos').insert({
      title: form.title,
      description: form.description,
      category: form.category,
      file_url: urlData.publicUrl,
      duration_seconds: duration,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
    })

    setForm({ title: '', description: '', category: 'education', tags: '' })
    setShowUpload(false)
    setUploading(false)
    fetchVideos()
  }

  const handleDelete = async (id: string, fileUrl: string) => {
    if (!confirm('Hapus video ini?')) return
    const fileName = fileUrl.split('/').pop()
    if (fileName) await supabase.storage.from('videos').remove([fileName])
    await supabase.from('videos').delete().eq('id', id)
    fetchVideos()
  }

  const filtered = videos.filter(v => {
    const matchSearch = v.title.toLowerCase().includes(search.toLowerCase())
    const matchCat = filterCat ? v.category === filterCat : true
    return matchSearch && matchCat
  })

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Perpustakaan Video</h1>
          <p className="text-gray-500 text-sm">{videos.length} video tersimpan</p>
        </div>
        <button
          onClick={() => setShowUpload(true)}
          className="flex items-center gap-2 bg-primary-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary-800 transition"
        >
          <Upload size={16} />
          Unggah Video
        </button>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Cari video..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-700"
          />
        </div>
        <select
          value={filterCat}
          onChange={e => setFilterCat(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-700"
        >
          <option value="">Semua Kategori</option>
          <option value="education">Edukasi</option>
          <option value="promo">Promosi</option>
          <option value="byzan">Konten Byzan</option>
          <option value="partner">Iklan Partner</option>
        </select>
      </div>

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold">Unggah Video Baru</h2>
              <button onClick={() => setShowUpload(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">File Video *</label>
                <input
                  ref={fileRef}
                  type="file"
                  accept="video/mp4,video/webm"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Judul *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="Judul video"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Deskripsi singkat..."
                  rows={3}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                <select
                  value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value as VideoCategory })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-700"
                >
                  <option value="education">Edukasi</option>
                  <option value="promo">Promosi</option>
                  <option value="byzan">Konten Byzan</option>
                  <option value="partner">Iklan Partner</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tags (pisah dengan koma)</label>
                <input
                  type="text"
                  value={form.tags}
                  onChange={e => setForm({ ...form, tags: e.target.value })}
                  placeholder="pesantren, edukasi, quran"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-700"
                />
              </div>

              <button
                onClick={handleUpload}
                disabled={uploading}
                className="w-full bg-primary-700 text-white rounded-xl py-3 font-semibold hover:bg-primary-800 transition disabled:opacity-50"
              >
                {uploading ? 'Mengupload...' : 'Upload Video'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Video Grid */}
      {loading ? (
        <div className="text-center py-20 text-gray-400">Memuat video...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-400 mb-4">Belum ada video</p>
          <button
            onClick={() => setShowUpload(true)}
            className="bg-primary-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold"
          >
            Upload Video Pertama
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(video => (
            <div key={video.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition">
              <div className="relative bg-gray-900 aspect-video flex items-center justify-center">
                {video.thumbnail_url ? (
                  <img src={video.thumbnail_url} alt={video.title} className="w-full h-full object-cover" />
                ) : (
                  <Play size={32} className="text-gray-600" />
                )}
                <span className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-0.5 rounded">
                  {formatDuration(video.duration_seconds)}
                </span>
              </div>
              <div className="p-3">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getCategoryColor(video.category)}`}>
                  {getCategoryLabel(video.category)}
                </span>
                <p className="font-semibold text-sm mt-2 text-gray-900 line-clamp-2">{video.title}</p>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs text-gray-400">
                    {new Date(video.created_at).toLocaleDateString('id-ID')}
                  </span>
                  <button
                    onClick={() => handleDelete(video.id, video.file_url)}
                    className="text-red-400 hover:text-red-600 transition"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
