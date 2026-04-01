import { useState, useEffect } from 'react'
import { api } from '../utils/api'
import StatCard from '../components/StatCard'

function formatBytes(bytes) {
  if (bytes == null) return 'N/A'
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

function HealthTab({ health, appHealth }) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatCard label="Uptime" value={health ? formatUptime(health.uptime_seconds) : '-'} />
        <StatCard label="Heap Used" value={health ? formatBytes(health.memory?.heapUsed) : '-'} sub={health ? `of ${formatBytes(health.memory?.heapTotal)}` : ''} />
        <StatCard label="DB Size" value={health ? formatBytes(health.db_size_bytes) : '-'} />
        <StatCard label="Node" value={health?.node_version || '-'} />
      </div>

      {health?.table_counts && (
        <div>
          <h3 className="text-sm font-medium text-slate-400 mb-3">Database Tables</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {Object.entries(health.table_counts).map(([table, count]) => (
              <div key={table} className="bg-surface border border-slate-700 rounded-lg p-3">
                <p className="text-xs text-slate-400 capitalize">{table}</p>
                <p className="text-lg font-bold">{count}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
        <div className="bg-surface rounded-lg border border-slate-700 p-4 md:p-5">
          <h3 className="text-sm font-medium text-slate-400 mb-3">Database</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">Connected</span>
              <span className={health?.db_connected ? 'text-emerald-400' : 'text-red-400'}>
                {health?.db_connected ? 'Yes' : health ? 'No' : '-'}
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

function ErrorLogTab() {
  const [errors, setErrors] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(new Set())
  const [clearing, setClearing] = useState(false)

  const loadErrors = () => {
    setLoading(true)
    api.get('/api/admin/errors?limit=100')
      .then(d => setErrors(d.errors || []))
      .catch(() => setErrors([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadErrors() }, [])

  const toggleExpand = (id) => {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleClear = async () => {
    if (!confirm('Clear all error logs?')) return
    setClearing(true)
    try {
      await api.delete('/api/admin/errors')
      setErrors([])
    } catch {}
    setClearing(false)
  }

  const parseMeta = (meta) => {
    if (!meta) return null
    try {
      const obj = typeof meta === 'string' ? JSON.parse(meta) : meta
      const entries = Object.entries(obj).filter(([, v]) => v != null)
      if (entries.length === 0) return null
      return entries
    } catch { return null }
  }

  if (loading) {
    return <div className="text-slate-400 text-sm py-8 text-center">Loading error log...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">
          {errors.length === 0 ? 'No errors recorded.' : `${errors.length} error(s)`}
        </p>
        {errors.length > 0 && (
          <button
            onClick={handleClear}
            disabled={clearing}
            className="text-sm text-red-400 hover:text-red-300 px-3 py-1.5 border border-red-500/30 rounded-lg hover:bg-red-500/10 disabled:opacity-50"
          >
            {clearing ? 'Clearing...' : 'Clear All'}
          </button>
        )}
      </div>

      {errors.length > 0 && (
        <div className="space-y-2">
          {errors.map(err => {
            const isOpen = expanded.has(err.id)
            const meta = parseMeta(err.meta)
            return (
              <div key={err.id} className="bg-surface border border-slate-700 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleExpand(err.id)}
                  className="w-full text-left p-3 md:p-4 hover:bg-surface2 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded flex-shrink-0">
                          {err.context}
                        </span>
                        <span className="text-xs text-slate-500">
                          {new Date(err.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-red-300 truncate">{err.message}</p>
                    </div>
                    <svg
                      width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                      className={`flex-shrink-0 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    >
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </div>
                </button>
                {isOpen && (
                  <div className="border-t border-slate-700 p-3 md:p-4 space-y-3">
                    {meta && (
                      <div>
                        <p className="text-xs font-medium text-slate-400 mb-1">Meta</p>
                        <div className="flex flex-wrap gap-2">
                          {meta.map(([k, v]) => (
                            <span key={k} className="text-xs bg-slate-700/50 text-slate-300 px-2 py-1 rounded">
                              {k}: {Array.isArray(v) ? v.join(', ') : String(v)}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {err.stack && (
                      <div>
                        <p className="text-xs font-medium text-slate-400 mb-1">Stack Trace</p>
                        <pre className="text-xs text-slate-400 bg-slate-900 rounded p-3 overflow-x-auto whitespace-pre-wrap break-all max-h-48 overflow-y-auto">
                          {err.stack}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function SelfTestTab() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/api/admin/self-test')
      .then(d => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="text-slate-400 text-sm py-8 text-center">Loading...</div>
  if (!data) return <div className="text-slate-400 text-sm py-8 text-center">Could not load self-test results.</div>

  const st = data.selfTest
  const mg = data.migration

  return (
    <div className="space-y-5">
      {/* Self-test results */}
      <div className="bg-surface rounded-lg border border-slate-700 p-4 md:p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-slate-400">Startup Self-Test</h3>
          {st && (
            <span className={`text-xs px-2 py-1 rounded ${st.passed ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
              {st.passed ? 'PASSED' : `FAILED (${st.errors.length})`}
            </span>
          )}
        </div>
        {st?.ranAt && <p className="text-xs text-slate-500 mb-3">Ran at: {new Date(st.ranAt).toLocaleString()}</p>}
        {st?.errors?.length > 0 && (
          <div className="space-y-1">
            {st.errors.map((e, i) => (
              <div key={i} className="text-sm text-red-300 bg-red-500/10 rounded px-3 py-2">
                <span className="font-mono text-red-400">{e.table}</span>: {e.error}
              </div>
            ))}
          </div>
        )}
        {st?.passed && <p className="text-sm text-emerald-400">All tables verified successfully.</p>}
      </div>

      {/* Migration check results */}
      <div className="bg-surface rounded-lg border border-slate-700 p-4 md:p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-slate-400">Migration Check</h3>
          {mg && (
            <span className={`text-xs px-2 py-1 rounded ${mg.missing.length === 0 ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'}`}>
              {mg.missing.length === 0 ? 'ALL PRESENT' : `${mg.missing.length} missing`}
            </span>
          )}
        </div>
        {mg?.ranAt && <p className="text-xs text-slate-500 mb-3">Ran at: {new Date(mg.ranAt).toLocaleString()}</p>}
        {mg?.missing?.length > 0 && (
          <div className="space-y-1">
            {mg.missing.map((m, i) => (
              <div key={i} className="text-sm text-amber-300 bg-amber-500/10 rounded px-3 py-2">
                {m.table}.{m.column} -- {mg.fixResult?.fixed?.some(f => f.table === m.table && f.column === m.column) ? 'auto-fixed' : 'needs manual fix'}
              </div>
            ))}
          </div>
        )}
        {mg?.missing?.length === 0 && <p className="text-sm text-emerald-400">All schema columns present in database.</p>}
      </div>
    </div>
  )
}

const TABS = [
  { id: 'health', label: 'Health' },
  { id: 'errors', label: 'Error Log' },
  { id: 'selftest', label: 'Self-Test' },
]

export default function SystemHealth() {
  const [health, setHealth] = useState(null)
  const [appHealth, setAppHealth] = useState(null)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('health')

  const refresh = () => {
    setError(null)
    api.get('/api/admin/health').then(d => setHealth(d.health)).catch(e => setError(e.message))
    api.get('/api/health').then(d => setAppHealth(d)).catch(() => {})
  }

  useEffect(() => { refresh() }, [])

  return (
    <div className="space-y-5 md:space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg md:text-xl font-bold">System Health</h2>
        <button onClick={refresh} className="text-sm text-emerald-400 hover:text-emerald-300 active:text-emerald-200 px-3 py-1.5">
          Refresh
        </button>
      </div>

      {error && <p className="text-red-400 text-sm bg-red-500/10 rounded-lg px-4 py-3">{error}</p>}

      {/* Tab navigation */}
      <div className="flex gap-1 border-b border-slate-700">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === tab.id
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'health' && <HealthTab health={health} appHealth={appHealth} />}
      {activeTab === 'errors' && <ErrorLogTab />}
      {activeTab === 'selftest' && <SelfTestTab />}
    </div>
  )
}
