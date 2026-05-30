/**
 * Reusable skeleton loading components.
 * Use these while data is loading to prevent layout shift.
 */

// Base shimmer block
export const SkeletonBlock = ({ className = '' }) => (
  <div
    className={`animate-pulse rounded-lg bg-slate-200 ${className}`}
    aria-hidden="true"
  />
);

// Card skeleton (dashboard stats, etc.)
export const SkeletonCard = () => (
  <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3" aria-hidden="true">
    <div className="flex items-center justify-between">
      <SkeletonBlock className="h-4 w-24" />
      <SkeletonBlock className="h-8 w-8 rounded-xl" />
    </div>
    <SkeletonBlock className="h-8 w-16" />
    <SkeletonBlock className="h-3 w-32" />
  </div>
);

// Table row skeleton
export const SkeletonTableRow = ({ cols = 4 }) => (
  <tr aria-hidden="true">
    {Array.from({ length: cols }).map((_, i) => (
      <td key={i} className="px-4 py-3">
        <SkeletonBlock className="h-4 w-full" />
      </td>
    ))}
  </tr>
);

// Table skeleton
export const SkeletonTable = ({ rows = 5, cols = 4 }) => (
  <div className="rounded-xl border border-slate-200 bg-white overflow-hidden" aria-hidden="true">
    <div className="bg-slate-50 px-4 py-3 flex gap-4">
      {Array.from({ length: cols }).map((_, i) => (
        <SkeletonBlock key={i} className="h-3 flex-1" />
      ))}
    </div>
    <table className="w-full">
      <tbody>
        {Array.from({ length: rows }).map((_, i) => (
          <SkeletonTableRow key={i} cols={cols} />
        ))}
      </tbody>
    </table>
  </div>
);

// Announcement card skeleton
export const SkeletonAnnouncement = () => (
  <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3" aria-hidden="true">
    <div className="flex items-center gap-3">
      <SkeletonBlock className="h-10 w-10 rounded-xl flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <SkeletonBlock className="h-4 w-3/4" />
        <SkeletonBlock className="h-3 w-1/3" />
      </div>
    </div>
    <SkeletonBlock className="h-3 w-full" />
    <SkeletonBlock className="h-3 w-5/6" />
    <SkeletonBlock className="h-3 w-2/3" />
  </div>
);

// Message list item skeleton
export const SkeletonMessage = () => (
  <div className="flex items-center gap-3 px-4 py-3" aria-hidden="true">
    <SkeletonBlock className="h-11 w-11 rounded-xl flex-shrink-0" />
    <div className="flex-1 space-y-2">
      <div className="flex justify-between">
        <SkeletonBlock className="h-3.5 w-28" />
        <SkeletonBlock className="h-3 w-10" />
      </div>
      <SkeletonBlock className="h-3 w-48" />
    </div>
  </div>
);

// Dashboard stats grid skeleton
export const SkeletonDashboard = () => (
  <div className="space-y-6" aria-hidden="true">
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <SkeletonBlock className="h-64 rounded-2xl" />
      <SkeletonBlock className="h-64 rounded-2xl" />
    </div>
  </div>
);

// Profile skeleton
export const SkeletonProfile = () => (
  <div className="space-y-6" aria-hidden="true">
    <div className="flex items-center gap-5">
      <SkeletonBlock className="h-20 w-20 rounded-2xl flex-shrink-0" />
      <div className="space-y-2 flex-1">
        <SkeletonBlock className="h-6 w-48" />
        <SkeletonBlock className="h-4 w-32" />
        <SkeletonBlock className="h-4 w-24" />
      </div>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="space-y-1.5">
          <SkeletonBlock className="h-3 w-20" />
          <SkeletonBlock className="h-10 w-full rounded-lg" />
        </div>
      ))}
    </div>
  </div>
);
