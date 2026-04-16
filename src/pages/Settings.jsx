import { useState, useEffect } from 'react'
import { api } from '../utils/api'

export default function Settings() {
  const [fromName, setFromName] = useState('Servico')
  const [fromEmail, setFromEmail] = useState('noreply@app.servicocrm.com')
  const [googleConfig, setGoogleConfig] = useState({
    enabled: false,
    provider: 'google_places',
    account_label: '',
    project_id: '',
    autocomplete_country: '',
    api_key_set: false,
  })
  const [googleApiKey, setGoogleApiKey] = useState('')
  const [replaceGoogleKey, setReplaceGoogleKey] = useState(false)
  const [clearGoogleKey, setClearGoogleKey] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingGoogle, setSavingGoogle] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testEmail, setTestEmail] = useState('')
  const [message, setMessage] = useState(null)
  const [googleMessage, setGoogleMessage] = useState(null)

  useEffect(() => {
    Promise.all([
      api.get('/api/admin/settings/smtp'),
      api.get('/api/admin/settings/google-maps'),
    ])
      .then(([smtpData, googleData]) => {
        const s = smtpData.smtp || {}
        if (s.smtp_from_name) setFromName(s.smtp_from_name)
        if (s.smtp_from) setFromEmail(s.smtp_from)

        const next = googleData.config || {}
        setGoogleConfig({
          enabled: !!next.enabled,
          provider: next.provider || 'google_places',
          account_label: next.account_label || '',
          project_id: next.project_id || '',
          autocomplete_country: next.autocomplete_country || '',
          api_key_set: !!next.api_key_set,
        })
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async (e) => {
    e.preventDefault()
    setMessage(null)
    setSaving(true)
    try {
      await api.patch('/api/admin/settings/smtp', {
        smtp_from_name: fromName,
        smtp_from: fromEmail,
      })
      setMessage({ type: 'success', text: 'Email settings saved' })
    } catch (err) {
      setMessage({ type: 'error', text: err?.message || 'Failed to save' })
    }
    setSaving(false)
  }

  const handleTest = async () => {
    if (testing) return
    if (!testEmail) {
      setMessage({ type: 'error', text: 'Enter a test email address' })
      return
    }
    setMessage(null)
    setTesting(true)
    try {
      const data = await api.post('/api/admin/settings/smtp/test', { to: testEmail })
      setMessage({ type: 'success', text: `Test email sent to ${testEmail}` })
    } catch (err) {
      setMessage({ type: 'error', text: err?.message || 'Failed to send test email' })
    }
    // Keep disabled for 5s to prevent rapid re-sends
    setTimeout(() => setTesting(false), 5000)
  }

  const handleGoogleSave = async (e) => {
    e.preventDefault()
    setGoogleMessage(null)
    setSavingGoogle(true)
    try {
      const payload = {
        enabled: !!googleConfig.enabled,
        provider: googleConfig.provider,
        account_label: googleConfig.account_label,
        project_id: googleConfig.project_id,
        autocomplete_country: googleConfig.autocomplete_country,
      }
      if (replaceGoogleKey && googleApiKey.trim()) payload.api_key = googleApiKey.trim()
      if (clearGoogleKey) payload.clear_api_key = true

      const data = await api.patch('/api/admin/settings/google-maps', payload)
      const next = data.config || {}
      setGoogleConfig({
        enabled: !!next.enabled,
        provider: next.provider || 'google_places',
        account_label: next.account_label || '',
        project_id: next.project_id || '',
        autocomplete_country: next.autocomplete_country || '',
        api_key_set: !!next.api_key_set,
      })
      setGoogleApiKey('')
      setReplaceGoogleKey(false)
      setClearGoogleKey(false)
      setGoogleMessage({ type: 'success', text: 'Google Maps settings saved' })
    } catch (err) {
      setGoogleMessage({ type: 'error', text: err?.message || 'Failed to save Google Maps settings' })
    }
    setSavingGoogle(false)
  }

  if (loading) return <p className="text-slate-400 p-4">Loading...</p>

  const inp = 'w-full bg-dark border border-slate-600 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30'

  return (
    <div className="space-y-5 md:space-y-6">
      <h2 className="text-lg md:text-xl font-bold">Settings</h2>

      {message && (
        <p className={`text-sm rounded-lg px-4 py-3 ${
          message.type === 'success'
            ? 'text-emerald-400 bg-emerald-500/10'
            : 'text-red-400 bg-red-500/10'
        }`}>
          {message.text}
        </p>
      )}

      {/* Email Configuration */}
      <form onSubmit={handleSave}>
        <div className="bg-surface rounded-lg border border-slate-700 p-4 md:p-5">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-sm font-medium text-slate-400">Email Configuration</h3>
            <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400">Resend</span>
          </div>
          <p className="text-xs text-slate-500 mb-5">
            Emails are sent via Resend from your verified domain <span className="text-slate-300">app.servicocrm.com</span>.
            All outbound emails (quotes, invoices, notifications) use this configuration.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">From Name</label>
              <input
                className={inp}
                value={fromName}
                onChange={e => setFromName(e.target.value)}
                placeholder="Servico"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">From Email</label>
              <input
                className={inp}
                type="email"
                value={fromEmail}
                onChange={e => setFromEmail(e.target.value)}
                placeholder="noreply@app.servicocrm.com"
              />
              <p className="text-xs text-slate-500 mt-1">Must be @app.servicocrm.com (verified domain)</p>
            </div>
          </div>

          <div className="mt-5">
            <button
              type="submit"
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-400 disabled:opacity-50 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
            >
              {saving ? 'Saving...' : 'Save Email Settings'}
            </button>
          </div>
        </div>
      </form>

      {/* Test Email */}
      <div className="bg-surface rounded-lg border border-slate-700 p-4 md:p-5">
        <h3 className="text-sm font-medium text-slate-400 mb-4">Test Email</h3>
        <p className="text-xs text-slate-500 mb-4">
          Send a test email to verify delivery is working.
        </p>
        <form onSubmit={e => { e.preventDefault(); handleTest() }} className="flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            value={testEmail}
            onChange={e => setTestEmail(e.target.value)}
            placeholder="recipient@example.com"
            className={`flex-1 ${inp}`}
          />
          <button
            type="submit"
            disabled={testing}
            className="text-sm px-5 py-2.5 rounded-lg bg-slate-700 hover:bg-slate-600 active:bg-slate-500 disabled:opacity-50 text-white transition-colors font-medium whitespace-nowrap"
          >
            {testing ? 'Sending...' : 'Send Test Email'}
          </button>
        </form>
      </div>

      <form onSubmit={handleGoogleSave}>
        <div className="bg-surface rounded-lg border border-slate-700 p-4 md:p-5 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-medium text-slate-400">Google Maps / Places</h3>
              <p className="text-xs text-slate-500 mt-1">
                Global Google Cloud settings for CRM address autocomplete and place lookup.
              </p>
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-200">
              <input
                type="checkbox"
                checked={googleConfig.enabled}
                onChange={e => setGoogleConfig(current => ({ ...current, enabled: e.target.checked }))}
              />
              Enabled
            </label>
          </div>

          {googleMessage && (
            <p className={`text-sm rounded-lg px-4 py-3 ${
              googleMessage.type === 'success'
                ? 'text-emerald-400 bg-emerald-500/10'
                : 'text-red-400 bg-red-500/10'
            }`}>
              {googleMessage.text}
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Provider Mode</label>
              <select
                className={inp}
                value={googleConfig.provider}
                onChange={e => setGoogleConfig(current => ({ ...current, provider: e.target.value }))}
              >
                <option value="google_places">Places API</option>
                <option value="google_maps">Maps API</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Account / Project Label</label>
              <input
                className={inp}
                value={googleConfig.account_label}
                onChange={e => setGoogleConfig(current => ({ ...current, account_label: e.target.value }))}
                placeholder="Main Google Cloud account"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Google Cloud Project ID</label>
              <input
                className={inp}
                value={googleConfig.project_id}
                onChange={e => setGoogleConfig(current => ({ ...current, project_id: e.target.value }))}
                placeholder="my-servico-project"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Default Country Filter</label>
              <input
                className={inp}
                value={googleConfig.autocomplete_country}
                onChange={e => setGoogleConfig(current => ({ ...current, autocomplete_country: e.target.value.toUpperCase() }))}
                placeholder="US"
                maxLength={10}
              />
            </div>
          </div>

          <div className="rounded-lg border border-slate-700 p-4 space-y-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <p className="text-sm font-medium text-slate-200">API Key</p>
                <p className="text-xs text-slate-500 mt-1">
                  Current state: {googleConfig.api_key_set ? 'configured' : 'not configured'}.
                </p>
              </div>
              {googleConfig.api_key_set && !replaceGoogleKey && !clearGoogleKey && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { setReplaceGoogleKey(true); setClearGoogleKey(false) }}
                    className="px-3 py-2 rounded-lg border border-slate-600 text-sm text-slate-200 hover:bg-slate-700 transition-colors"
                  >
                    Replace Key
                  </button>
                  <button
                    type="button"
                    onClick={() => { setClearGoogleKey(true); setReplaceGoogleKey(false); setGoogleApiKey('') }}
                    className="px-3 py-2 rounded-lg border border-red-500/30 text-sm text-red-300 hover:bg-red-500/10 transition-colors"
                  >
                    Clear Key
                  </button>
                </div>
              )}
            </div>

            {(!googleConfig.api_key_set || replaceGoogleKey) && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">New API Key</label>
                <input
                  type="password"
                  className={inp}
                  value={googleApiKey}
                  onChange={e => setGoogleApiKey(e.target.value)}
                  placeholder="Paste Google Maps Platform API key"
                />
              </div>
            )}

            {clearGoogleKey && (
              <p className="text-xs text-red-400">
                Saving now will remove the stored API key.
              </p>
            )}
          </div>

          <div>
            <button
              type="submit"
              disabled={savingGoogle}
              className="bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-50 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
            >
              {savingGoogle ? 'Saving...' : 'Save Google Maps Settings'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
