import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../utils/api'
import Badge from '../components/Badge'
import DataTable from '../components/DataTable'
import StatCard from '../components/StatCard'

export default function TenantDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [tenant, setTenant] = useState(null)
  const [users, setUsers] = useState([])
  const [jobs, setJobs] = useState([])
  const [customers, setCustomers] = useState([])
  const [numbers, setNumbers] = useState([])
  const [usage, setUsage] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('users')

  const load = async () => {
    try {
      const data = await api.get(`/api/admin/tenants/${id}`)
      setTenant(data.tenant)
      setUsers(data.users || [])
      setJobs(data.jobs || [])
      setCustomers(data.customers || [])
      setNumbers(data.numbers || [])
      setUsage(data.usage || [])
    } catch {}
    setLoading(false)
  }

  useEffect(() => { load() }, [id])

  const toggleStatus = async () => {
    const newStatus = tenant.status === 'active' ? 'suspended' : 'active'
    await api.patch(`/api/admin/tenants/${id}`, { status: newStatus })
    load()
  }

  const changePlan = async (plan) => {
    await api.patch(`/api/admin/tenants/${id}`, { plan })
    load()
  }

  if (loading) return <p className="text-slate-400 p-4">Loading...</p>
  if (!tenant) return <p className="text-red-400 p-4">Tenant not found</p>

  const userCols = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role', render: r => <Badge value={r.role} /> },
    { key: 'created_at', label: 'Joined', render: r => new Date(r.created_at).toLocaleDateString() },
  ]

  const jobCols = [
    { key: 'title', label: 'Title' },
    { key: 'status', label: 'Status', render: r => <Badge value={r.status} /> },
    { key: 'created_at', label: 'Created', render: r => new Date(r.created_at).toLocaleDateString() },
  ]

  const customerCols = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'status', label: 'Status', render: r => <Badge value={r.status} /> },
  ]

  const numberCols = [
    { key: 'phone_number', label: 'Number' },
    { key: 'purpose', label: 'Purpose' },
    { key: 'status', label: 'Status', render: r => <Badge value={r.status || 'active'} /> },
  ]

  const tabs = [
    { key: 'users', label: 'Users', count: users.length },
    { key: 'jobs', label: 'Jobs', count: jobs.length },
    { key: 'customers', label: 'Customers', count: customers.length },
    { key: 'numbers', label: 'Numbers', count: numbers.length },
  ]

  return (
    <div className="space-y-5 md:space-y-6">
      <button onClick={() => navigate('/tenants')} className="text-sm text-slate-400 hover:text-slate-200 active:text-white py-1">
        &larr; Back to Tenants
      </button>

      {/* Header card */}
      <div className="bg-surface rounded-lg border border-slate-700 p-4 md:p-5">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <h2 className="text-lg md:text-xl font-bold">{tenant.name}</h2>
            <p className="text-sm text-slate-400 mt-1">Slug: {tenant.slug}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge value={tenant.status} />
            <Badge value={tenant.plan} />
          </div>
        </div>
        <div className="flex flex-wrap gap-3 mt-4">
          <button
            onClick={toggleStatus}
            className={`text-sm px-4 py-2 rounded-lg transition-colors font-medium ${
              tenant.status === 'active'
                ? 'bg-red-500/15 text-red-400 hover:bg-red-500/25 active:bg-red-500/30'
                : 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 active:bg-emerald-500/30'
            }`}
          >
            {tenant.status === 'active' ? 'Suspend' : 'Activate'}
          </button>
          <select
            value={tenant.plan}
            onChange={e => changePlan(e.target.value)}
            className="bg-dark border border-slate-600 rounded-lg px-3 py-2 text-sm"
          >
            <option value="starter">Starter</option>
            <option value="pro">Pro</option>
            <option value="enterprise">Enterprise</option>
          </select>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Users" value={users.length} />
        <StatCard label="Jobs" value={jobs.length} />
        <StatCard label="Customers" value={customers.length} />
        <StatCard label="Numbers" value={numbers.length} />
      </div>

      {/* Usage */}
      {usage.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-slate-400 mb-3">Usage Summary</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {usage.map(u => (
              <div key={u.type} className="bg-surface border border-slate-700 rounded-lg p-4">
                <p className="text-xs text-slate-400 capitalize">{u.type}</p>
                <p className="text-lg font-bold">{u.count} <span className="text-sm font-normal text-slate-400">calls</span></p>
                <p className="text-xs text-slate-500">${(parseInt(u.total_cost || 0, 10) / 100).toFixed(2)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabbed data */}
      <div>
        <div className="flex gap-1 border-b border-slate-700 mb-4 overflow-x-auto">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-3 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                tab === t.key
                  ? 'border-emerald-400 text-emerald-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {t.label} <span className="text-xs ml-1 opacity-60">({t.count})</span>
            </button>
          ))}
        </div>

        {tab === 'users' && <DataTable columns={userCols} rows={users} emptyText="No users" />}
        {tab === 'jobs' && <DataTable columns={jobCols} rows={jobs} emptyText="No jobs" />}
        {tab === 'customers' && <DataTable columns={customerCols} rows={customers} emptyText="No customers" />}
        {tab === 'numbers' && <DataTable columns={numberCols} rows={numbers} emptyText="No phone numbers provisioned" />}
      </div>
    </div>
  )
}
