const sections = [
  {
    key: 'core-crm',
    title: 'Core CRM',
    description: 'Base customer, job, quote, invoice, and address management modules.',
    features: [
      { key: 'module.crm', label: 'CRM Core', description: 'Base CRM navigation and tenant data model.', kind: 'module' },
      { key: 'module.clients', label: 'Clients', description: 'Client records, contacts, and profiles.', kind: 'module' },
      { key: 'module.jobs', label: 'Jobs', description: 'Job tracking, scheduling, and workflows.', kind: 'module' },
      { key: 'module.quotes', label: 'Quotes', description: 'Quote creation and approvals.', kind: 'module' },
      { key: 'module.invoices', label: 'Invoices', description: 'Invoice creation, sending, and follow-up.', kind: 'module' },
      { key: 'module.payments', label: 'Payments', description: 'Payment collection and reconciliation.', kind: 'module' },
      { key: 'module.calendar', label: 'Calendar', description: 'Shared calendar and scheduling views.', kind: 'module' },
      { key: 'module.documents', label: 'Documents', description: 'Templates, instances, and document generation.', kind: 'module' },
      { key: 'module.contractors', label: 'Contractors', description: 'Contractor records and onboarding workflows.', kind: 'module' },
      { key: 'feature.multi_address', label: 'Multi Address', description: 'Support multiple addresses per client or account.', kind: 'feature' },
      { key: 'feature.google_places', label: 'Google Places', description: 'Address autocomplete and place lookup.', kind: 'feature' },
    ],
  },
  {
    key: 'growth',
    title: 'Growth',
    description: 'Sales and onboarding features for teams that need more automation.',
    features: [
      { key: 'module.esign', label: 'E-Sign', description: 'Signature requests and signing workflows.', kind: 'module' },
      { key: 'module.sms', label: 'SMS', description: 'Messaging workflows and notifications.', kind: 'module' },
      { key: 'feature.contractor_onboarding_contracts', label: 'Contractor Onboarding', description: 'Contract template gating and activation holds.', kind: 'feature' },
      { key: 'feature.advanced_permissions', label: 'Advanced Permissions', description: 'Richer role and access control tooling.', kind: 'feature' },
      { key: 'feature.document_workflows', label: 'Document Workflows', description: 'Automated document routing and states.', kind: 'feature' },
      { key: 'feature.workflow_automation_basic', label: 'Workflow Automation', description: 'Basic automation and routing rules.', kind: 'feature' },
    ],
  },
  {
    key: 'pro',
    title: 'Pro',
    description: 'Advanced operations, API access, and reporting.',
    features: [
      { key: 'module.softphone', label: 'Softphone', description: 'Calling and telephony widget.', kind: 'module' },
      { key: 'module.pos', label: 'POS', description: 'Point of sale and payment capture.', kind: 'module' },
      { key: 'module.reports_advanced', label: 'Advanced Reports', description: 'Detailed dashboards and financial reporting.', kind: 'module' },
      { key: 'feature.api_access', label: 'API Access', description: 'Tenant API access and tokens.', kind: 'feature' },
      { key: 'feature.webhooks', label: 'Webhooks', description: 'Outbound webhook delivery.', kind: 'feature' },
      { key: 'feature.audit_logs', label: 'Audit Logs', description: 'Longer retention and admin audit trails.', kind: 'feature' },
      { key: 'feature.workflow_automation_advanced', label: 'Advanced Automation', description: 'Advanced workflow rules and branching.', kind: 'feature' },
    ],
  },
  {
    key: 'packs',
    title: 'Packs and Limits',
    description: 'Vertical packs and resource ceilings that can be attached to plans.',
    features: [
      { key: 'pack.construction', label: 'Construction Pack', description: 'Vertical construction workflow bundle.', kind: 'pack' },
      { key: 'construction.change_orders', label: 'Change Orders', description: 'Construction change order workflows.', kind: 'feature' },
      { key: 'construction.job_costing', label: 'Job Costing', description: 'Cost tracking and margins for jobs.', kind: 'feature' },
      { key: 'construction.project_management', label: 'Project Management', description: 'Project planning and task tracking.', kind: 'feature' },
      { key: 'construction.subcontractor_workflows', label: 'Subcontractor Workflows', description: 'Construction subcontractor coordination.', kind: 'feature' },
      { key: 'construction.progress_billing', label: 'Progress Billing', description: 'Progress-based invoicing and billing.', kind: 'feature' },
      { key: 'construction.bid_workflows', label: 'Bid Workflows', description: 'Construction bid and tender routing.', kind: 'feature' },
      { key: 'pack.home_services', label: 'Home Services Pack', description: 'Vertical bundle for home service businesses.', kind: 'pack' },
      { key: 'home.dispatch', label: 'Dispatch', description: 'Dispatch queue and routing.', kind: 'feature' },
      { key: 'home.service_plans', label: 'Service Plans', description: 'Recurring plan handling for home services.', kind: 'feature' },
      { key: 'home.on_my_way', label: 'On My Way', description: 'Technician arrival notifications.', kind: 'feature' },
      { key: 'home.call_booking', label: 'Call Booking', description: 'Phone call capture and booking flows.', kind: 'feature' },
      { key: 'home.pricebook', label: 'Pricebook', description: 'Product and service pricing catalogs.', kind: 'feature' },
      { key: 'limit.users', label: 'User Limit', description: 'Maximum number of active users.', kind: 'limit', limitType: 'number' },
      { key: 'limit.phone_numbers', label: 'Phone Number Limit', description: 'Maximum provisioned phone numbers.', kind: 'limit', limitType: 'number' },
      { key: 'limit.sms_monthly', label: 'SMS Monthly Limit', description: 'Monthly SMS allocation.', kind: 'limit', limitType: 'number' },
      { key: 'limit.document_templates', label: 'Template Limit', description: 'Maximum active document templates.', kind: 'limit', limitType: 'number' },
      { key: 'limit.storage_gb', label: 'Storage Limit', description: 'File storage allowance in gigabytes.', kind: 'limit', limitType: 'number' },
    ],
  },
  {
    key: 'platform',
    title: 'Platform Controls',
    description: 'Global settings managed in Minhal, not via tenant subscriptions.',
    features: [
      { key: 'platform.google_places_config', label: 'Google Places Config', description: 'Global Google Cloud API settings.', kind: 'platform', editable: false },
      { key: 'platform.twilio_config', label: 'Twilio Config', description: 'Global telephony provider settings.', kind: 'platform', editable: false },
      { key: 'platform.email_provider_config', label: 'Email Provider Config', description: 'Global email routing settings.', kind: 'platform', editable: false },
      { key: 'platform.storage', label: 'Storage', description: 'Shared storage and file delivery.', kind: 'platform', editable: false },
      { key: 'platform.billing', label: 'Billing', description: 'Billing provider and tenant charging.', kind: 'platform', editable: false },
      { key: 'platform.feature_flags', label: 'Feature Flags', description: 'Global rollout and flag tooling.', kind: 'platform', editable: false },
    ],
  },
]

const flatFeatures = sections.flatMap(section => section.features)

const featureIndex = Object.fromEntries(flatFeatures.map(feature => [feature.key, feature]))

export const subscriptionSections = sections
export const subscriptionFeatures = flatFeatures

export const defaultPlanSeeds = [
  {
    key: 'core',
    name: 'Core',
    description: 'Core CRM with Google Places and multi-address enabled.',
    rank: 10,
    is_active: true,
    features: {
      'module.crm': { enabled: true },
      'module.clients': { enabled: true },
      'module.jobs': { enabled: true },
      'module.quotes': { enabled: true },
      'module.invoices': { enabled: true },
      'module.payments': { enabled: true },
      'module.calendar': { enabled: true },
      'module.documents': { enabled: true },
      'module.contractors': { enabled: true },
      'feature.multi_address': { enabled: true },
      'feature.google_places': { enabled: true },
      'limit.users': { enabled: true, limit_value: 5 },
      'limit.phone_numbers': { enabled: true, limit_value: 1 },
      'limit.sms_monthly': { enabled: true, limit_value: 0 },
      'limit.document_templates': { enabled: true, limit_value: 10 },
      'limit.storage_gb': { enabled: true, limit_value: 5 },
    },
  },
  {
    key: 'growth',
    name: 'Growth',
    description: 'Adds e-sign, SMS, and contractor onboarding contracts.',
    rank: 20,
    is_active: true,
    features: {
      'module.crm': { enabled: true },
      'module.clients': { enabled: true },
      'module.jobs': { enabled: true },
      'module.quotes': { enabled: true },
      'module.invoices': { enabled: true },
      'module.payments': { enabled: true },
      'module.calendar': { enabled: true },
      'module.documents': { enabled: true },
      'module.contractors': { enabled: true },
      'feature.multi_address': { enabled: true },
      'feature.google_places': { enabled: true },
      'module.esign': { enabled: true },
      'module.sms': { enabled: true },
      'feature.contractor_onboarding_contracts': { enabled: true },
      'feature.advanced_permissions': { enabled: true },
      'feature.document_workflows': { enabled: true },
      'feature.workflow_automation_basic': { enabled: true },
      'limit.users': { enabled: true, limit_value: 15 },
      'limit.phone_numbers': { enabled: true, limit_value: 5 },
      'limit.sms_monthly': { enabled: true, limit_value: 500 },
      'limit.document_templates': { enabled: true, limit_value: 40 },
      'limit.storage_gb': { enabled: true, limit_value: 25 },
    },
  },
  {
    key: 'pro',
    name: 'Pro',
    description: 'Advanced reporting, softphone, POS, APIs, and webhooks.',
    rank: 30,
    is_active: true,
    features: {
      'module.crm': { enabled: true },
      'module.clients': { enabled: true },
      'module.jobs': { enabled: true },
      'module.quotes': { enabled: true },
      'module.invoices': { enabled: true },
      'module.payments': { enabled: true },
      'module.calendar': { enabled: true },
      'module.documents': { enabled: true },
      'module.contractors': { enabled: true },
      'feature.multi_address': { enabled: true },
      'feature.google_places': { enabled: true },
      'module.esign': { enabled: true },
      'module.sms': { enabled: true },
      'feature.contractor_onboarding_contracts': { enabled: true },
      'feature.advanced_permissions': { enabled: true },
      'feature.document_workflows': { enabled: true },
      'feature.workflow_automation_basic': { enabled: true },
      'module.softphone': { enabled: true },
      'module.pos': { enabled: true },
      'module.reports_advanced': { enabled: true },
      'feature.api_access': { enabled: true },
      'feature.webhooks': { enabled: true },
      'feature.audit_logs': { enabled: true },
      'feature.workflow_automation_advanced': { enabled: true },
      'pack.construction': { enabled: true },
      'pack.home_services': { enabled: true },
      'limit.users': { enabled: true, limit_value: 50 },
      'limit.phone_numbers': { enabled: true, limit_value: 20 },
      'limit.sms_monthly': { enabled: true, limit_value: 5000 },
      'limit.document_templates': { enabled: true, limit_value: 100 },
      'limit.storage_gb': { enabled: true, limit_value: 100 },
    },
  },
]

export function getFeatureMeta(key) {
  return featureIndex[key] || {
    key,
    label: key,
    description: '',
    kind: 'feature',
    editable: true,
  }
}

export function isLimitFeature(key) {
  return key.startsWith('limit.')
}

export function createEmptyFeatureState() {
  const state = {}
  subscriptionFeatures.forEach(feature => {
    if (feature.editable === false) return
    state[feature.key] = {
      enabled: false,
      limit_value: isLimitFeature(feature.key) ? '' : null,
      config_json: null,
    }
  })
  return state
}

export function normalizeFeatureState(entries = [], base = createEmptyFeatureState()) {
  const next = { ...base }
  if (Array.isArray(entries)) {
    entries.forEach(entry => {
      const key = entry.feature_key || entry.key
      if (!key || !next[key]) return
      next[key] = {
        enabled: !!entry.enabled,
        limit_value: entry.limit_value ?? entry.limit ?? (isLimitFeature(key) ? '' : null),
        config_json: entry.config_json ?? null,
      }
    })
    return next
  }

  if (entries && typeof entries === 'object') {
    Object.entries(entries).forEach(([key, value]) => {
      if (!key || !next[key]) return
      if (value && typeof value === 'object') {
        next[key] = {
          enabled: !!value.enabled,
          limit_value: value.limit_value ?? value.limit ?? (isLimitFeature(key) ? '' : null),
          config_json: value.config_json ?? null,
        }
      } else {
        next[key] = {
          enabled: !!value,
          limit_value: isLimitFeature(key) ? '' : null,
          config_json: null,
        }
      }
    })
  }

  return next
}

export function featureStateToPayload(state = {}) {
  return Object.entries(state)
    .filter(([key]) => !!getFeatureMeta(key).editable !== false)
    .map(([feature_key, value]) => ({
      feature_key,
      enabled: !!value?.enabled,
      limit_value:
        value?.limit_value === '' || value?.limit_value == null
          ? null
          : Number.isNaN(Number(value.limit_value))
            ? value.limit_value
            : Number(value.limit_value),
      config_json: value?.config_json ?? null,
    }))
}

export function normalizePlans(source = []) {
  const list = Array.isArray(source) ? source : []
  return list.map(item => ({
    ...item,
    key: item.key || item.plan_key || item.id,
    name: item.name || item.label || item.key || item.plan_key || item.id,
    description: item.description || '',
    rank: Number(item.rank ?? item.sort_order ?? 0),
    is_active: item.is_active !== false,
    featureState: normalizeFeatureState(item.features || item.plan_features || item.entitlements || item.feature_state || []),
  }))
}

export function seedPlansFromDefaults() {
  return defaultPlanSeeds.map(plan => ({
    ...plan,
    featureState: normalizeFeatureState(plan.features),
  }))
}

export function normalizeOverrides(entries = []) {
  if (!Array.isArray(entries)) return []
  return entries
    .map(entry => ({
      feature_key: entry.feature_key || entry.key || '',
      mode: entry.mode || (entry.enabled === true ? 'enable' : entry.enabled === false ? 'disable' : 'inherit'),
      limit_value: entry.limit_value ?? entry.limit ?? '',
      config_json: entry.config_json ?? null,
    }))
    .filter(entry => entry.feature_key)
}
