import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../utils/api'
import DataTable from '../components/DataTable'
import Badge from '../components/Badge'
import Modal from '../components/Modal'
import StatCard from '../components/StatCard'

const inp = 'w-full bg-dark border border-slate-600 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30'
const btnPrimary = 'bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-sm px-4 py-2.5 rounded-lg transition-colors font-medium disabled:opacity-50'
const btnDanger = 'bg-red-500/15 text-red-400 hover:bg-red-500/25 active:bg-red-500/30 text-sm px-4 py-2.5 rounded-lg transition-colors font-medium'
const card = 'bg-surface rounded-lg border border-slate-700 p-4 md:p-5'
const label = 'block text-sm font-medium text-slate-300 mb-1.5'

function Toggle({ enabled, onChange, label: toggleLabel }) {
  return (
    <button type="button" onClick={() => onChange(!enabled)} className="flex items-center gap-3 group">
      <div className={`relative w-10 h-5 rounded-full transition-colors ${enabled ? 'bg-emerald-600' : 'bg-slate-600'}`}>
        <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${enabled ? 'translate-x-5' : ''}`} />
      </div>
      {toggleLabel && <span className="text-sm text-slate-300 group-hover:text-slate-100">{toggleLabel}</span>}
    </button>
  )
}

function CopyField({ label: fieldLabel, value }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <div>
      <label className={label}>{fieldLabel}</label>
      <div className="flex gap-2">
        <input className={inp} value={value} readOnly />
        <button type="button" onClick={copy} className="px-3 py-2 bg-surface2 hover:bg-slate-500/30 text-slate-300 text-xs rounded-lg border border-slate-600 transition-colors whitespace-nowrap">
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
    </div>
  )
}

function MaskedInput({ value, onChange, placeholder }) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="flex gap-2">
      <input
        className={`flex-1 ${inp}`}
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
      />
      <button type="button" onClick={() => setVisible(!visible)} className="px-3 py-2 bg-surface2 hover:bg-slate-500/30 text-slate-400 text-xs rounded-lg border border-slate-600 transition-colors">
        {visible ? 'Hide' : 'Show'}
      </button>
    </div>
  )
}

/* ─── Tab: Account ─── */
function AccountTab() {
  const [status, setStatus] = useState(null)
  const [creds, setCreds] = useState({ account_sid: '', auth_token: '', api_key_sid: '', api_key_secret: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [msg, setMsg] = useState(null)

  useEffect(() => {
    (async () => {
      try {
        const [statusData, credsData] = await Promise.all([
          api.get('/api/admin/twilio/status').catch(() => null),
          api.get('/api/admin/twilio/credentials').catch(() => null),
        ])
        if (statusData) setStatus(statusData)
        if (credsData?.credentials) setCreds(c => ({ ...c, ...credsData.credentials }))
      } catch {}
      setLoading(false)
    })()
  }, [])

  const save = async () => {
    setSaving(true)
    setMsg(null)
    try {
      await api.post('/api/admin/twilio/credentials', creds)
      setMsg({ type: 'success', text: 'Credentials saved successfully' })
    } catch (e) {
      setMsg({ type: 'error', text: 'Failed to save credentials' })
    }
    setSaving(false)
  }

  const testConnection = async () => {
    setTesting(true)
    setMsg(null)
    try {
      const res = await api.post('/api/admin/twilio/test-connection')
      setMsg({ type: res.connected ? 'success' : 'error', text: res.message || (res.connected ? 'Connection successful' : 'Connection failed') })
      if (res.connected) setStatus(s => ({ ...s, connected: true, account_name: res.account_name }))
    } catch {
      setMsg({ type: 'error', text: 'Connection test failed' })
    }
    setTesting(false)
  }

  if (loading) return <p className="text-slate-400 text-sm">Loading...</p>

  return (
    <div className="space-y-5">
      {/* Connection Status */}
      <div className={card}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-200">Connection Status</h3>
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${status?.connected ? 'bg-emerald-400' : 'bg-red-400'}`} />
            <span className={`text-sm ${status?.connected ? 'text-emerald-400' : 'text-red-400'}`}>
              {status?.connected ? 'Connected' : 'Not Connected'}
            </span>
          </div>
        </div>
        {status?.account_name && <p className="text-sm text-slate-400">Account: {status.account_name}</p>}
        {status?.last_verified && <p className="text-xs text-slate-500 mt-1">Last verified: {new Date(status.last_verified).toLocaleString()}</p>}
      </div>

      {msg && (
        <div className={`text-sm px-4 py-3 rounded-lg ${msg.type === 'success' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
          {msg.text}
        </div>
      )}

      {/* Credentials */}
      <div className={card}>
        <h3 className="text-sm font-semibold text-slate-200 mb-4">Twilio Credentials</h3>
        <div className="space-y-4">
          <div>
            <label className={label}>Account SID</label>
            <MaskedInput value={creds.account_sid} onChange={v => setCreds({ ...creds, account_sid: v })} placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" />
          </div>
          <div>
            <label className={label}>Auth Token</label>
            <MaskedInput value={creds.auth_token} onChange={v => setCreds({ ...creds, auth_token: v })} placeholder="Your auth token" />
          </div>
          <div>
            <label className={label}>API Key SID</label>
            <MaskedInput value={creds.api_key_sid} onChange={v => setCreds({ ...creds, api_key_sid: v })} placeholder="SKxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" />
          </div>
          <div>
            <label className={label}>API Key Secret</label>
            <MaskedInput value={creds.api_key_secret} onChange={v => setCreds({ ...creds, api_key_secret: v })} placeholder="Your API key secret" />
          </div>
        </div>
        <div className="flex flex-wrap gap-3 mt-5">
          <button onClick={save} disabled={saving} className={btnPrimary}>{saving ? 'Saving...' : 'Save Credentials'}</button>
          <button onClick={testConnection} disabled={testing} className="bg-slate-600 hover:bg-slate-500 active:bg-slate-700 text-white text-sm px-4 py-2.5 rounded-lg transition-colors font-medium disabled:opacity-50">
            {testing ? 'Testing...' : 'Test Connection'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Tab: Messaging ─── */
function MessagingTab() {
  const [config, setConfig] = useState({ messaging_service_sid: '', auto_opt_out: true, opt_out_keywords: 'STOP, UNSUBSCRIBE', compliance_message: 'You have been unsubscribed. Reply START to resubscribe.' })
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState(null)
  const [showTemplate, setShowTemplate] = useState(false)
  const [editTemplate, setEditTemplate] = useState(null)
  const [tplForm, setTplForm] = useState({ name: '', category: 'reminder', body: '' })

  const webhookBase = window.location.origin.replace('admin', 'api')

  useEffect(() => {
    (async () => {
      try {
        const data = await api.get('/api/admin/twilio/messaging-config')
        if (data.config) setConfig(c => ({ ...c, ...data.config }))
        if (data.templates) setTemplates(data.templates)
      } catch {}
      setLoading(false)
    })()
  }, [])

  const saveConfig = async () => {
    setSaving(true)
    setMsg(null)
    try {
      await api.patch('/api/admin/twilio/messaging-config', config)
      setMsg({ type: 'success', text: 'Messaging settings saved' })
    } catch {
      setMsg({ type: 'error', text: 'Failed to save settings' })
    }
    setSaving(false)
  }

  const openCreate = () => {
    setEditTemplate(null)
    setTplForm({ name: '', category: 'reminder', body: '' })
    setShowTemplate(true)
  }

  const openEdit = (tpl) => {
    setEditTemplate(tpl)
    setTplForm({ name: tpl.name, category: tpl.category, body: tpl.body })
    setShowTemplate(true)
  }

  const saveTemplate = async (e) => {
    e.preventDefault()
    try {
      if (editTemplate) {
        await api.patch(`/api/admin/twilio/sms-templates/${editTemplate.id}`, tplForm)
      } else {
        await api.post('/api/admin/twilio/sms-templates', tplForm)
      }
      const data = await api.get('/api/admin/twilio/messaging-config')
      if (data.templates) setTemplates(data.templates)
      setShowTemplate(false)
    } catch {}
  }

  const deleteTemplate = async (id) => {
    if (!confirm('Delete this template?')) return
    try {
      await api.delete(`/api/admin/twilio/sms-templates/${id}`)
      setTemplates(t => t.filter(x => x.id !== id))
    } catch {}
  }

  const tplCols = [
    { key: 'name', label: 'Name' },
    { key: 'category', label: 'Category', render: r => <Badge value={r.category} /> },
    { key: 'body', label: 'Body', render: r => <span className="text-slate-400 text-xs line-clamp-1">{r.body}</span> },
    { key: 'actions', label: '', render: r => (
      <div className="flex gap-2">
        <button onClick={e => { e.stopPropagation(); openEdit(r) }} className="text-xs text-emerald-400 hover:text-emerald-300 py-1 px-2">Edit</button>
        <button onClick={e => { e.stopPropagation(); deleteTemplate(r.id) }} className="text-xs text-red-400 hover:text-red-300 py-1 px-2">Delete</button>
      </div>
    )},
  ]

  if (loading) return <p className="text-slate-400 text-sm">Loading...</p>

  return (
    <div className="space-y-5">
      {msg && (
        <div className={`text-sm px-4 py-3 rounded-lg ${msg.type === 'success' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
          {msg.text}
        </div>
      )}

      {/* General Settings */}
      <div className={card}>
        <h3 className="text-sm font-semibold text-slate-200 mb-4">General Settings</h3>
        <div className="space-y-4">
          <div>
            <label className={label}>Messaging Service SID</label>
            <input className={inp} value={config.messaging_service_sid} onChange={e => setConfig({ ...config, messaging_service_sid: e.target.value })} placeholder="MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" />
          </div>
          <CopyField label="Inbound SMS Webhook" value={`${webhookBase}/webhooks/twilio/sms/inbound`} />
          <CopyField label="Status Callback URL" value={`${webhookBase}/webhooks/twilio/sms/status`} />
        </div>
      </div>

      {/* Compliance */}
      <div className={card}>
        <h3 className="text-sm font-semibold text-slate-200 mb-4">Opt-out & Compliance</h3>
        <div className="space-y-4">
          <Toggle enabled={config.auto_opt_out} onChange={v => setConfig({ ...config, auto_opt_out: v })} label="Automatic opt-out handling" />
          <div>
            <label className={label}>Opt-out Keywords</label>
            <input className={inp} value={config.opt_out_keywords} onChange={e => setConfig({ ...config, opt_out_keywords: e.target.value })} placeholder="STOP, UNSUBSCRIBE, CANCEL" />
            <p className="text-xs text-slate-500 mt-1">Comma-separated keywords that trigger opt-out</p>
          </div>
          <div>
            <label className={label}>Compliance Response Message</label>
            <textarea className={`${inp} resize-none`} rows={2} value={config.compliance_message} onChange={e => setConfig({ ...config, compliance_message: e.target.value })} />
          </div>
        </div>
      </div>

      <button onClick={saveConfig} disabled={saving} className={btnPrimary}>{saving ? 'Saving...' : 'Save Messaging Settings'}</button>

      {/* SMS Templates */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-200">SMS Templates</h3>
          <button onClick={openCreate} className={btnPrimary}>+ Add Template</button>
        </div>
        <DataTable columns={tplCols} rows={templates} emptyText="No SMS templates configured" />
      </div>

      <Modal open={showTemplate} onClose={() => setShowTemplate(false)} title={editTemplate ? 'Edit Template' : 'Create Template'}>
        <form onSubmit={saveTemplate} className="space-y-3">
          <input className={inp} required placeholder="Template name" value={tplForm.name} onChange={e => setTplForm({ ...tplForm, name: e.target.value })} />
          <select className={inp} value={tplForm.category} onChange={e => setTplForm({ ...tplForm, category: e.target.value })}>
            <option value="reminder">Appointment Reminder</option>
            <option value="confirmation">Booking Confirmation</option>
            <option value="update">Job Update</option>
            <option value="followup">Follow-up</option>
            <option value="marketing">Marketing</option>
            <option value="other">Other</option>
          </select>
          <div>
            <textarea className={`${inp} resize-none`} rows={4} required placeholder="Message body... Use {{customer_name}}, {{job_date}}, {{tech_name}} for variables" value={tplForm.body} onChange={e => setTplForm({ ...tplForm, body: e.target.value })} />
            <p className="text-xs text-slate-500 mt-1">Variables: {'{{customer_name}}'}, {'{{job_date}}'}, {'{{job_time}}'}, {'{{tech_name}}'}, {'{{company_name}}'}</p>
          </div>
          <div className="flex gap-3 pt-1">
            <button type="submit" className={btnPrimary}>{editTemplate ? 'Update' : 'Create'}</button>
            <button type="button" onClick={() => setShowTemplate(false)} className="text-sm text-slate-400 hover:text-slate-200 px-4 py-2.5">Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

/* ─── Tab: Voice ─── */
function VoiceTab() {
  const [config, setConfig] = useState({
    twiml_app_sid: '',
    voice_type: 'Polly.Joanna',
    language: 'en-US',
    recording_enabled: false,
    recording_channels: 'mono',
    recording_auto_delete_days: 90,
    voicemail_enabled: true,
    voicemail_greeting: '',
    voicemail_transcription: true,
    voicemail_max_length: 120,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState(null)

  const webhookBase = window.location.origin.replace('admin', 'api')

  useEffect(() => {
    (async () => {
      try {
        const data = await api.get('/api/admin/twilio/voice-config')
        if (data.config) setConfig(c => ({ ...c, ...data.config }))
      } catch {}
      setLoading(false)
    })()
  }, [])

  const save = async () => {
    setSaving(true)
    setMsg(null)
    try {
      await api.patch('/api/admin/twilio/voice-config', config)
      setMsg({ type: 'success', text: 'Voice settings saved' })
    } catch {
      setMsg({ type: 'error', text: 'Failed to save settings' })
    }
    setSaving(false)
  }

  if (loading) return <p className="text-slate-400 text-sm">Loading...</p>

  return (
    <div className="space-y-5">
      {msg && (
        <div className={`text-sm px-4 py-3 rounded-lg ${msg.type === 'success' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
          {msg.text}
        </div>
      )}

      {/* TwiML App */}
      <div className={card}>
        <h3 className="text-sm font-semibold text-slate-200 mb-4">TwiML Application</h3>
        <div className="space-y-4">
          <div>
            <label className={label}>TwiML App SID</label>
            <input className={inp} value={config.twiml_app_sid} onChange={e => setConfig({ ...config, twiml_app_sid: e.target.value })} placeholder="APxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" />
          </div>
          <CopyField label="Voice Webhook URL" value={`${webhookBase}/webhooks/twilio/voice/inbound`} />
          <CopyField label="Status Callback URL" value={`${webhookBase}/webhooks/twilio/voice/status`} />
        </div>
      </div>

      {/* Default Voice Settings */}
      <div className={card}>
        <h3 className="text-sm font-semibold text-slate-200 mb-4">Default Voice Settings</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={label}>Voice</label>
            <select className={inp} value={config.voice_type} onChange={e => setConfig({ ...config, voice_type: e.target.value })}>
              <optgroup label="Amazon Polly">
                <option value="Polly.Joanna">Polly Joanna (Female, EN-US)</option>
                <option value="Polly.Matthew">Polly Matthew (Male, EN-US)</option>
                <option value="Polly.Amy">Polly Amy (Female, EN-GB)</option>
                <option value="Polly.Brian">Polly Brian (Male, EN-GB)</option>
                <option value="Polly.Conchita">Polly Conchita (Female, ES)</option>
                <option value="Polly.Celine">Polly Celine (Female, FR)</option>
              </optgroup>
              <optgroup label="Basic">
                <option value="man">Man</option>
                <option value="woman">Woman</option>
              </optgroup>
            </select>
          </div>
          <div>
            <label className={label}>Language</label>
            <select className={inp} value={config.language} onChange={e => setConfig({ ...config, language: e.target.value })}>
              <option value="en-US">English (US)</option>
              <option value="en-GB">English (UK)</option>
              <option value="es-ES">Spanish</option>
              <option value="fr-FR">French</option>
              <option value="he-IL">Hebrew</option>
              <option value="ar-SA">Arabic</option>
            </select>
          </div>
        </div>
      </div>

      {/* Call Recording */}
      <div className={card}>
        <h3 className="text-sm font-semibold text-slate-200 mb-4">Call Recording</h3>
        <div className="space-y-4">
          <Toggle enabled={config.recording_enabled} onChange={v => setConfig({ ...config, recording_enabled: v })} label="Enable call recording" />
          {config.recording_enabled && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-1">
              <div>
                <label className={label}>Channels</label>
                <select className={inp} value={config.recording_channels} onChange={e => setConfig({ ...config, recording_channels: e.target.value })}>
                  <option value="mono">Mono (single track)</option>
                  <option value="dual">Dual (separate tracks)</option>
                </select>
              </div>
              <div>
                <label className={label}>Auto-delete after (days)</label>
                <input className={inp} type="number" min="0" value={config.recording_auto_delete_days} onChange={e => setConfig({ ...config, recording_auto_delete_days: parseInt(e.target.value) || 0 })} />
                <p className="text-xs text-slate-500 mt-1">Set 0 to keep forever</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Voicemail */}
      <div className={card}>
        <h3 className="text-sm font-semibold text-slate-200 mb-4">Voicemail</h3>
        <div className="space-y-4">
          <Toggle enabled={config.voicemail_enabled} onChange={v => setConfig({ ...config, voicemail_enabled: v })} label="Enable voicemail" />
          {config.voicemail_enabled && (
            <div className="space-y-4 pl-1">
              <div>
                <label className={label}>Greeting Message</label>
                <textarea className={`${inp} resize-none`} rows={2} value={config.voicemail_greeting} onChange={e => setConfig({ ...config, voicemail_greeting: e.target.value })} placeholder="Please leave a message after the tone..." />
              </div>
              <Toggle enabled={config.voicemail_transcription} onChange={v => setConfig({ ...config, voicemail_transcription: v })} label="Enable transcription" />
              <div>
                <label className={label}>Max Recording Length (seconds)</label>
                <input className={inp} type="number" min="10" max="600" value={config.voicemail_max_length} onChange={e => setConfig({ ...config, voicemail_max_length: parseInt(e.target.value) || 120 })} />
              </div>
            </div>
          )}
        </div>
      </div>

      <button onClick={save} disabled={saving} className={btnPrimary}>{saving ? 'Saving...' : 'Save Voice Settings'}</button>
    </div>
  )
}

/* ─── Tab: Numbers ─── */
function NumbersTab() {
  const navigate = useNavigate()
  const [numbers, setNumbers] = useState([])
  const [stats, setStats] = useState({ total: 0, active: 0, ca: 0, us: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      try {
        const data = await api.get('/api/admin/twilio/numbers-overview')
        setNumbers(data.numbers || [])
        setStats(data.stats || stats)
      } catch {
        // Fallback: load from existing tenants endpoint
        try {
          const data = await api.get('/api/admin/tenants')
          const ts = data.tenants || []
          const nums = []
          for (const t of ts) {
            try {
              const detail = await api.get(`/api/admin/tenants/${t.id}`)
              ;(detail.numbers || []).forEach(n => nums.push({ ...n, tenant_name: t.name, tenant_id: t.id }))
            } catch {}
          }
          setNumbers(nums)
          const active = nums.filter(n => (n.status || 'active') === 'active').length
          setStats({ total: nums.length, active, ca: nums.filter(n => n.phone_number?.startsWith('+1') && n.country === 'CA').length, us: nums.filter(n => n.phone_number?.startsWith('+1') && n.country !== 'CA').length })
        } catch {}
      }
      setLoading(false)
    })()
  }, [])

  const columns = [
    { key: 'phone_number', label: 'Number' },
    { key: 'tenant_name', label: 'Tenant' },
    { key: 'purpose', label: 'Purpose' },
    { key: 'capabilities', label: 'Type', render: r => <span className="text-xs text-slate-400">{r.capabilities || 'Voice + SMS'}</span> },
    { key: 'status', label: 'Status', render: r => <Badge value={r.status || 'active'} /> },
  ]

  if (loading) return <p className="text-slate-400 text-sm">Loading...</p>

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total Numbers" value={stats.total} />
        <StatCard label="Active" value={stats.active} />
        <StatCard label="Canada" value={stats.ca} />
        <StatCard label="USA" value={stats.us} />
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-200">All Numbers</h3>
        <button onClick={() => navigate('/phone-numbers')} className={btnPrimary}>Manage Numbers</button>
      </div>

      <DataTable columns={columns} rows={numbers} emptyText="No phone numbers provisioned" />
    </div>
  )
}

/* ─── Tab: Usage ─── */
function UsageTab() {
  const [usage, setUsage] = useState(null)
  const [tenantUsage, setTenantUsage] = useState([])
  const [alerts, setAlerts] = useState({ budget_threshold: 500, alert_email: '', alerts_enabled: false })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState(null)

  useEffect(() => {
    (async () => {
      try {
        const data = await api.get('/api/admin/twilio/usage')
        if (data.summary) setUsage(data.summary)
        if (data.by_tenant) setTenantUsage(data.by_tenant)
        if (data.alerts) setAlerts(a => ({ ...a, ...data.alerts }))
      } catch {}
      setLoading(false)
    })()
  }, [])

  const saveAlerts = async () => {
    setSaving(true)
    setMsg(null)
    try {
      await api.patch('/api/admin/twilio/usage-alerts', alerts)
      setMsg({ type: 'success', text: 'Alert settings saved' })
    } catch {
      setMsg({ type: 'error', text: 'Failed to save alerts' })
    }
    setSaving(false)
  }

  const tenantCols = [
    { key: 'tenant_name', label: 'Tenant' },
    { key: 'calls', label: 'Calls', render: r => r.calls ?? 0 },
    { key: 'sms', label: 'SMS', render: r => r.sms ?? 0 },
    { key: 'numbers', label: 'Numbers', render: r => r.numbers ?? 0 },
    { key: 'total_cost', label: 'Cost', render: r => <span className="font-medium">${((r.total_cost ?? 0) / 100).toFixed(2)}</span> },
  ]

  if (loading) return <p className="text-slate-400 text-sm">Loading...</p>

  return (
    <div className="space-y-5">
      {msg && (
        <div className={`text-sm px-4 py-3 rounded-lg ${msg.type === 'success' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
          {msg.text}
        </div>
      )}

      {/* Current Period Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total Calls" value={usage?.total_calls ?? '—'} subtitle={usage?.calls_cost != null ? `$${(usage.calls_cost / 100).toFixed(2)}` : undefined} />
        <StatCard label="Total SMS" value={usage?.total_sms ?? '—'} subtitle={usage?.sms_cost != null ? `$${(usage.sms_cost / 100).toFixed(2)}` : undefined} />
        <StatCard label="Active Numbers" value={usage?.active_numbers ?? '—'} subtitle={usage?.numbers_cost != null ? `$${(usage.numbers_cost / 100).toFixed(2)}/mo` : undefined} />
        <StatCard label="Total Cost" value={usage?.total_cost != null ? `$${(usage.total_cost / 100).toFixed(2)}` : '—'} subtitle="This month" />
      </div>

      {/* Per-tenant breakdown */}
      <div>
        <h3 className="text-sm font-semibold text-slate-200 mb-3">Usage by Tenant</h3>
        <DataTable columns={tenantCols} rows={tenantUsage} emptyText="No usage data available" />
      </div>

      {/* Alerts */}
      <div className={card}>
        <h3 className="text-sm font-semibold text-slate-200 mb-4">Budget Alerts</h3>
        <div className="space-y-4">
          <Toggle enabled={alerts.alerts_enabled} onChange={v => setAlerts({ ...alerts, alerts_enabled: v })} label="Enable budget alerts" />
          {alerts.alerts_enabled && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-1">
              <div>
                <label className={label}>Monthly Budget Threshold ($)</label>
                <input className={inp} type="number" min="0" step="50" value={alerts.budget_threshold} onChange={e => setAlerts({ ...alerts, budget_threshold: parseInt(e.target.value) || 0 })} />
              </div>
              <div>
                <label className={label}>Alert Email</label>
                <input className={inp} type="email" value={alerts.alert_email} onChange={e => setAlerts({ ...alerts, alert_email: e.target.value })} placeholder="admin@company.com" />
              </div>
            </div>
          )}
        </div>
        <div className="mt-4">
          <button onClick={saveAlerts} disabled={saving} className={btnPrimary}>{saving ? 'Saving...' : 'Save Alert Settings'}</button>
        </div>
      </div>
    </div>
  )
}

/* ─── Main Page ─── */
export default function TwilioSettings() {
  const [tab, setTab] = useState('account')

  const tabs = [
    { key: 'account', label: 'Account' },
    { key: 'messaging', label: 'Messaging' },
    { key: 'voice', label: 'Voice' },
    { key: 'numbers', label: 'Numbers' },
    { key: 'usage', label: 'Usage' },
  ]

  return (
    <div className="space-y-5 md:space-y-6">
      <div>
        <h2 className="text-lg md:text-xl font-bold">Twilio Settings</h2>
        <p className="text-sm text-slate-400 mt-1">Manage telephony infrastructure for calls and SMS</p>
      </div>

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
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'account' && <AccountTab />}
      {tab === 'messaging' && <MessagingTab />}
      {tab === 'voice' && <VoiceTab />}
      {tab === 'numbers' && <NumbersTab />}
      {tab === 'usage' && <UsageTab />}
    </div>
  )
}
