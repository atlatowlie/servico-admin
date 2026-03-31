import { useState, useEffect } from 'react'
import { api } from '../utils/api'
import StatCard from '../components/StatCard'

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1073741824) return `${(bytes / 1048576).toFixed(1)} MB`
  return `${(bytes / 1073741824).toFixed(2)} GB`
}

function formatUptime(seconds) {
  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return `${d}d ${h}h ${m}m`
}

export default function SystemHealth() {
  const [health, setHealth] = useState(null)
  const [appHealth, setAppHealth] = useState(null)

  useEffect(() => {
    api.get('/api/admin/health').then(d => setHealth(d.health)).catch(() => {})
    api.get('/api/health').then(d => setAppHealth(d)).catch(() => {})
  }, [])

  return (
    <div className="space-y-5 md:space-y-6">
      <h2 className="text-lg md:text-xl font-bold">System Health</h2>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatCard label="Uptime" value={health ? formatUptime(health.uptime_seconds) : '-'} />
        <StatCard label="Heap Used" value={health ? formatBytes(health.memory?.heapUsed) : '-'} sub={health ? `of ${formatBytes(health.memory?.heapTotal)}` : ''} />
        <StatCard label="DB Size" value={health ? formatBytes(health.db_size_bytes) : '-'} />
        <StatCard label="Node" value={health?.node_version || '-'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
        <div className="bg-surface rounded-lg border border-slate-700 p-4 md:p-5">
          <h3 className="text-sm font-medium text-slate-400 mb-3">Database</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">Connected</span>
              <span className={health?.db_connected ? 'text-emerald-400' : 'text-red-400'}>
                {health?.db_connected ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-slate-400 flex-shrink-0">Server Time</span>
              <span className="text-slate-200 text-right truncate">{health?.db_time ? new Date(health.db_time).toLocaleString() : '-'}</span>
            </div>
          </div>
        </div>
        <div className="bg-surface rounded-lg border border-slate-700 p-4 md:p-5">
          <h3 className="text-sm font-medium text-slate-400 mb-3">Application</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">Status</span>
              <span className={appHealth?.status === 'ok' ? 'text-emerald-400' : 'text-red-400'}>
                {appHealth?.status || '-'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Service</span>
              <span className="text-slate-200">{appHealth?.service || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">RSS Memory</span>
              <span className="text-slate-200">{health ? formatBytes(health.memory?.rss) : '-'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
