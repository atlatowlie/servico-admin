import { useState, useEffect } from 'react'
import { api } from '../utils/api'
import DataTable from '../components/DataTable'

/**
 * SMS Reconciliation — surface the daily worker's recovery counts so we
 * know how often the early-200-return path actually loses an inbound SMS.
 *
 * Healthy: recovered = 0 every day.
 * Caught:  recovered > 0 means the webhook lost something AND the net
 *          backfilled it from Twilio. Not a crisis but worth investigating.
 * Broken:  last_error_at populated means a run failed; check error_message
 *          in the recent runs table.
 */
export default function SmsReconciliation() {
  const [data, setData] = useState(null)
  const [days, setDays] = useState(30)
  const [tenantFilter, setTenantFilter] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setError('')
    setLoading(true)
    try {
      const qs = new URLSearchParams({ days: String(days) })
      if (tenantFilter.trim()) qs.set('tenant_id', tenantFilter.trim())
      const res = await api.get(`/api/admin/sms-reconciliation?${qs.toString()}`)
      setData(res)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const summaryColumns = [
    { key: 'tenant_name', label: 'Tenant', render: r => r.tenant_name || r.tenant_id || '(unknown)' },
    { key: 'runs_count', label: 'Runs' },
    { key: 'total_checked', label: 'Checked' },
    {
      key: 'total_recovered',
      label: 'Recovered',
      render: r => {
        const n = parseInt(r.total_recovered, 10) || 0
        const cls = n === 0
          ? 'text-emerald-400'
          : n < 5 ? 'text-amber-400' : 'text-red-400'
        return <span className={`font-medium ${cls}`}>{n}</span>
      },
    },
    { key: 'last_run_at', label: 'Last Run', render: r => r.last_run_at ? new Date(r.last_run_at).toLocaleString() : '—' },
    {
      key: 'last_error_at',
      label: 'Last Error',
      render: r => r.last_error_at
        ? <span className="text-red-400">{new Date(r.last_error_at).toLocaleString()}</span>
        : <span className="text-slate-500">—</span>,
    },
  ]

  const runColumns = [
    { key: 'run_started_at', label: 'Run At', render: r => new Date(r.run_started_at).toLocaleString() },
    { key: 'tenant_name', label: 'Tenant', render: r => r.tenant_name || r.tenant_id || '—' },
    {
      key: 'window',
      label: 'Window',
      render: r => `${new Date(r.window_start).toLocaleDateString()} → ${new Date(r.window_end).toLocaleDateString()}`,
    },
    { key: 'checked_count', label: 'Checked' },
    {
      key: 'recovered_count',
      label: 'Recovered',
      render: r => {
        const n = parseInt(r.recovered_count, 10) || 0
        const cls = n === 0 ? 'text-emerald-400' : 'text-amber-400 font-semibold'
        return <span className={cls}>{n}</span>
      },
    },
    {
      key: 'error_message',
      label: 'Error',
      render: r => r.error_message
        ? <span className="text-red-400 text-xs">{String(r.error_message).slice(0, 80)}</span>
        : <span className="text-slate-500">—</span>,
    },
  ]

  const totalRecovered = (data?.summary || []).reduce((acc, r) => acc + (parseInt(r.total_recovered, 10) || 0), 0)
  const anyError = (data?.recent_runs || []).some(r => r.error_message)
  const headerStatusCls = anyError
    ? 'text-red-400'
    : totalRecovered === 0 ? 'text-emerald-400' : 'text-amber-400'
  const headerStatus = anyError
    ? `Errors present — check recent runs`
    : totalRecovered === 0
      ? `Healthy: no gaps detected in the last ${days} days`
      : `${totalRecovered} message${totalRecovered === 1 ? '' : 's'} recovered in the last ${days} days`

  const inp = 'bg-dark border border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30'

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg md:text-xl font-bold">SMS Reconciliation</h2>
          <p className={`text-sm mt-0.5 ${headerStatusCls}`}>{headerStatus}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            className={inp}
            placeholder="Filter by tenant ID"
            value={tenantFilter}
            onChange={e => setTenantFilter(e.target.value)}
          />
          <select className={inp} value={days} onChange={e => setDays(parseInt(e.target.value, 10))}>
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last 365 days</option>
          </select>
          <button
            onClick={load}
            className="bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-sm px-4 py-2 rounded-lg transition-colors font-medium"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="bg-surface border border-slate-700 rounded-lg p-3 text-xs text-slate-400 leading-relaxed">
        Background: the Twilio inbound-SMS webhook responds 200 to Twilio
        BEFORE persisting the row. If the insert fails after that, Twilio
        won&apos;t retry. A daily worker polls Twilio&apos;s Messages API
        per tenant per phone number and backfills any missing rows via the
        shared threading service. Recovered = how many gaps the net caught.
      </div>

      {error && <p className="text-red-400 text-sm bg-red-500/10 rounded px-3 py-2">{error}</p>}

      <section className="space-y-2">
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Per-tenant summary</h3>
        {loading
          ? <p className="text-slate-500 text-sm">Loading…</p>
          : <DataTable
              columns={summaryColumns}
              rows={data?.summary || []}
              emptyText="No reconciliation runs yet in this window."
            />}
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Recent runs</h3>
        {loading
          ? <p className="text-slate-500 text-sm">Loading…</p>
          : <DataTable
              columns={runColumns}
              rows={data?.recent_runs || []}
              emptyText="No runs recorded in this window."
            />}
      </section>
    </div>
  )
}
