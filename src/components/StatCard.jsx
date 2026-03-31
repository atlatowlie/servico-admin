export default function StatCard({ label, value, sub }) {
  return (
    <div className="bg-surface rounded-lg border border-slate-700 p-4 md:p-5">
      <p className="text-xs md:text-sm text-slate-400 mb-1">{label}</p>
      <p className="text-xl md:text-2xl font-bold text-slate-100">{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
    </div>
  )
}
