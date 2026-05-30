/**
 * DataTable — consistent table wrapper with sticky header, responsive overflow, and empty state.
 *
 * Usage:
 *   <DataTable
 *     columns={[{ key: 'name', label: 'Name' }, ...]}
 *     data={rows}
 *     loading={loading}
 *     emptyTitle="No records found"
 *     emptyDescription="Try adjusting your filters."
 *     renderRow={(row) => <tr key={row.id}>...</tr>}
 *   />
 */
import { EmptyState } from './EmptyState';

export const DataTable = ({
  columns = [],
  data = [],
  loading = false,
  emptyTitle = 'No data found',
  emptyDescription = '',
  emptyIcon,
  renderRow,
  className = '',
  stickyHeader = true,
}) => {
  return (
    <div className={`bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm ${className}`}>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className={`bg-slate-50 border-b border-slate-200 ${stickyHeader ? 'sticky top-0 z-10' : ''}`}>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-5 py-3.5 text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] whitespace-nowrap ${col.className || ''}`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} aria-hidden="true">
                  {columns.map((col) => (
                    <td key={col.key} className="px-5 py-3.5">
                      <div className="h-4 bg-slate-100 rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length}>
                  <EmptyState
                    icon={emptyIcon || (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    )}
                    title={emptyTitle}
                    description={emptyDescription}
                  />
                </td>
              </tr>
            ) : (
              data.map((row, i) => renderRow(row, i))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
