import { useState, useEffect } from 'react'
import { api } from '../utils/api'

export default function Settings() {
  const [fromName, setFromName] = useState('Servico')
  const [fromEmail, setFromEmail] = useState('noreply@app.servicocrm.com')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testEmail, setTestEmail] = useState('')
  const [message, setMessage] = useState(null)

  useEffect(() => {
    api.get('/api/admin/settings/smtp')
      .then(data => {
        const s = data.smtp || {}
        if (s.smtp_from_name) setFromName(s.smtp_from_name)
        if (s.smtp_from) setFromEmail(s.smtp_from)
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
    if (!testEmail) {
      setMessage({ type: 'error', text: 'Enter a test email address' })
      return
    }
    setMessage(null)
    setTesting(true)
    try {
      const data = await api.post('/api/admin/settings/smtp/test', { to: testEmail })
      setMessage({ type: 'success', text: `Test email sent to ${testEmail} via ${data.provider || 'Resend'}` })
    } catch (err) {
      setMessage({ type: 'error', text: err?.message || 'Failed to send test email' })
    }
    setTesting(false)
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
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            value={testEmail}
            onChange={e => setTestEmail(e.target.value)}
            placeholder="recipient@example.com"
            className={`flex-1 ${inp}`}
          />
          <button
            onClick={handleTest}
            disabled={testing}
            className="text-sm px-5 py-2.5 rounded-lg bg-slate-700 hover:bg-slate-600 active:bg-slate-500 disabled:opacity-50 text-slate-200 transition-colors font-medium whitespace-nowrap"
          >
            {testing ? 'Sending...' : 'Send Test Email'}
          </button>
        </div>
      </div>
    </div>
  )
}
