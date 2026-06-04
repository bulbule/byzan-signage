'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Schedule, Playlist, Screen } from '@/types'
import { Plus, X, Calendar, Trash2 } from 'lucide-react'

export default function SchedulePage() {
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [screens, setScreens] = useState<Screen[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [loading, setLoading] = useState(true)

  const [form, setForm] = useState({
    screen_id: '',
    playlist_id: '',
    start_at: '',
    end_at: '',
    repeat_type: 'none' as 'none' | 'daily' | 'weekly',
    repeat_days: [] as number[],
  })

  const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']

  const fetchAll = async () => {
    const [{ data: sc }, { data: pl }, { data: sr }] = await Promise.all([
      supabase.from('schedules').select('*, playlists(name), screens(name)').order('start_at'),
      supabase.from('playlists').select('*'),
      supabase.from('screens').select('*').eq('is_active', true),
    ])
    setSchedules(sc || [])
    setPlaylists(pl || [])
    setScreens(sr || [])
    setLoading(false)
  }

  useEffect(() => { fetchAll() }, [])

  const createSchedule = async () => {
    if (!form.screen_id || !form.playlist_id || !form.start_at || !form.end_at) {
      return alert('Lengkapi semua field')
    }
    await supabase.from('schedules').insert({
      ...form,
      is_active: true,
    })
    setShowCreate(false)
    setForm({ screen_id: '', playlist_id: '', start_at: '', end_at: '', repeat_type: 'none', repeat_days: [] })
    fetchAll()
  }

  const deleteSchedule = async (id: string) => {
    if (!confirm('Hapus jadwal ini?')) return
    await supabase.from('schedules').delete().eq('id', id)
    fetchAll()
  }

  const toggleDay = (day: number) => {
    setForm(prev => ({
      ...prev,
      repeat_days: prev.repeat_days.includes(day)
        ? prev.repeat_days.filter(d => d !== day)
        : [...prev.repeat_days, day]
    }))
  }

  const getStatusBadge = (s: Schedule) => {
    const now = new Date()
    const start = new Date(s.start_at)
    const end = new Date(s.end_at)
    if (now >= start && now <= end) return { label: 'Sedang Tayang', color: 'bg-green-100 text-green-800' }
    if (now < start) return { label: 'Terjadwal', color: 'bg-blue-100 text-blue-800' }
    return { label: 'Selesai', color: 'bg-gray-100 text-gray-600' }
  }

  const grouped = schedules.reduce((acc, s) => {
    const date = new Date(s.start_at).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    if (!acc[date]) acc[date] = []
    acc[date].push(s)
    return acc
  }, {} as Record<string, Schedule[]>)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Jadwal Tayang</h1>
          <p className="text-gray-500 text-sm">{schedules.length} jadwal aktif</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-primary-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary-800 transition"
        >
          <Plus size={16} />
          Tambah Jadwal
        </button>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold">Tambah Jadwal Tayang</h2>
              <button onClick={() => setShowCreate(false)}><X size={20} className="text-gray-400" /></button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Layar *</label>
                <select
                  value={form.screen_id}
                  onChange={e => setForm({ ...form, screen_id: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-700"
                >
                  <option value="">-- Pilih layar --</option>
                  {screens.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Playlist *</label>
                <select
                  value={form.playlist_id}
                  onChange={e => setForm({ ...form, playlist_id: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-700"
                >
                  <option value="">-- Pilih playlist --</option>
                  {playlists.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mulai *</label>
                  <input
                    type="datetime-local"
                    value={form.start_at}
                    onChange={e => setForm({ ...form, start_at: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Selesai *</label>
                  <input
                    type="datetime-local"
                    value={form.end_at}
                    onChange={e => setForm({ ...form, end_at: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-700"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pengulangan</label>
                <select
                  value={form.repeat_type}
                  onChange={e => setForm({ ...form, repeat_type: e.target.value as any })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none"
                >
                  <option value="none">Tidak berulang</option>
                  <option value="daily">Setiap hari</option>
                  <option value="weekly">Mingguan (pilih hari)</option>
                </select>
              </div>

              {form.repeat_type === 'weekly' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Pilih Hari</label>
                  <div className="flex gap-2 flex-wrap">
                    {dayNames.map((day, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => toggleDay(i)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                          form.repeat_days.includes(i)
                            ? 'bg-primary-700 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={createSchedule}
                className="w-full bg-primary-700 text-white rounded-xl py-3 font-semibold hover:bg-primary-800 transition"
              >
                Simpan Jadwal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule List */}
      {loading ? (
        <p className="text-center py-20 text-gray-400">Memuat jadwal...</p>
      ) : schedules.length === 0 ? (
        <div className="text-center py-20">
          <Calendar size={48} className="mx-auto text-gray-200 mb-4" />
          <p className="text-gray-400 mb-4">Belum ada jadwal tayang</p>
          <button onClick={() => setShowCreate(true)} className="bg-primary-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold">
            Tambah Jadwal Pertama
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([date, items]) => (
            <div key={date}>
              <h3 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wide">{date}</h3>
              <div className="space-y-2">
                {items.map(s => {
                  const status = getStatusBadge(s)
                  return (
                    <div key={s.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4">
                      <div className="w-1 h-12 bg-primary-700 rounded-full flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-gray-900">{s.playlists?.name}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${status.color}`}>
                            {status.label}
                          </span>
                          {s.repeat_type !== 'none' && (
                            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                              {s.repeat_type === 'daily' ? 'Harian' : 'Mingguan'}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 mt-0.5">
                          📺 {s.screens?.name} &nbsp;·&nbsp;
                          🕐 {new Date(s.start_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} –{' '}
                          {new Date(s.end_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <button onClick={() => deleteSchedule(s.id)} className="text-red-400 hover:text-red-600 flex-shrink-0">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
