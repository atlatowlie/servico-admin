import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const links = [
  { to: '/', label: 'Dashboard', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
    </svg>
  )},
  { to: '/tenants', label: 'Tenants', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  )},
  { to: '/phone-numbers', label: 'Phone Numbers', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
    </svg>
  )},
  { to: '/health', label: 'System Health', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>
  )},
]

export default function Sidebar({ onClose }) {
  const { logout, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleNav = () => {
    onClose?.()
  }

  return (
    <aside className="h-full bg-surface border-r border-slate-700 flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        <div>
          <h1 className="text-lg font-bold text-emerald-400">Minhal</h1>
          <p className="text-xs text-slate-400 mt-0.5">Servico Admin Panel</p>
        </div>
        <button onClick={onClose} className="p-2 text-slate-400 hover:text-white md:hidden rounded-lg active:bg-surface2" aria-label="Close menu">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {links.map(l => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.to === '/'}
            onClick={handleNav}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive ? 'bg-emerald-500/15 text-emerald-400 font-medium' : 'text-slate-300 hover:bg-surface2 active:bg-surface2'
              }`
            }
          >
            <span className="w-5 flex-shrink-0 flex items-center justify-center">{l.icon}</span>
            {l.label}
          </NavLink>
        ))}
      </nav>
      <div className="p-3 border-t border-slate-700">
        <p className="text-xs text-slate-400 mb-2 truncate px-1">{user?.email}</p>
        <button
          onClick={() => { logout(); navigate('/login'); onClose?.() }}
          className="w-full text-left px-3 py-2.5 text-sm text-red-400 hover:bg-red-500/10 active:bg-red-500/15 rounded-lg transition-colors"
        >
          Logout
        </button>
      </div>
    </aside>
  )
}
