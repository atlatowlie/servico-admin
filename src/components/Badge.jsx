const colors = {
  active: 'bg-emerald-500/15 text-emerald-400',
  suspended: 'bg-red-500/15 text-red-400',
  cancelled: 'bg-slate-500/15 text-slate-400',
  starter: 'bg-blue-500/15 text-blue-400',
  pro: 'bg-purple-500/15 text-purple-400',
  enterprise: 'bg-amber-500/15 text-amber-400',
}

export default function Badge({ value }) {
  const cls = colors[value] || 'bg-slate-500/15 text-slate-300'
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium capitalize ${cls}`}>
      {value}
    </span>
  )
}
