export default function DataTable({ columns, rows, onRowClick, emptyText = 'No data', mobileKey }) {
  return (
    <>
      {/* Desktop table — hidden on small screens */}
      <div className="hidden sm:block bg-surface rounded-lg border border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                {columns.map(c => (
                  <th key={c.key} className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider whitespace-nowrap">
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan={columns.length} className="px-4 py-8 text-center text-slate-500">{emptyText}</td></tr>
              ) : rows.map((row, i) => (
                <tr
                  key={row.id || i}
                  onClick={() => onRowClick?.(row)}
                  className={`border-b border-slate-700/50 ${onRowClick ? 'cursor-pointer hover:bg-surface2' : ''}`}
                >
                  {columns.map(c => (
                    <td key={c.key} className="px-4 py-3 text-slate-200 whitespace-nowrap">
                      {c.render ? c.render(row) : row[c.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile card list — shown on small screens */}
      <div className="sm:hidden space-y-2">
        {rows.length === 0 ? (
          <div className="bg-surface rounded-lg border border-slate-700 px-4 py-8 text-center text-slate-500 text-sm">{emptyText}</div>
        ) : rows.map((row, i) => (
          <div
            key={row.id || i}
            onClick={() => onRowClick?.(row)}
            className={`bg-surface rounded-lg border border-slate-700 p-3.5 ${onRowClick ? 'cursor-pointer active:bg-surface2' : ''}`}
          >
            {columns.map(c => {
              if (c.key === 'actions') {
                return <div key={c.key} className="mt-2 pt-2 border-t border-slate-700/50">{c.render?.(row)}</div>
              }
              const val = c.render ? c.render(row) : row[c.key]
              if (val === undefined || val === null || val === '') return null
              return (
                <div key={c.key} className="flex items-center justify-between py-0.5">
                  <span className="text-xs text-slate-400">{c.label}</span>
                  <span className="text-sm text-slate-200">{val}</span>
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </>
  )
}
