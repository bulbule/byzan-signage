'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import {
  Tv, Video, ListVideo, Calendar, Monitor, BarChart2, LogOut, Menu, X
} from 'lucide-react'
import { useState } from 'react'

const navItems = [
  { href: '/dashboard/videos', icon: Video, label: 'Video' },
  { href: '/dashboard/playlists', icon: ListVideo, label: 'Playlist' },
  { href: '/dashboard/schedule', icon: Calendar, label: 'Jadwal Tayang' },
  { href: '/dashboard/screens', icon: Monitor, label: 'Layar' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 bg-primary-700 text-white p-2 rounded-lg"
        onClick={() => setOpen(!open)}
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full w-64 bg-primary-700 text-white z-40 flex flex-col
        transform transition-transform duration-200
        ${open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-primary-800">
          <div className="bg-white text-primary-700 rounded-xl p-1.5">
            <Tv size={22} />
          </div>
          <div>
            <p className="font-bold text-base leading-tight">Byzan Signage</p>
            <p className="text-primary-200 text-xs">Dashboard</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(item => {
            const active = pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition
                  ${active
                    ? 'bg-white text-primary-700'
                    : 'text-primary-100 hover:bg-primary-800'
                  }`}
              >
                <item.icon size={18} />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Logout */}
        <div className="px-3 py-4 border-t border-primary-800">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-primary-100 hover:bg-primary-800 w-full transition"
          >
            <LogOut size={18} />
            Keluar
          </button>
        </div>
      </aside>

      {/* Overlay mobile */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}
    </>
  )
}
