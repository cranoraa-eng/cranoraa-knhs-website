/**
 * PageHeader — consistent page-level header with title, subtitle, and optional actions.
 * Usage:
 *   <PageHeader
 *     title="Announcements"
 *     subtitle="School news, updates, and notices"
 *     actions={<PrimaryButton onClick={openCreate}>+ New</PrimaryButton>}
 *   />
 */
export const PageHeader = ({ title, subtitle, actions, className = '' }) => (
  <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 ${className}`}>
    <div>
      <h1 className="text-2xl font-black text-slate-900 tracking-tight">{title}</h1>
      {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
    </div>
    {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
  </div>
);
