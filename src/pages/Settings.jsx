import { useState, useEffect } from 'react'
import { api } from '../utils/api'

const SMTP_FIELDS = [
  { key: 'smtp_host', label: 'SMTP Host', type: 'text', placeholder: 'smtp.gmail.com' },
  { key: 'smtp_port', label: 'SMTP Port', type: 'number', placeholder: '587' },
  { key: 'smtp_user', label: 'SMTP Username', type: 'text', placeholder: 'you@example.com' },
  { key: 'smtp_pass', label: 'SMTP Password', type: 'password', placeholder: '••••••••' },
  { key: 'smtp_from_email', label: 'From Email', type: 'email', placeholder: 'noreply@yourcompany.com' },
  { key: 'smtp_from_name', label: 'From Name', type: 'text', placeholder: 'Servico' },
]

const ENCRYPTION_OPTIONS = [
  { value: 'tls', label: 'TLS (recommended)' },
  { value: 'ssl', label: 'SSL' },
  { value: 'none', label: 'None' },
]

export default function Settings() {
  const [smtp, setSmtp] = useState({
    smtp_host: '',
    smtp_port: '587',
    smtp_user: '',
    smtp_pass: '',
    smtp_from_email: '',
    smtp_from_name: '',
    smtp_encryption: 'tls',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testEmail, setTestEmail] = useState('')
  const [message, setMessage] = useState(null)
  const [hasExistingPassword, setHasExistingPassword] = useState(false)

  useEffect(() => {
    api.get('/api/admin/settings/smtp')
      .then(data => {
        const s = data.smtp || {}
        setSmtp(prev => ({
          ...prev,
          smtp_host: s.smtp_host || '',
          smtp_port: s.smtp_port || '587',
          smtp_user: s.smtp_user || '',
          smtp_pass: '',
          smtp_from_email: s.smtp_from_email || '',
          smtp_from_name: s.smtp_from_name || '',
          smtp_encryption: s.smtp_encryption || 'tls',
        }))
        setHasExistingPassword(!!s.smtp_pass_set)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleChange = (key, value) => {
    setSmtp(prev => ({ ...prev, [key]: value }))
    if (key === 'smtp_pass') setHasExistingPassword(false)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setMessage(null)
    setSaving(true)
    try {
      const payload = { ...smtp }
      if (!payload.smtp_pass && hasExistingPassword) {
        delete payload.smtp_pass
      }
      await api.patch('/api/admin/settings/smtp', payload)
      setMessage({ type: 'success', text: 'SMTP settings saved successfully' })
      setHasExistingPassword(!!smtp.smtp_pass || hasExistingPassword)
      setSmtp(prev => ({ ...prev, smtp_pass: '' }))
    } catch (err) {
      setMessage({ type: 'error', text: err?.message || 'Failed to save settings' })
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
      await api.post('/api/admin/settings/smtp/test', { to: testEmail })
      setMessage({ type: 'success', text: `Test email sent to ${testEmail}` })
    } catch (err) {
      setMessage({ type: 'error', text: err?.message || 'Failed to send test email' })
    }
    setTesting(false)
  }

  if (loading) return <p className="text-slate-400 p-4">Loading...</p>

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

      {/* SMTP Configuration */}
      <form onSubmit={handleSave}>
        <div className="bg-surface rounded-lg border border-slate-700 p-4 md:p-5">
          <h3 className="text-sm font-medium text-slate-400 mb-4">SMTP Email Configuration</h3>
          <p className="text-xs text-slate-500 mb-5">
            Configure SMTP settings used system-wide for sending emails across all tenants.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {SMTP_FIELDS.map(f => (
              <div key={f.key}>
                <label className="block text-sm font-medium text-slate-300 mb-1">{f.label}</label>
                <input
                  type={f.type}
                  value={smtp[f.key]}
                  onChange={e => handleChange(f.key, e.target.value)}
                  placeholder={f.key === 'smtp_pass' && hasExistingPassword ? '(unchanged)' : f.placeholder}
                  className="w-full bg-dark border border-slate-600 rounded-lg px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none placeholder:text-slate-600"
                />
              </div>
            ))}

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Encryption</label>
              <select
                value={smtp.smtp_encryption}
                onChange={e => handleChange('smtp_encryption', e.target.value)}
                className="w-full bg-dark border border-slate-600 rounded-lg px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none"
              >
                {ENCRYPTION_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-5">
            <button
              type="submit"
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-400 disabled:opacity-50 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
            >
              {saving ? 'Saving...' : 'Save SMTP Settings'}
            </button>
          </div>
        </div>
      </form>

      {/* Test Email */}
      <div className="bg-surface rounded-lg border border-slate-700 p-4 md:p-5">
        <h3 className="text-sm font-medium text-slate-400 mb-4">Test Email</h3>
        <p className="text-xs text-slate-500 mb-4">
          Send a test email to verify your SMTP configuration is working correctly.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            value={testEmail}
            onChange={e => setTestEmail(e.target.value)}
            placeholder="recipient@example.com"
            className="flex-1 bg-dark border border-slate-600 rounded-lg px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none placeholder:text-slate-600"
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
