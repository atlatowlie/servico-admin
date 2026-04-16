import { useEffect, useState } from 'react'
import { api } from '../utils/api'
import Badge from '../components/Badge'
import Modal from '../components/Modal'
import StatCard from '../components/StatCard'
import {
  createEmptyFeatureState,
  featureStateToPayload,
  isLimitFeature,
  normalizePlans,
  seedPlansFromDefaults,
  subscriptionSections,
} from '../utils/subscriptionCatalog'

function countEnabled(state) {
  return Object.values(state || {}).filter(value => !!value?.enabled).length
}

function createBlankPlan() {
  return {
    key: '',
    name: '',
    description: '',
    rank: 0,
    is_active: true,
  }
}

export default function Plans() {
  const [plans, setPlans] = useState([])
  const [selectedKey, setSelectedKey] = useState('')
  const [draft, setDraft] = useState(createBlankPlan())
  const [featureState, setFeatureState] = useState(createEmptyFeatureState())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)
  const [showCreate, setShowCreate] = useState(false)
  const [createDraft, setCreateDraft] = useState(createBlankPlan())
  const [createFeatureState, setCreateFeatureState] = useState(createEmptyFeatureState())
  const [localPreview, setLocalPreview] = useState(false)

  const load = async (preferredKey = '') => {
    setLoading(true)
    setMessage(null)
    try {
      const [plansData, featuresData] = await Promise.all([
        api.get('/api/admin/subscription-plans').catch(() => null),
        api.get('/api/admin/features').catch(() => null),
      ])

      const nextPlans = normalizePlans(plansData?.plans || plansData?.subscription_plans || plansData || [])
      const nextFeatures = featuresData?.features || featuresData || []
      const catalogPlans = nextPlans.length > 0 ? nextPlans : seedPlansFromDefaults()
      setPlans(catalogPlans)
      setLocalPreview(nextPlans.length === 0)

      if (preferredKey) {
        setSelectedKey(preferredKey)
      } else if (!catalogPlans.some(plan => plan.key === selectedKey)) {
        setSelectedKey(catalogPlans[0]?.key || '')
      }

      if (nextFeatures.length > 0) {
        setMessage({ type: 'info', text: 'Loaded live feature definitions from the admin API.' })
      } else if (nextPlans.length === 0) {
        setMessage({ type: 'info', text: 'Subscription APIs are not available yet. Showing local plan preview.' })
      }
    } catch (err) {
      const catalogPlans = seedPlansFromDefaults()
      setPlans(catalogPlans)
      setSelectedKey(catalogPlans[0]?.key || '')
      setLocalPreview(true)
      setMessage({ type: 'info', text: 'Using local subscription preview because the admin APIs are unavailable.' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const selectedPlan = plans.find(plan => plan.key === selectedKey) || plans[0] || null

  useEffect(() => {
    if (!selectedPlan) return
    setDraft({
      key: selectedPlan.key || '',
      name: selectedPlan.name || '',
      description: selectedPlan.description || '',
      rank: selectedPlan.rank ?? 0,
      is_active: selectedPlan.is_active !== false,
    })
    setFeatureState(selectedPlan.featureState || createEmptyFeatureState())
  }, [selectedPlan])

  const handleSelect = (plan) => {
    setSelectedKey(plan.key)
  }

  const handleSavePlan = async () => {
    if (!draft.key.trim() || !draft.name.trim()) {
      setMessage({ type: 'error', text: 'Plan key and name are required.' })
      return
    }

    setSaving(true)
    setMessage(null)
    try {
      const payload = {
        key: draft.key.trim(),
        name: draft.name.trim(),
        description: draft.description.trim(),
        rank: Number(draft.rank || 0),
        is_active: !!draft.is_active,
      }

      if (localPreview) {
        setPlans(current =>
          current.map(plan => plan.key === payload.key ? { ...plan, ...payload, featureState } : plan),
        )
        setMessage({ type: 'success', text: `Updated ${payload.name} in local preview mode.` })
        setSelectedKey(payload.key)
        setSaving(false)
        return
      }

      await api.patch(`/api/admin/subscription-plans/${draft.key}`, payload)
      await api.put(`/api/admin/subscription-plans/${draft.key}/features`, {
        features: featureStateToPayload(featureState),
      })
      setMessage({ type: 'success', text: 'Plan saved successfully.' })
      await load(draft.key)
    } catch (err) {
      setMessage({ type: 'error', text: err?.message || 'Failed to save plan.' })
    } finally {
      setSaving(false)
    }
  }

  const handleCreatePlan = async (e) => {
    e.preventDefault()
    if (!createDraft.key.trim() || !createDraft.name.trim()) {
      setMessage({ type: 'error', text: 'Plan key and name are required.' })
      return
    }

    setSaving(true)
    setMessage(null)
    try {
      const payload = {
        key: createDraft.key.trim(),
        name: createDraft.name.trim(),
        description: createDraft.description.trim(),
        rank: Number(createDraft.rank || 0),
        is_active: !!createDraft.is_active,
      }

      if (localPreview) {
        const created = {
          ...payload,
          featureState: createFeatureState,
        }
        setPlans(current => [created, ...current.filter(plan => plan.key !== created.key)])
        setSelectedKey(created.key)
        setMessage({ type: 'success', text: `Created ${created.name} in local preview mode.` })
        setShowCreate(false)
        setCreateDraft(createBlankPlan())
        setCreateFeatureState(createEmptyFeatureState())
        return
      }

      const created = await api.post('/api/admin/subscription-plans', payload)
      const createdKey = created?.plan?.key || created?.key || payload.key
      await api.put(`/api/admin/subscription-plans/${createdKey}/features`, {
        features: featureStateToPayload(createFeatureState),
      })
      setMessage({ type: 'success', text: 'Plan created successfully.' })
      setShowCreate(false)
      setCreateDraft(createBlankPlan())
      setCreateFeatureState(createEmptyFeatureState())
      await load(createdKey)
    } catch (err) {
      setMessage({ type: 'error', text: err?.message || 'Failed to create plan.' })
    } finally {
      setSaving(false)
    }
  }

  const updateFeature = (key, nextValue) => {
    setFeatureState(current => ({
      ...current,
      [key]: {
        ...current[key],
        ...nextValue,
      },
    }))
  }

  const enabledCount = countEnabled(featureState)
  const planCount = plans.length
  const activeCount = plans.filter(plan => plan.is_active !== false).length

  if (loading) return <p className="text-slate-400 p-4">Loading...</p>

  return (
    <div className="space-y-5 md:space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-lg md:text-xl font-bold">Plans</h2>
          <p className="text-sm text-slate-400 mt-1">
            Manage feature bundles and limits for Minhal subscriptions.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => load(selectedKey)}
            className="px-4 py-2.5 rounded-lg border border-slate-600 text-sm text-slate-200 hover:bg-slate-700 transition-colors"
          >
            Refresh
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-sm font-medium transition-colors"
          >
            + New Plan
          </button>
        </div>
      </div>

      {message && (
        <p className={`text-sm rounded-lg px-4 py-3 ${
          message.type === 'error'
            ? 'text-red-400 bg-red-500/10'
            : message.type === 'success'
              ? 'text-emerald-400 bg-emerald-500/10'
              : 'text-slate-300 bg-slate-700/40'
        }`}>
          {message.text}
        </p>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Plans" value={planCount} />
        <StatCard label="Active Plans" value={activeCount} />
        <StatCard label="Enabled Features" value={enabledCount} />
        <StatCard label="Preview Mode" value={localPreview ? 'Yes' : 'No'} sub="Local fallback when APIs are missing" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[320px_minmax(0,1fr)] gap-4">
        <div className="bg-surface rounded-lg border border-slate-700 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-slate-300">Plan list</h3>
            <Badge value={selectedPlan?.key || 'none'} />
          </div>
          <div className="space-y-2">
            {plans.map(plan => {
              const selected = plan.key === selectedKey
              return (
                <button
                  key={plan.key}
                  onClick={() => handleSelect(plan)}
                  className={`w-full text-left rounded-lg border px-3 py-3 transition-colors ${
                    selected
                      ? 'border-emerald-500/50 bg-emerald-500/10'
                      : 'border-slate-700 hover:bg-surface2'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-slate-100">{plan.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{plan.key}</p>
                    </div>
                    <Badge value={plan.is_active !== false ? 'active' : 'suspended'} />
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                    <span>Rank {plan.rank ?? 0}</span>
                    <span>{countEnabled(plan.featureState)} features</span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-surface rounded-lg border border-slate-700 p-4 md:p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h3 className="text-sm font-medium text-slate-300">Plan editor</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Update plan metadata and toggle the feature bundle below.
                </p>
              </div>
              <button
                onClick={handleSavePlan}
                disabled={saving}
                className="px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-50 text-white text-sm font-medium transition-colors whitespace-nowrap"
              >
                {saving ? 'Saving...' : 'Save Plan'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Plan Key</label>
                <input
                  value={draft.key}
                  onChange={e => setDraft(current => ({ ...current, key: e.target.value }))}
                  disabled={!!selectedPlan}
                  className="w-full bg-dark border border-slate-600 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500 disabled:opacity-60"
                  placeholder="core"
                />
                <p className="text-xs text-slate-500 mt-1">The key should stay stable once it is live.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Plan Name</label>
                <input
                  value={draft.name}
                  onChange={e => setDraft(current => ({ ...current, name: e.target.value }))}
                  className="w-full bg-dark border border-slate-600 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500"
                  placeholder="Starter"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Rank</label>
                <input
                  type="number"
                  value={draft.rank}
                  onChange={e => setDraft(current => ({ ...current, rank: e.target.value }))}
                  className="w-full bg-dark border border-slate-600 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500"
                  min={0}
                />
              </div>
              <div className="flex items-center gap-2 pt-7">
                <input
                  id="plan-active"
                  type="checkbox"
                  checked={draft.is_active}
                  onChange={e => setDraft(current => ({ ...current, is_active: e.target.checked }))}
                />
                <label htmlFor="plan-active" className="text-sm text-slate-300">Active plan</label>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Description</label>
                <textarea
                  value={draft.description}
                  onChange={e => setDraft(current => ({ ...current, description: e.target.value }))}
                  rows={3}
                  className="w-full bg-dark border border-slate-600 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500 resize-y"
                  placeholder="Describe who this plan is for."
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {subscriptionSections
              .filter(section => section.key !== 'platform')
              .map(section => (
                <div key={section.key} className="bg-surface rounded-lg border border-slate-700 p-4 md:p-5">
                  <div className="flex flex-col gap-1 mb-4">
                    <h4 className="text-sm font-medium text-slate-300">{section.title}</h4>
                    <p className="text-xs text-slate-500">{section.description}</p>
                  </div>
                  <div className="divide-y divide-slate-700/80">
                    {section.features.filter(feature => feature.editable !== false).map(feature => {
                      const current = featureState[feature.key] || { enabled: false, limit_value: '' }
                      const isLimit = isLimitFeature(feature.key)
                      return (
                        <div key={feature.key} className="py-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-100">{feature.label}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{feature.description}</p>
                          </div>
                          <div className="flex items-center gap-3 flex-wrap">
                            <label className="flex items-center gap-2 text-sm text-slate-300">
                              <input
                                type="checkbox"
                                checked={!!current.enabled}
                                onChange={e => updateFeature(feature.key, { enabled: e.target.checked })}
                              />
                              Enabled
                            </label>
                            {isLimit && (
                              <input
                                type="number"
                                min={0}
                                value={current.limit_value ?? ''}
                                onChange={e => updateFeature(feature.key, { limit_value: e.target.value })}
                                placeholder="Limit"
                                className="w-28 bg-dark border border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                              />
                            )}
                            <Badge value={feature.kind} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}

            <div className="bg-surface rounded-lg border border-slate-700 p-4 md:p-5">
              <h4 className="text-sm font-medium text-slate-300 mb-2">Platform settings</h4>
              <p className="text-sm text-slate-500">
                Global platform controls such as Google Places and Twilio live in the Minhal settings area and are not editable from plan bundles.
              </p>
            </div>
          </div>
        </div>
      </div>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Plan">
        <form onSubmit={handleCreatePlan} className="space-y-4">
          <p className="text-xs text-slate-500">
            Create the plan shell first, then adjust its features from the editor after saving.
          </p>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Plan Key</label>
            <input
              value={createDraft.key}
              onChange={e => setCreateDraft(current => ({ ...current, key: e.target.value }))}
              className="w-full bg-dark border border-slate-600 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500"
              placeholder="growth"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Plan Name</label>
            <input
              value={createDraft.name}
              onChange={e => setCreateDraft(current => ({ ...current, name: e.target.value }))}
              className="w-full bg-dark border border-slate-600 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500"
              placeholder="Growth"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Rank</label>
            <input
              type="number"
              value={createDraft.rank}
              onChange={e => setCreateDraft(current => ({ ...current, rank: e.target.value }))}
              className="w-full bg-dark border border-slate-600 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500"
              min={0}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Description</label>
            <textarea
              value={createDraft.description}
              onChange={e => setCreateDraft(current => ({ ...current, description: e.target.value }))}
              rows={3}
              className="w-full bg-dark border border-slate-600 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500 resize-y"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={createDraft.is_active}
              onChange={e => setCreateDraft(current => ({ ...current, is_active: e.target.checked }))}
            />
            Active plan
          </label>

          <div className="bg-surface2 rounded-lg border border-slate-700 p-4">
            <h4 className="text-sm font-medium text-slate-300 mb-3">Initial feature bundle</h4>
            <div className="space-y-3 max-h-[36vh] overflow-y-auto pr-1">
              {subscriptionSections
                .filter(section => section.key !== 'platform')
                .flatMap(section => section.features)
                .filter(feature => feature.editable !== false)
                .map(feature => {
                  const current = createFeatureState[feature.key] || { enabled: false, limit_value: '' }
                  const isLimit = isLimitFeature(feature.key)
                  return (
                    <div key={feature.key} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <p className="text-sm text-slate-100">{feature.label}</p>
                        <p className="text-xs text-slate-500">{feature.description}</p>
                      </div>
                      <div className="flex items-center gap-3 flex-wrap">
                        <label className="flex items-center gap-2 text-sm text-slate-300">
                          <input
                            type="checkbox"
                            checked={!!current.enabled}
                            onChange={e => setCreateFeatureState(currentState => ({
                              ...currentState,
                              [feature.key]: { ...currentState[feature.key], enabled: e.target.checked },
                            }))}
                          />
                          Enabled
                        </label>
                        {isLimit && (
                          <input
                            type="number"
                            min={0}
                            value={current.limit_value ?? ''}
                            onChange={e => setCreateFeatureState(currentState => ({
                              ...currentState,
                              [feature.key]: { ...currentState[feature.key], limit_value: e.target.value },
                            }))}
                            className="w-28 bg-dark border border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                          />
                        )}
                        <Badge value={feature.kind} />
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
            >
              {saving ? 'Creating...' : 'Create Plan'}
            </button>
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="px-4 py-2.5 text-sm text-[var(--app-muted)] hover:text-[var(--app-text)] border border-slate-600 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
