export default function DataTable({ columns, data, children, onRowClick }) {
  return (
    <div className="overflow-hidden rounded-[2rem] border border-slate-800 bg-slate-900/95 shadow-lg shadow-slate-950/20">
      <div className="overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-0 text-left text-sm text-slate-300">
          <thead className="bg-slate-950/95 text-slate-400">
            <tr>
              {columns.map((column) => (
                <th key={column.key} className="px-4 sm:px-5 py-3 sm:py-4 font-semibold uppercase tracking-[0.2em] text-xs whitespace-nowrap">{column.header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data?.length > 0 ? (
              data.map((item, index) => (
                <tr
                  key={item.id || index}
                  className={`border-t border-slate-800 hover:bg-slate-950/80 ${onRowClick ? 'cursor-pointer' : ''}`}
                  onClick={() => onRowClick && onRowClick(item)}
                >
                  {columns.map((column) => (
                    <td key={column.key} className="px-4 sm:px-5 py-3 sm:py-4 align-top whitespace-nowrap">
                      {column.render ? column.render(item) : item[column.key] ?? '-'}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-5 py-10 text-center text-slate-500">
                  Aucune donnée disponible.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {children}
    </div>
  )
}
