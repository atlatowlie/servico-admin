import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../utils/api'
import StatCard from '../components/StatCard'
import DataTable from '../components/DataTable'
import Badge from '../components/Badge'

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [tenants, setTenants] = useState([])
  const [activity, setActivity] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/api/admin/stats').then(d => setStats(d.stats)).catch(() => {})
    api.get('/api/admin/tenants').then(d => setTenants(d.tenants?.slice(0, 5) || [])).catch(() => {})
    api.get('/api/admin/activity?limit=10').then(d => setActivity(d.activity || [])).catch(() => {})
  }, [])

  const tenantCols = [
    { key: 'name', label: 'Name' },
    { key: 'plan', label: 'Plan', render: r => <Badge value={r.plan} /> },
    { key: 'user_count', label: 'Users' },
    { key: 'job_count', label: 'Jobs' },
  ]

  const eventLabels = {
    tenant_created: 'New tenant',
    user_created: 'New user',
    job_created: 'New job',
  }

  return (
    <div className="space-y-5 md:space-y-6">
      <h2 className="text-lg md:text-xl font-bold">Dashboard</h2>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
        <StatCard label="Tenants" value={stats?.total_tenants ?? '-'} />
        <StatCard label="Users" value={stats?.total_users ?? '-'} />
        <StatCard label="Jobs" value={stats?.total_jobs ?? '-'} />
        <StatCard label="Customers" value={stats?.total_customers ?? '-'} />
        <StatCard label="Revenue" value={stats ? `$${(stats.total_revenue_cents / 100).toFixed(2)}` : '-'} sub="Twilio usage" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-6">
        <div>
          <h3 className="text-sm font-medium text-slate-400 mb-3">Recent Tenants</h3>
          <DataTable columns={tenantCols} rows={tenants} onRowClick={r => navigate(`/tenants/${r.id}`)} />
        </div>
        <div>
          <h3 className="text-sm font-medium text-slate-400 mb-3">Activity Feed</h3>
          <div className="bg-surface rounded-lg border border-slate-700 divide-y divide-slate-700/50">
            {activity.length === 0 ? (
              <p className="p-4 text-sm text-slate-500">No recent activity</p>
            ) : activity.map((a, i) => (
              <div key={i} className="px-3.5 md:px-4 py-3 text-sm flex items-start gap-2">
                <span className="text-emerald-400 font-mono text-xs mt-0.5 flex-shrink-0 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                  {eventLabels[a.event] || a.event}
                </span>
                <span className="text-slate-300 truncate min-w-0">{a.detail}</span>
                <span className="text-slate-500 text-xs flex-shrink-0 ml-auto">{new Date(a.created_at).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
