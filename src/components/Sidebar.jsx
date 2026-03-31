import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const links = [
  { to: '/', label: 'Dashboard', icon: '~' },
  { to: '/tenants', label: 'Tenants', icon: '#' },
  { to: '/phone-numbers', label: 'Phone Numbers', icon: '+' },
  { to: '/health', label: 'System Health', icon: '*' },
]

export default function Sidebar() {
  const { logout, user } = useAuth()
  const navigate = useNavigate()

  return (
    <aside className="w-60 bg-surface border-r border-slate-700 flex flex-col">
      <div className="p-4 border-b border-slate-700">
        <h1 className="text-lg font-bold text-emerald-400">Minhal</h1>
        <p className="text-xs text-slate-400 mt-0.5">Servico Admin Panel</p>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {links.map(l => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                isActive ? 'bg-emerald-500/15 text-emerald-400 font-medium' : 'text-slate-300 hover:bg-surface2'
              }`
            }
          >
            <span className="w-5 text-center font-mono">{l.icon}</span>
            {l.label}
          </NavLink>
        ))}
      </nav>
      <div className="p-3 border-t border-slate-700">
        <p className="text-xs text-slate-400 mb-2 truncate">{user?.email}</p>
        <button
          onClick={() => { logout(); navigate('/login') }}
          className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-md transition-colors"
        >
          Logout
        </button>
      </div>
    </aside>
  )
}
