export default function DataTable({ columns, rows, onRowClick, emptyText = 'No data' }) {
  return (
    <div className="bg-surface rounded-lg border border-slate-700 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-700">
            {columns.map(c => (
              <th key={c.key} className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">
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
                <td key={c.key} className="px-4 py-3 text-slate-200">
                  {c.render ? c.render(row) : row[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
