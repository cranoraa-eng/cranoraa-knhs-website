/**
 * EmptyState — professional empty/zero-data state with icon, title, description, and optional action.
 * Usage:
 *   <EmptyState
 *     icon={<svg .../>}
 *     title="No announcements yet"
 *     description="School updates and notices will appear here."
 *     action={<PrimaryButton>Create one</PrimaryButton>}
 *   />
 */
export const EmptyState = ({ icon, title, description, action, className = '' }) => (
  <div className={`flex flex-col items-center justify-center py-16 px-6 text-center ${className}`}>
    {icon && (
      <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4 text-slate-400">
        {icon}
      </div>
    )}
    <h3 className="text-base font-bold text-slate-700 mb-1">{title}</h3>
    {description && <p className="text-sm text-slate-400 max-w-xs">{description}</p>}
    {action && <div className="mt-5">{action}</div>}
  </div>
);
