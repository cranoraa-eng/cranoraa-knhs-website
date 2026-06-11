/**
 * LoadingStates — inline loading placeholders for tables and cards.
 */

export const LoadingRow = ({ cols = 4 }) => (
  <tr aria-hidden="true">
    {Array.from({ length: cols }).map((_, i) => (
      <td key={i} className="px-5 py-3.5">
        <div className="h-4 bg-slate-100 rounded animate-pulse" />
      </td>
    ))}
  </tr>
);

export const LoadingCard = ({ className = '' }) => (
  <div className={`bg-white border border-slate-200 rounded-2xl p-5 space-y-3 animate-pulse ${className}`} aria-hidden="true">
    <div className="flex items-center justify-between">
      <div className="h-4 w-24 bg-slate-200 rounded" />
      <div className="h-8 w-8 bg-slate-200 rounded-xl" />
    </div>
    <div className="h-8 w-16 bg-slate-200 rounded" />
    <div className="h-3 w-32 bg-slate-200 rounded" />
  </div>
);
