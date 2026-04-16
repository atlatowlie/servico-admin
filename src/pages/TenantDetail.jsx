import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../utils/api'
import Badge from '../components/Badge'
import DataTable from '../components/DataTable'
import StatCard from '../components/StatCard'
import Modal from '../components/Modal'
import {
  createEmptyFeatureState,
  getFeatureMeta,
  isLimitFeature,
  normalizePlans,
  normalizeOverrides,
  seedPlansFromDefaults,
  subscriptionSections,
} from '../utils/subscriptionCatalog'

const editableSections = subscriptionSections.filter(section => section.key !== 'platform')
const editableFeatures = editableSections.flatMap(section => section.features.filter(feature => feature.editable !== false))

function createEmptyOverrideState() {
  return Object.fromEntries(
    editableFeatures.map(feature => [
      feature.key,
      {
        mode: 'inherit',
        limit_value: '',
      },
    ]),
  )
}

function overrideListToState(list = []) {
  const state = createEmptyOverrideState()
  normalizeOverrides(list).forEach(entry => {
    if (!state[entry.feature_key]) return
    state[entry.feature_key] = {
      mode: entry.mode || 'inherit',
      limit_value: entry.limit_value ?? '',
    }
  })
  return state
}

function overridesStateToPayload(state = {}) {
  return editableFeatures.map(feature => {
    const current = state[feature.key] || { mode: 'inherit', limit_value: '' }
    return {
      feature_key: feature.key,
      mode: current.mode || 'inherit',
      limit_value:
        current.limit_value === '' || current.limit_value == null
          ? null
          : Number.isNaN(Number(current.limit_value))
            ? current.limit_value
            : Number(current.limit_value),
      config_json: null,
    }
  })
}

function resolveFeatureState(plan, overridesState) {
  const next = createEmptyFeatureState()
  const planState = plan?.featureState || {}

  Object.entries(planState).forEach(([key, value]) => {
    if (!next[key]) return
    next[key] = {
      ...next[key],
      ...value,
    }
  })

  Object.entries(overridesState || {}).forEach(([key, value]) => {
    if (!next[key]) return
    const current = next[key]
    if (value.mode === 'enable') current.enabled = true
    if (value.mode === 'disable') current.enabled = false
    if (value.limit_value !== '' && value.limit_value != null) {
      current.limit_value = Number.isNaN(Number(value.limit_value))
        ? value.limit_value
        : Number(value.limit_value)
    }
    next[key] = current
  })

  return next
}

function countEnabled(state) {
  return Object.values(state || {}).filter(value => !!value?.enabled).length
}

function planFromList(plans, key) {
  return plans.find(plan => plan.key === key) || null
}

function normalizeTenantSubscription(data, fallbackPlanKey, fallbackPlans, source = 'preview') {
  const subscription = data?.subscription || data?.tenant_subscription || data || {}
  const plans = normalizePlans(data?.plans || data?.available_plans || fallbackPlans || [])
  const rawEntitlements = data?.entitlements || subscription.entitlements || null
  const normalizedEntitlements = Array.isArray(rawEntitlements?.features)
    ? rawEntitlements.features.reduce((acc, entry) => {
        acc[entry.feature_key || entry.key] = {
          enabled: !!entry.enabled,
          limit_value: entry.limit_value ?? entry.limit ?? '',
        }
        return acc
      }, createEmptyFeatureState())
    : rawEntitlements && typeof rawEntitlements === 'object' && !Array.isArray(rawEntitlements)
      ? rawEntitlements
      : null
  const planKey = subscription.plan_key || subscription.plan || fallbackPlanKey || plans[0]?.key || 'core'
  const plan = planFromList(plans, planKey) || planFromList(fallbackPlans, planKey) || seedPlansFromDefaults().find(p => p.key === planKey) || null
  const overrides = overrideListToState(data?.overrides || subscription.overrides || subscription.feature_overrides || [])
  const entitlements = normalizedEntitlements || resolveFeatureState(plan, overrides)

  return {
    subscription: {
      ...subscription,
      plan_key: planKey,
      status: subscription.status || 'active',
    },
    plans: plans.length > 0 ? plans : fallbackPlans,
    plan,
    overrides,
    entitlements,
    source,
  }
}

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
  const [passwordModal, setPasswordModal] = useState({ open: false, user: null })
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const [impersonating, setImpersonating] = useState(false)
  const [subscriptionLoading, setSubscriptionLoading] = useState(true)
  const [subscriptionSaving, setSubscriptionSaving] = useState(false)
  const [subscriptionMessage, setSubscriptionMessage] = useState(null)
  const [availablePlans, setAvailablePlans] = useState([])
  const [subscription, setSubscription] = useState(null)
  const [subscriptionPlanKey, setSubscriptionPlanKey] = useState('')
  const [overrideDraft, setOverrideDraft] = useState(createEmptyOverrideState())
  const [resolvedEntitlements, setResolvedEntitlements] = useState(createEmptyFeatureState())
  const [subscriptionSource, setSubscriptionSource] = useState('preview')

  const loadSubscription = async (tenantData) => {
    setSubscriptionLoading(true)
    try {
      const [plansData, subscriptionData, overridesData, entitlementsData] = await Promise.all([
        api.get('/api/admin/subscription-plans').catch(() => null),
        api.get(`/api/admin/tenants/${id}/subscription`).catch(() => null),
        api.get(`/api/admin/tenants/${id}/feature-overrides`).catch(() => null),
        api.get(`/api/admin/tenants/${id}/entitlements`).catch(() => null),
      ])
      const planList = normalizePlans(plansData?.plans || plansData?.subscription_plans || plansData || [])
      const fallbackPlans = planList.length > 0 ? planList : seedPlansFromDefaults()
      const normalized = normalizeTenantSubscription(
        {
          ...subscriptionData,
          overrides: overridesData?.overrides || [],
          entitlements: entitlementsData?.entitlements || null,
        },
        tenantData?.plan || fallbackPlans[0]?.key || 'core',
        fallbackPlans,
        'live',
      )

      setAvailablePlans(normalized.plans)
      setSubscription(normalized.subscription)
      setSubscriptionPlanKey(normalized.subscription.plan_key)
      setOverrideDraft(normalized.overrides)
      setResolvedEntitlements(normalized.entitlements)
      setSubscriptionSource(normalized.source)
    } catch {
      const fallbackPlans = seedPlansFromDefaults()
      const normalized = normalizeTenantSubscription(
        null,
        tenantData?.plan || fallbackPlans[0]?.key || 'core',
        fallbackPlans,
        'preview',
      )
      setAvailablePlans(normalized.plans)
      setSubscription(normalized.subscription)
      setSubscriptionPlanKey(normalized.subscription.plan_key)
      setOverrideDraft(normalized.overrides)
      setResolvedEntitlements(normalized.entitlements)
      setSubscriptionSource('preview')
      setSubscriptionMessage({
        type: 'info',
        text: 'Subscription APIs are not available yet. Showing local preview state.',
      })
    } finally {
      setSubscriptionLoading(false)
    }
  }

  const load = async () => {
    setLoading(true)
    try {
      const data = await api.get(`/api/admin/tenants/${id}`)
      setTenant(data.tenant)
      setUsers(data.users || [])
      setJobs(data.jobs || [])
      setCustomers(data.customers || [])
      setNumbers(data.numbers || [])
      setUsage(data.usage || [])
      await loadSubscription(data.tenant)
    } catch {
      setTenant(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [id])

  const selectedPlan = useMemo(
    () => planFromList(availablePlans, subscriptionPlanKey) || availablePlans[0] || null,
    [availablePlans, subscriptionPlanKey],
  )

  const toggleStatus = async () => {
    const newStatus = tenant.status === 'active' ? 'suspended' : 'active'
    await api.patch(`/api/admin/tenants/${id}`, { status: newStatus })
    load()
  }

  const loginAsTenant = async () => {
    setImpersonating(true)
    try {
      const data = await api.post(`/api/admin/tenants/${id}/login-as`)
      const configuredUrl = import.meta.env.VITE_SERVICO_URL?.trim()
      const origin = window.location.origin
      const derivedUrl = /minhal\./i.test(origin)
        ? origin.replace(/minhal\./i, 'app.')
        : origin.includes('servico-admin')
          ? origin.replace('servico-admin', 'servico')
          : null
      const isLocalAdmin = /localhost|127\.0\.0\.1/.test(origin)
      const localFallback = isLocalAdmin ? 'http://localhost:7211' : null
      const servicoUrl = configuredUrl || derivedUrl || localFallback || 'https://app.servicocrm.com'
      const target = new URL(`/impersonate/${data.impersonation_id}`, servicoUrl).toString()
      window.open(target, '_blank', 'noopener,noreferrer')
    } catch (err) {
      alert(err.message || 'Failed to login as tenant')
    }
    setImpersonating(false)
  }

  const openPasswordModal = (user) => {
    setPasswordModal({ open: true, user })
    setNewPassword('')
    setConfirmPassword('')
    setPasswordError('')
    setPasswordSuccess('')
  }

  const closePasswordModal = () => {
    setPasswordModal({ open: false, user: null })
    setNewPassword('')
    setConfirmPassword('')
    setPasswordError('')
    setPasswordSuccess('')
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    setPasswordError('')
    setPasswordSuccess('')

    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match')
      return
    }

    setPasswordSaving(true)
    try {
      await api.patch(`/api/admin/tenants/${id}/users/${passwordModal.user.id}/password`, {
        password: newPassword,
      })
      setPasswordSuccess('Password updated successfully')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setPasswordError(err?.message || 'Failed to update password')
    }
    setPasswordSaving(false)
  }

  const handlePlanAssign = async (nextPlanKey) => {
    const previousPlanKey = subscriptionPlanKey
    setSubscriptionPlanKey(nextPlanKey)
    setSubscriptionMessage(null)
    setSubscriptionSaving(true)

    if (subscriptionSource === 'preview') {
      const nextPlan = planFromList(availablePlans, nextPlanKey) || seedPlansFromDefaults().find(plan => plan.key === nextPlanKey) || null
      setSubscription(current => ({
        ...(current || {}),
        plan_key: nextPlanKey,
        status: current?.status || 'active',
      }))
      setResolvedEntitlements(resolveFeatureState(nextPlan, overrideDraft))
      setSubscriptionMessage({
        type: 'success',
        text: 'Plan updated in local preview mode.',
      })
      setSubscriptionSaving(false)
      return
    }

    try {
      await api.patch(`/api/admin/tenants/${id}/subscription`, { plan_key: nextPlanKey })
      await load()
      setSubscriptionMessage({ type: 'success', text: 'Subscription plan updated.' })
    } catch (err) {
      try {
        await api.patch(`/api/admin/tenants/${id}`, { plan: nextPlanKey })
        await load()
        setSubscriptionMessage({
          type: 'success',
          text: 'Plan updated using the legacy tenant plan field.',
        })
      } catch (fallbackErr) {
        setSubscriptionPlanKey(previousPlanKey)
        setSubscriptionMessage({
          type: 'error',
          text: fallbackErr?.message || err?.message || 'Failed to update plan.',
        })
      }
    }
    setSubscriptionSaving(false)
  }

  const handleSaveOverrides = async () => {
    setSubscriptionMessage(null)
    setSubscriptionSaving(true)

    if (subscriptionSource === 'preview') {
      setResolvedEntitlements(resolveFeatureState(selectedPlan, overrideDraft))
      setSubscriptionMessage({
        type: 'success',
        text: 'Tenant overrides updated in local preview mode.',
      })
      setSubscriptionSaving(false)
      return
    }

    try {
      const payload = { overrides: overridesStateToPayload(overrideDraft) }
      await api.put(`/api/admin/tenants/${id}/feature-overrides`, payload)
      await loadSubscription(tenant)
      setSubscriptionMessage({ type: 'success', text: 'Tenant overrides saved.' })
    } catch (err) {
      setSubscriptionMessage({
        type: 'error',
        text: err?.message || 'Failed to save tenant overrides.',
      })
    }
    setSubscriptionSaving(false)
  }

  const handleOverrideChange = (featureKey, next) => {
    setOverrideDraft(current => ({
      ...current,
      [featureKey]: {
        ...(current[featureKey] || { mode: 'inherit', limit_value: '' }),
        ...next,
      },
    }))
  }

  if (loading) return <p className="text-slate-400 p-4">Loading...</p>
  if (!tenant) return <p className="text-red-400 p-4">Tenant not found</p>

  const userCols = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role', render: r => <Badge value={r.role} /> },
    { key: 'created_at', label: 'Joined', render: r => new Date(r.created_at).toLocaleDateString() },
    { key: 'actions', label: '', render: r => (
      <button
        onClick={() => openPasswordModal(r)}
        className="text-xs px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 active:bg-slate-500 text-white transition-colors"
      >
        Change Password
      </button>
    )},
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

  const enabledFeatureCount = countEnabled(resolvedEntitlements)
  const activeOverrideCount = Object.values(overrideDraft).filter(value => value?.mode && value.mode !== 'inherit').length
  const resolvedPlan = selectedPlan || seedPlansFromDefaults().find(plan => plan.key === subscriptionPlanKey) || null

  return (
    <div className="space-y-5 md:space-y-6">
      <button onClick={() => navigate('/tenants')} className="text-sm text-[var(--app-muted)] hover:text-[var(--app-text)] py-1">
        &larr; Back to Tenants
      </button>

      <div className="bg-surface rounded-lg border border-slate-700 p-4 md:p-5">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <h2 className="text-lg md:text-xl font-bold">{tenant.name}</h2>
            <p className="text-sm text-slate-400 mt-1">Slug: {tenant.slug}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge value={tenant.status} />
            <Badge value={subscriptionPlanKey || tenant.plan || 'core'} />
            <Badge value={subscriptionSource} />
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
          <button
            onClick={loginAsTenant}
            disabled={impersonating || tenant.status !== 'active'}
            className="text-sm px-4 py-2 rounded-lg transition-colors font-medium bg-blue-500/15 text-blue-400 hover:bg-blue-500/25 active:bg-blue-500/30 disabled:opacity-50"
          >
            {impersonating ? 'Opening...' : 'Login as Tenant'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Users" value={users.length} />
        <StatCard label="Jobs" value={jobs.length} />
        <StatCard label="Customers" value={customers.length} />
        <StatCard label="Numbers" value={numbers.length} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[360px_minmax(0,1fr)] gap-4">
        <div className="bg-surface rounded-lg border border-slate-700 p-4 md:p-5 space-y-4">
          <div>
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-medium text-slate-400">Subscription</h3>
              {subscriptionLoading ? (
                <span className="text-xs text-slate-500">Loading...</span>
              ) : (
                <Badge value={subscription?.status || 'active'} />
              )}
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Assign the tenant plan, then manage overrides and resolved entitlements below.
            </p>
          </div>

          {subscriptionMessage && (
            <p className={`text-sm rounded-lg px-4 py-3 ${
              subscriptionMessage.type === 'success'
                ? 'text-emerald-400 bg-emerald-500/10'
                : subscriptionMessage.type === 'info'
                  ? 'text-slate-300 bg-slate-700/40'
                  : 'text-red-400 bg-red-500/10'
            }`}>
              {subscriptionMessage.text}
            </p>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Assigned Plan</label>
            <select
              value={subscriptionPlanKey}
              onChange={e => handlePlanAssign(e.target.value)}
              className="w-full bg-dark border border-slate-600 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500"
            >
              {availablePlans.map(plan => (
                <option key={plan.key} value={plan.key}>
                  {plan.name} ({plan.key})
                </option>
              ))}
            </select>
            <p className="text-xs text-slate-500 mt-2">
              Saved to the planned subscription API when available. Legacy `tenant.plan` is used as a fallback.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Enabled Features" value={enabledFeatureCount} />
            <StatCard label="Overrides" value={activeOverrideCount} />
          </div>

          <div className="rounded-lg border border-slate-700 p-4 space-y-2">
            <p className="text-sm font-medium text-slate-300">Current Plan</p>
            <p className="text-sm text-slate-100">{resolvedPlan?.name || subscriptionPlanKey || 'Core'}</p>
            <p className="text-xs text-slate-500">{resolvedPlan?.description || 'No plan metadata available.'}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-surface rounded-lg border border-slate-700 p-4 md:p-5">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <h3 className="text-sm font-medium text-slate-400">Tenant Overrides</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Toggle modules, subfeatures, and resource limits that differ from the assigned plan.
                </p>
              </div>
              <button
                onClick={handleSaveOverrides}
                disabled={subscriptionSaving}
                className="px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-50 text-white text-sm font-medium transition-colors"
              >
                {subscriptionSaving ? 'Saving...' : 'Save Overrides'}
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {editableSections.map(section => (
                <div key={section.key} className="rounded-lg border border-slate-700 bg-surface2/40 p-4">
                  <div className="mb-3">
                    <h4 className="text-sm font-medium text-slate-300">{section.title}</h4>
                    <p className="text-xs text-slate-500 mt-1">{section.description}</p>
                  </div>
                  <div className="space-y-3">
                    {section.features.map(feature => {
                      const current = overrideDraft[feature.key] || { mode: 'inherit', limit_value: '' }
                      const resolved = resolvedEntitlements[feature.key] || { enabled: false, limit_value: '' }
                      return (
                        <div key={feature.key} className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between rounded-lg border border-slate-700/70 bg-surface px-3 py-3">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-100">{feature.label}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{feature.description}</p>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <select
                              value={current.mode}
                              onChange={e => handleOverrideChange(feature.key, { mode: e.target.value })}
                              className="bg-dark border border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                            >
                              <option value="inherit">Inherit</option>
                              <option value="enable">Enable</option>
                              <option value="disable">Disable</option>
                            </select>
                            {isLimitFeature(feature.key) && (
                              <input
                                type="number"
                                min={0}
                                value={current.limit_value}
                                onChange={e => handleOverrideChange(feature.key, { limit_value: e.target.value })}
                                placeholder="Limit"
                                className="w-28 bg-dark border border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                              />
                            )}
                            <Badge value={feature.kind} />
                            <Badge value={resolved.enabled ? 'enabled' : 'disabled'} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-surface rounded-lg border border-slate-700 p-4 md:p-5">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div>
                <h3 className="text-sm font-medium text-slate-400">Resolved Entitlements</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Read-only effective feature state after plan + overrides are applied.
                </p>
              </div>
              <Badge value={subscriptionSource} />
            </div>
            <div className="space-y-4">
              {editableSections.map(section => (
                <div key={section.key}>
                  <h4 className="text-xs font-medium uppercase tracking-wide text-slate-500 mb-2">{section.title}</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
                    {section.features.map(feature => {
                      const resolved = resolvedEntitlements[feature.key] || { enabled: false, limit_value: null }
                      const meta = getFeatureMeta(feature.key)
                      return (
                        <div key={feature.key} className="rounded-lg border border-slate-700 bg-surface2/40 p-3">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm text-slate-100">{meta.label || feature.label}</p>
                            <Badge value={resolved.enabled ? 'enabled' : 'disabled'} />
                          </div>
                          <p className="text-xs text-slate-500 mt-1">{meta.description || feature.description}</p>
                          {isLimitFeature(feature.key) && (
                            <p className="text-xs text-slate-400 mt-2">
                              Limit: <span className="text-slate-200">{resolved.limit_value ?? 'none'}</span>
                            </p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div>
        <div className="flex gap-1 border-b border-slate-700 mb-4 overflow-x-auto">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-3 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                tab === t.key
                  ? 'border-emerald-400 text-emerald-400'
                  : 'border-transparent text-[var(--app-muted)] hover:text-[var(--app-text)]'
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

      <Modal open={passwordModal.open} onClose={closePasswordModal} title="Change Password">
        {passwordModal.user && (
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <p className="text-sm text-slate-400 mb-3">
                Changing password for <span className="text-slate-200 font-medium">{passwordModal.user.name}</span>
                <span className="text-slate-500 ml-1">({passwordModal.user.email})</span>
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
                minLength={8}
                className="w-full bg-dark border border-slate-600 rounded-lg px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none"
                placeholder="Minimum 8 characters"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                className="w-full bg-dark border border-slate-600 rounded-lg px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none"
                placeholder="Re-enter password"
              />
            </div>
            {passwordError && (
              <p className="text-sm text-red-400">{passwordError}</p>
            )}
            {passwordSuccess && (
              <p className="text-sm text-emerald-400">{passwordSuccess}</p>
            )}
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={passwordSaving}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-400 disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
              >
                {passwordSaving ? 'Updating...' : 'Update Password'}
              </button>
              <button
                type="button"
                onClick={closePasswordModal}
                className="px-4 py-2.5 text-sm text-[var(--app-muted)] hover:text-[var(--app-text)] border border-slate-600 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}
