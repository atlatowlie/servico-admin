import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api, setToken } from '../utils/api'

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
      const data = await api.post('/api/auth/login', { email, password })
      const user = data.user
      if (user.role !== 'superadmin') {
        setError('Superadmin access required')
        return
      }
      login(user, data.accessToken || data.token)
      navigate('/')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-emerald-400">Minhal</h1>
          <p className="text-slate-400 text-sm mt-1">Servico Admin Panel</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-surface rounded-lg border border-slate-700 p-6 space-y-4">
          {error && <p className="text-red-400 text-sm bg-red-500/10 rounded px-3 py-2">{error}</p>}
          <div>
            <label className="block text-sm text-slate-400 mb-1">Email</label>
            <input
              type="email" required value={email} onChange={e => setEmail(e.target.value)}
              className="w-full bg-dark border border-slate-600 rounded px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Password</label>
            <input
              type="password" required value={password} onChange={e => setPassword(e.target.value)}
              className="w-full bg-dark border border-slate-600 rounded px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>
          <button
            type="submit" disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white rounded py-2 text-sm font-medium transition-colors disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}
