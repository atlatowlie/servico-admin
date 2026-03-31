import { useState, useEffect } from 'react'
import { api } from '../utils/api'
import DataTable from '../components/DataTable'
import Badge from '../components/Badge'
import Modal from '../components/Modal'

export default function PhoneNumbers() {
  const [tenants, setTenants] = useState([])
  const [allNumbers, setAllNumbers] = useState([])
  const [showProvision, setShowProvision] = useState(false)
  const [selectedTenant, setSelectedTenant] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [country, setCountry] = useState('CA')
  const [areaCode, setAreaCode] = useState('')

  const load = async () => {
    const data = await api.get('/api/admin/tenants')
    const ts = data.tenants || []
    setTenants(ts)

    const nums = []
    for (const t of ts) {
      try {
        const detail = await api.get(`/api/admin/tenants/${t.id}`)
        ;(detail.numbers || []).forEach(n => nums.push({ ...n, tenant_name: t.name, tenant_id: t.id }))
      } catch {}
    }
    setAllNumbers(nums)
  }

  useEffect(() => { load() }, [])

  const searchNumbers = async () => {
    if (!selectedTenant) return
    setSearching(true)
    try {
      const data = await api.post(`/api/admin/tenants/${selectedTenant}/phone-numbers/search`, { country, area_code: areaCode || undefined })
      setSearchResults(data.numbers || [])
    } catch {}
    setSearching(false)
  }

  const provision = async (phoneNumber) => {
    await api.post(`/api/admin/tenants/${selectedTenant}/phone-numbers/provision`, { phone_number: phoneNumber })
    setShowProvision(false)
    setSearchResults([])
    load()
  }

  const release = async (tenantId, numberId) => {
    if (!confirm('Release this number?')) return
    await api.delete(`/api/admin/tenants/${tenantId}/phone-numbers/${numberId}`)
    load()
  }

  const columns = [
    { key: 'phone_number', label: 'Number' },
    { key: 'tenant_name', label: 'Tenant' },
    { key: 'purpose', label: 'Purpose' },
    { key: 'status', label: 'Status', render: r => <Badge value={r.status || 'active'} /> },
    { key: 'actions', label: '', render: r => (
      <button onClick={e => { e.stopPropagation(); release(r.tenant_id, r.id) }}
        className="text-xs text-red-400 hover:text-red-300 active:text-red-200 py-1 px-2">Release</button>
    )},
  ]

  const inp = 'bg-dark border border-slate-600 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30'

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-lg md:text-xl font-bold">Phone Numbers</h2>
        <button onClick={() => setShowProvision(true)} className="bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-sm px-4 py-2.5 rounded-lg transition-colors font-medium">
          + Provision Number
        </button>
      </div>

      <DataTable columns={columns} rows={allNumbers} emptyText="No numbers provisioned across tenants" />

      <Modal open={showProvision} onClose={() => { setShowProvision(false); setSearchResults([]) }} title="Provision Phone Number">
        <div className="space-y-3">
          <select className={`w-full ${inp}`} value={selectedTenant} onChange={e => setSelectedTenant(e.target.value)}>
            <option value="">Select tenant...</option>
            {tenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <div className="flex flex-col sm:flex-row gap-2">
            <select className={inp} value={country} onChange={e => setCountry(e.target.value)}>
              <option value="CA">Canada</option>
              <option value="US">USA</option>
            </select>
            <input className={`flex-1 ${inp}`} placeholder="Area code" value={areaCode} onChange={e => setAreaCode(e.target.value)} />
            <button onClick={searchNumbers} disabled={!selectedTenant || searching} className="bg-emerald-600 active:bg-emerald-700 text-white text-sm px-4 py-2.5 rounded-lg disabled:opacity-50 font-medium">
              {searching ? 'Searching...' : 'Search'}
            </button>
          </div>
          {searchResults.length > 0 && (
            <div className="max-h-60 overflow-y-auto divide-y divide-slate-700 border border-slate-700 rounded-lg">
              {searchResults.map(n => (
                <div key={n.phone_number} className="flex items-center justify-between px-3 py-3 text-sm">
                  <div className="min-w-0">
                    <span className="text-slate-200 block">{n.phone_number}</span>
                    <span className="text-slate-500 text-xs">{n.locality}, {n.region}</span>
                  </div>
                  <button onClick={() => provision(n.phone_number)} className="text-xs bg-emerald-600 active:bg-emerald-700 text-white px-3 py-1.5 rounded-lg flex-shrink-0 ml-2 font-medium">Buy</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}
