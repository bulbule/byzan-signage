'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Screen } from '@/types'
import { Plus, X, Monitor, Copy, CheckCircle, XCircle } from 'lucide-react'

export default function ScreensPage() {
  const [screens, setScreens] = useState<Screen[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ name: '', location: '' })
  const [copied, setCopied] = useState<string | null>(null)

  const fetchScreens = async () => {
    const { data } = await supabase
      .from('screens')
      .select('*, institutions(name)')
      .order('created_at', { ascending: false })
    setScreens(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchScreens() }, [])

  const createScreen = async () => {
    if (!form.name) return alert('Isi nama layar dulu')
    const screenKey = Math.random().toString(36).substring(2, 10).toUpperCase()
    await supabase.from('screens').insert({
      name: form.name,
      screen_key: screenKey,
      is_active: true,
    })
    setForm({ name: '', location: '' })
    setShowCreate(false)
    fetchScreens()
  }

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from('screens').update({ is_active: !current }).eq('id', id)
    fetchScreens()
  }

  const deleteScreen = async (id: string) => {
    if (!confirm('Hapus layar ini?')) return
    await supabase.from('screens').delete().eq('id', id)
    fetchScreens()
  }

  const copyUrl = (screenKey: string) => {
    const url = `${window.location.origin}/display/${screenKey}`
    navigator.clipboard.writeText(url)
    setCopied(screenKey)
    setTimeout(() => setCopied(null), 2000)
  }

  const getLastSeen = (lastSeen: string | null) => {
    if (!lastSeen) return 'Belum pernah terhubung'
    const diff = Date.now() - new Date(lastSeen).getTime()
    const minutes = Math.floor(diff / 60000)
    if (minutes < 2) return 'Online sekarang'
    if (minutes < 60) return `${minutes} menit lalu`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours} jam lalu`
    return `${Math.floor(hours / 24)} hari lalu`
  }

  const isOnline = (lastSeen: string | null) => {
    if (!lastSeen) return false
    return Date.now() - new Date(lastSeen).getTime() < 120000
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manajemen Layar</h1>
          <p className="text-gray-500 text-sm">{screens.length} layar terdaftar</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-primary-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary-800 transition"
        >
          <Plus size={16} />
          Tambah Layar
        </button>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold">Tambah Layar Baru</h2>
              <button onClick={() => setShowCreate(false)}><X size={20} className="text-gray-400" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Layar *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="Contoh: Layar Aula Utama"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lokasi / Pesantren</label>
                <input
                  type="text"
                  value={form.location}
                  onChange={e => setForm({ ...form, location: e.target.value })}
                  placeholder="Contoh: Pesantren Al-Ikhlas Bogor"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-700"
                />
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
                💡 Setelah layar dibuat, kamu akan mendapat URL unik yang dibuka di Android TV.
              </div>
              <button
                onClick={createScreen}
                className="w-full bg-primary-700 text-white rounded-xl py-3 font-semibold hover:bg-primary-800 transition"
              >
                Buat Layar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Screens Grid */}
      {loading ? (
        <p className="text-center py-20 text-gray-400">Memuat data layar...</p>
      ) : screens.length === 0 ? (
        <div className="text-center py-20">
          <Monitor size={48} className="mx-auto text-gray-200 mb-4" />
          <p className="text-gray-400 mb-4">Belum ada layar terdaftar</p>
          <button onClick={() => setShowCreate(true)} className="bg-primary-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold">
            Tambah Layar Pertama
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {screens.map(screen => (
            <div key={screen.id} className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${screen.is_active ? 'bg-green-100' : 'bg-gray-100'}`}>
                    <Monitor size={20} className={screen.is_active ? 'text-green-700' : 'text-gray-400'} />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{screen.name}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      {isOnline(screen.last_seen_at) ? (
                        <CheckCircle size={12} className="text-green-500" />
                      ) : (
                        <XCircle size={12} className="text-gray-300" />
                      )}
                      <span className="text-xs text-gray-400">{getLastSeen(screen.last_seen_at)}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => toggleActive(screen.id, screen.is_active)}
                  className={`text-xs px-3 py-1 rounded-full font-medium transition ${
                    screen.is_active
                      ? 'bg-green-100 text-green-700 hover:bg-red-100 hover:text-red-700'
                      : 'bg-gray-100 text-gray-500 hover:bg-green-100 hover:text-green-700'
                  }`}
                >
                  {screen.is_active ? 'Aktif' : 'Nonaktif'}
                </button>
              </div>

              {/* Display URL */}
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-400 mb-1">URL untuk Android TV:</p>
                <div className="flex items-center gap-2">
                  <code className="text-xs text-primary-700 flex-1 truncate">
                    /display/{screen.screen_key}
                  </code>
                  <button
                    onClick={() => copyUrl(screen.screen_key)}
                    className="flex items-center gap-1 text-xs text-primary-700 hover:text-primary-900 font-medium flex-shrink-0"
                  >
                    <Copy size={12} />
                    {copied === screen.screen_key ? 'Tersalin!' : 'Salin'}
                  </button>
                </div>
              </div>

              <div className="flex justify-end mt-3">
                <button
                  onClick={() => deleteScreen(screen.id)}
                  className="text-xs text-red-400 hover:text-red-600 transition"
                >
                  Hapus Layar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
