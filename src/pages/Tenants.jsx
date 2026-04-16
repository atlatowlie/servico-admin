import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../utils/api'
import DataTable from '../components/DataTable'
import Badge from '../components/Badge'
import Modal from '../components/Modal'

export default function Tenants() {
  const [tenants, setTenants] = useState([])
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ name: '', slug: '', plan: 'core', admin_email: '', admin_name: '', admin_password: '' })
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const load = () => api.get('/api/admin/tenants').then(d => setTenants(d.tenants || [])).catch(() => {})
  useEffect(() => { load() }, [])

  const filtered = tenants.filter(t =>
    t.name?.toLowerCase().includes(search.toLowerCase()) ||
    t.slug?.toLowerCase().includes(search.toLowerCase())
  )

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'slug', label: 'Slug' },
    { key: 'plan', label: 'Plan', render: r => <Badge value={r.plan} /> },
    { key: 'status', label: 'Status', render: r => <Badge value={r.status} /> },
    { key: 'user_count', label: 'Users' },
    { key: 'job_count', label: 'Jobs' },
    { key: 'created_at', label: 'Created', render: r => new Date(r.created_at).toLocaleDateString() },
  ]

  const handleCreate = async (e) => {
    e.preventDefault()
    setError('')
    setCreating(true)
    try {
      await api.post('/api/admin/tenants', form)
      setShowCreate(false)
      setForm({ name: '', slug: '', plan: 'core', admin_email: '', admin_name: '', admin_password: '' })
      load()
    } catch (err) {
      setError(err.message)
    } finally {
      setCreating(false)
    }
  }

  const inp = 'w-full bg-dark border border-slate-600 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30'

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-lg md:text-xl font-bold">Tenants</h2>
        <button onClick={() => setShowCreate(true)} className="bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-sm px-4 py-2.5 rounded-lg transition-colors font-medium">
          + New Tenant
        </button>
      </div>

      <input
        type="text" placeholder="Search tenants..." value={search} onChange={e => setSearch(e.target.value)}
        className="bg-surface border border-slate-700 rounded-lg px-3 py-2.5 text-sm w-full sm:max-w-xs focus:outline-none focus:border-emerald-500"
      />

      <DataTable columns={columns} rows={filtered} onRowClick={r => navigate(`/tenants/${r.id}`)} />

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Tenant">
        <form onSubmit={handleCreate} className="space-y-3">
          {error && <p className="text-red-400 text-sm bg-red-500/10 rounded px-3 py-2">{error}</p>}
          <input className={inp} placeholder="Company name" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          <input className={inp} placeholder="Slug (URL-safe)" required value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} />
          <select className={inp} value={form.plan} onChange={e => setForm({ ...form, plan: e.target.value })}>
            <option value="core">Core</option>
            <option value="growth">Growth</option>
            <option value="pro">Pro</option>
          </select>
          <hr className="border-slate-700" />
          <p className="text-xs text-slate-400">Admin User</p>
          <input className={inp} placeholder="Admin name" required value={form.admin_name} onChange={e => setForm({ ...form, admin_name: e.target.value })} />
          <input className={inp} type="email" placeholder="Admin email" required autoComplete="off" value={form.admin_email} onChange={e => setForm({ ...form, admin_email: e.target.value })} />
          <input className={inp} type="password" placeholder="Admin password" required autoComplete="new-password" value={form.admin_password} onChange={e => setForm({ ...form, admin_password: e.target.value })} />
          <button type="submit" disabled={creating} className="w-full bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-lg py-3 text-sm font-medium disabled:opacity-50">
            {creating ? 'Creating...' : 'Create Tenant'}
          </button>
        </form>
      </Modal>
    </div>
  )
}
