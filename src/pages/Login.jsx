import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../utils/api'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await api.post('/api/admin/login', { email, password })
      login(data.user, data.accessToken || data.token)
      navigate('/')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-dark px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-emerald-400">Minhal</h1>
          <p className="text-slate-400 text-sm mt-1">Servico Admin Panel</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-surface rounded-lg border border-slate-700 p-5 sm:p-6 space-y-4">
          {error && <p className="text-red-400 text-sm bg-red-500/10 rounded px-3 py-2">{error}</p>}
          <div>
            <label className="block text-sm text-slate-400 mb-1.5">Email</label>
            <input
              type="email" required value={email} onChange={e => setEmail(e.target.value)}
              autoComplete="email"
              className="w-full bg-dark border border-slate-600 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1.5">Password</label>
            <input
              type="password" required value={password} onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
              className="w-full bg-dark border border-slate-600 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30"
            />
          </div>
          <button
            type="submit" disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-lg py-3 text-sm font-medium transition-colors disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}
