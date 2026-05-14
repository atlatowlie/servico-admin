import { useState } from 'react'
import { api } from '../utils/api'
import DataTable from '../components/DataTable'

/**
 * Call Recordings Backfill — superadmin-only one-shot to recover call
 * recordings whose Twilio recording-ready webhook never fired.
 *
 * Surface notes (route-review C-2 / decision 2.2 = W):
 *   This used to live under /api/calls/admin/backfill-recordings on the
 *   tenant-callable surface. Zohar's note was "needs to be in minhal
 *   features not in tenant settings" — so it's now exposed here, on the
 *   minhal admin panel, and the backend has dropped the tenant-admin
 *   path entirely: only role='superadmin' may invoke it.
 *
 * Querying:
 *   POST /api/admin/calls/backfill-recordings
 *     ?dry_run=1            preview only, no writes
 *     ?days=N               lookback window (default 90, max 365)
 *     ?tenant=<uuid>        target one tenant; omit = scan all tenants
 *     ?no_r2=1              skip R2 upload, leave on Twilio
 */
export default function CallRecordingsBackfill() {
  const [tenantId, setTenantId] = useState('')
  const [days, setDays] = useState(90)
  const [dryRun, setDryRun] = useState(true)
  const [noR2, setNoR2] = useState(false)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)

  const run = async () => {
    setError('')
    setResult(null)
    setRunning(true)
    try {
      const qs = new URLSearchParams()
      qs.set('days', String(days))
      if (dryRun) qs.set('dry_run', '1')
      if (noR2) qs.set('no_r2', '1')
      if (tenantId.trim()) qs.set('tenant', tenantId.trim())
      const res = await api.post(`/api/admin/calls/backfill-recordings?${qs.toString()}`, {})
      setResult(res)
    } catch (e) {
      setError(e.message || 'Backfill failed')
    } finally {
      setRunning(false)
    }
  }

  const totals = result?.totals || null
  const results = Array.isArray(result?.results) ? result.results : []

  const resultColumns = [
    { key: 'call_log_id', label: 'Call Log', render: r => <span className="font-mono text-xs">{r.call_log_id}</span> },
    { key: 'twilio_sid', label: 'Twilio Call SID', render: r => <span className="font-mono text-xs">{r.twilio_sid || '—'}</span> },
    { key: 'recording_sid', label: 'Recording SID', render: r => <span className="font-mono text-xs">{r.recording_sid || '—'}</span> },
    { key: 'duration', label: 'Duration (s)', render: r => r.duration ?? '—' },
    {
      key: 'persisted',
      label: 'Persisted',
      render: r => r.persisted
        ? <span className="text-emerald-400 font-medium">yes</span>
        : <span className="text-slate-500">—</span>,
    },
    {
      key: 'uploaded',
      label: 'R2 Uploaded',
      render: r => r.uploaded
        ? <span className="text-emerald-400 font-medium">yes</span>
        : <span className="text-slate-500">—</span>,
    },
    {
      key: 'error',
      label: 'Error',
      render: r => r.error
        ? <span className="text-red-400 text-xs">{String(r.error).slice(0, 80)}</span>
        : <span className="text-slate-500">—</span>,
    },
  ]

  const inp = 'bg-dark border border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30'

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg md:text-xl font-bold">Call Recordings Backfill</h2>
        <p className="text-sm text-slate-400 mt-0.5">
          Recover Twilio recordings whose <code className="text-emerald-400">recording-ready</code> webhook never fired.
          Idempotent — rows already on R2 (or already linked to a recording SID) are skipped.
        </p>
      </div>

      <div className="bg-surface border border-slate-700 rounded-lg p-3 text-xs text-slate-400 leading-relaxed">
        Tenant scope: leave the tenant ID blank to scan <span className="text-slate-200">every</span> tenant
        in the lookback window. Useful when bringing a fresh prod env online or after a webhook outage.
        Always start with <span className="text-emerald-400">Dry run</span> on a wide window — the live
        run hits Twilio's Recordings API once per candidate call.
      </div>

      <div className="bg-surface border border-slate-700 rounded-lg p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="block">
            <span className="block text-xs text-slate-400 mb-1">Tenant ID (UUID, optional)</span>
            <input
              className={`${inp} w-full font-mono`}
              placeholder="leave blank for all tenants"
              value={tenantId}
              onChange={e => setTenantId(e.target.value)}
            />
          </label>
          <label className="block">
            <span className="block text-xs text-slate-400 mb-1">Lookback window (days, 1–365)</span>
            <input
              type="number"
              min={1}
              max={365}
              className={`${inp} w-full`}
              value={days}
              onChange={e => setDays(Math.max(1, Math.min(365, parseInt(e.target.value, 10) || 90)))}
            />
          </label>
        </div>

        <div className="flex flex-wrap gap-4">
          <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={dryRun}
              onChange={e => setDryRun(e.target.checked)}
              className="w-4 h-4 accent-emerald-500"
            />
            <span className="text-slate-200">Dry run <span className="text-slate-500">(report only, no writes)</span></span>
          </label>
          <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={noR2}
              onChange={e => setNoR2(e.target.checked)}
              className="w-4 h-4 accent-emerald-500"
            />
            <span className="text-slate-200">Skip R2 upload <span className="text-slate-500">(leave on Twilio)</span></span>
          </label>
        </div>

        <div className="flex gap-2">
          <button
            onClick={run}
            disabled={running}
            className="bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white text-sm px-4 py-2 rounded-lg transition-colors font-medium"
          >
            {running ? 'Running…' : (dryRun ? 'Run dry run' : 'Run backfill')}
          </button>
        </div>
      </div>

      {error && <p className="text-red-400 text-sm bg-red-500/10 rounded px-3 py-2">{error}</p>}

      {totals && (
        <section className="space-y-2">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Totals</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Stat label="Candidates" value={totals.candidates} />
            <Stat label="Scanned" value={totals.scanned} />
            <Stat label="Recordings Found" value={totals.found} />
            <Stat label="Persisted" value={totals.persisted} accent={totals.persisted > 0 ? 'text-emerald-400' : ''} />
            <Stat label="Uploaded to R2" value={totals.uploaded} accent={totals.uploaded > 0 ? 'text-emerald-400' : ''} />
            <Stat label="Errors" value={totals.errors} accent={totals.errors > 0 ? 'text-red-400' : ''} />
            <Stat label="Window (days)" value={totals.days} />
            <Stat label="Mode" value={totals.dryRun ? 'dry run' : 'live'} accent={totals.dryRun ? 'text-amber-400' : 'text-emerald-400'} />
          </div>
          <p className="text-xs text-slate-500">
            R2 enabled: {String(totals.r2Enabled)} · Tenant: {totals.tenantId || '(all tenants)'}
          </p>
        </section>
      )}

      {results.length > 0 && (
        <section className="space-y-2">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Per-row results</h3>
          <DataTable
            columns={resultColumns}
            rows={results}
            emptyText="No candidate rows in this window."
          />
        </section>
      )}
    </div>
  )
}

function Stat({ label, value, accent = '' }) {
  return (
    <div className="bg-surface border border-slate-700 rounded-lg px-3 py-2">
      <div className="text-xs text-slate-500">{label}</div>
      <div className={`text-base font-semibold ${accent || 'text-slate-200'}`}>{value ?? '—'}</div>
    </div>
  )
}
