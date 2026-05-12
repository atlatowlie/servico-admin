import { useState, useEffect, useMemo } from 'react'
import { api } from '../utils/api'
import { subscriptionFeatures } from '../utils/subscriptionCatalog'

// A pack = a curated bundle of feature_keys. Apply a pack to a tenant
// from the tenant detail page and every feature in the bundle becomes
// a tenant_feature_overrides row with enabled=true.

function slugify(s) {
  return String(s || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 60)
}

export default function Packs() {
  const [packs, setPacks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    setError('')
    try {
      const res = await api.get('/api/admin/packs')
      setPacks(res.packs || [])
    } catch (e) {
      setError(e.message || 'Failed to load packs')
    } finally {
      setLoading(false)
    }
  }

  async function deletePack(pack) {
    if (!confirm(`Delete pack "${pack.name}"? Tenants who already had it applied keep their overrides.`)) return
    try {
      await api.delete(`/api/admin/packs/${pack.id}`)
      setPacks(prev => prev.filter(p => p.id !== pack.id))
    } catch (e) {
      alert(e.message || 'Failed to delete')
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-100">Feature Packs</h1>
          <p className="text-sm text-slate-400 mt-1">Curated feature bundles. Apply a pack to a tenant from the tenant detail page to flip every feature in the bundle on at once.</p>
        </div>
        <button
          onClick={() => setEditing({ key: '', name: '', description: '', is_active: true, features: [] })}
          className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium"
        >
          + New Pack
        </button>
      </div>

      {error && <div className="rounded-lg bg-red-900/40 border border-red-800 px-4 py-3 text-sm text-red-200 mb-4">{error}</div>}

      {loading ? (
        <p className="text-sm text-slate-400">Loading…</p>
      ) : packs.length === 0 ? (
        <div className="rounded-xl border border-slate-700 bg-surface p-8 text-center">
          <p className="text-sm text-slate-400 mb-4">No packs configured yet.</p>
          <p className="text-xs text-slate-500">Packs are reusable bundles of features (e.g. "Construction Workflow" = project_management + change_orders + …). Once created, applying a pack to a tenant flips every feature in the bundle on in one click.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {packs.map(pack => (
            <div key={pack.id} className="rounded-xl border border-slate-700 bg-surface p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-3">
                    <h3 className="text-base font-medium text-slate-100">{pack.name}</h3>
                    <span className="text-xs font-mono text-slate-500 bg-surface2 px-2 py-0.5 rounded">{pack.key}</span>
                    {!pack.is_active && <span className="text-xs px-2 py-0.5 rounded bg-slate-700 text-slate-300">Inactive</span>}
                  </div>
                  {pack.description && <p className="text-xs text-slate-400 mt-1">{pack.description}</p>}
                  <div className="flex flex-wrap gap-1 mt-3">
                    {(pack.features || []).map(f => (
                      <span key={f.feature_key} className="text-xs px-2 py-0.5 rounded bg-surface2 text-slate-200 border border-slate-700">{f.feature_name || f.feature_key}</span>
                    ))}
                    {(!pack.features || pack.features.length === 0) && <span className="text-xs text-slate-500 italic">no features</span>}
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => setEditing(pack)} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-surface2 text-slate-200 border border-slate-700 hover:bg-slate-700">Edit</button>
                  <button onClick={() => deletePack(pack)} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-900/40 text-red-300 border border-red-800 hover:bg-red-900/60">Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && <PackEditor pack={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load() }} />}
    </div>
  )
}

function PackEditor({ pack, onClose, onSaved }) {
  const isEdit = !!pack.id
  const [meta, setMeta] = useState({
    key: pack.key || '',
    name: pack.name || '',
    description: pack.description || '',
    is_active: pack.is_active ?? true,
  })
  const [selected, setSelected] = useState(() => new Set((pack.features || []).map(f => f.feature_key)))
  const [filter, setFilter] = useState('')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  function toggle(key) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key); else next.add(key)
      return next
    })
  }

  function autoKey() {
    if (!isEdit && !meta.key && meta.name) {
      setMeta(m => ({ ...m, key: 'pack.' + slugify(m.name) }))
    }
  }

  async function handleSave() {
    if (!meta.name.trim()) { setErr('Name is required'); return }
    if (!meta.key.trim()) { setErr('Key is required'); return }
    setSaving(true)
    setErr('')
    try {
      const payload = {
        key: meta.key.trim(),
        name: meta.name.trim(),
        description: meta.description || '',
        is_active: meta.is_active,
        features: Array.from(selected),
      }
      if (isEdit) {
        await api.put(`/api/admin/packs/${pack.id}`, payload)
      } else {
        await api.post('/api/admin/packs', payload)
      }
      onSaved()
    } catch (e) {
      setErr(e.message || 'Failed to save pack')
    } finally {
      setSaving(false)
    }
  }

  // Group selectable features by their catalog kind
  const grouped = useMemo(() => {
    const list = subscriptionFeatures.filter(f =>
      f.kind !== 'platform' && f.kind !== 'limit' && f.kind !== 'pack'
      && (filter === '' || (f.label + ' ' + f.key).toLowerCase().includes(filter.toLowerCase()))
    )
    const out = {}
    for (const f of list) {
      const k = f.kind || 'feature'
      if (!out[k]) out[k] = []
      out[k].push(f)
    }
    return out
  }, [filter])

  return (
    <div onClick={onClose} className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div onClick={e => e.stopPropagation()} className="bg-surface border border-slate-700 rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-100">{isEdit ? 'Edit Pack' : 'New Pack'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200">✕</button>
        </div>
        <div className="px-6 py-5 space-y-5">
          {err && <div className="rounded-lg bg-red-900/40 border border-red-800 px-3 py-2 text-sm text-red-200">{err}</div>}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Name</label>
              <input value={meta.name} onBlur={autoKey} onChange={e => setMeta(m => ({ ...m, name: e.target.value }))} className="w-full rounded-lg bg-dark border border-slate-600 px-3 py-2 text-sm focus:outline-none focus:border-emerald-500" placeholder="e.g. Construction Workflow" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Key (snake_case)</label>
              <input value={meta.key} onChange={e => setMeta(m => ({ ...m, key: e.target.value.toLowerCase() }))} disabled={isEdit} className="w-full rounded-lg bg-dark border border-slate-600 px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 disabled:opacity-60" placeholder="pack.construction" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Description</label>
            <input value={meta.description} onChange={e => setMeta(m => ({ ...m, description: e.target.value }))} className="w-full rounded-lg bg-dark border border-slate-600 px-3 py-2 text-sm focus:outline-none focus:border-emerald-500" placeholder="What this bundle is for" />
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input type="checkbox" checked={!!meta.is_active} onChange={e => setMeta(m => ({ ...m, is_active: e.target.checked }))} />
            Active (uncheck to retire without deleting)
          </label>

          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-slate-300">Features in this pack <span className="text-xs text-slate-500">({selected.size} selected)</span></h3>
              <input value={filter} onChange={e => setFilter(e.target.value)} placeholder="Filter…" className="rounded-lg bg-dark border border-slate-600 px-3 py-1.5 text-xs w-48 focus:outline-none focus:border-emerald-500" />
            </div>
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {Object.entries(grouped).map(([kind, items]) => (
                <div key={kind}>
                  <div className="text-xs uppercase tracking-wide text-slate-500 mb-1.5">{kind === 'module' ? 'Modules' : kind === 'feature' ? 'Features' : kind === 'pack' ? 'Other packs' : kind}</div>
                  <div className="space-y-1">
                    {items.map(f => (
                      <label key={f.key} className="flex items-start gap-3 px-3 py-2 rounded-lg bg-surface2 border border-slate-700 cursor-pointer hover:border-slate-500">
                        <input type="checkbox" checked={selected.has(f.key)} onChange={() => toggle(f.key)} className="mt-1" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-slate-100">{f.label}</span>
                            <span className="text-xs font-mono text-slate-500">{f.key}</span>
                          </div>
                          {f.description && <p className="text-xs text-slate-400 mt-0.5">{f.description}</p>}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-slate-700 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-surface2 text-slate-300 border border-slate-700 text-sm">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium disabled:opacity-50">{saving ? 'Saving…' : isEdit ? 'Save Pack' : 'Create Pack'}</button>
        </div>
      </div>
    </div>
  )
}
