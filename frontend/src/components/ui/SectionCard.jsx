/**
 * SectionCard — white card container with optional header row.
 * Usage:
 *   <SectionCard title="Recent Activity" action={<Link>View all</Link>}>
 *     ...content...
 *   </SectionCard>
 */
export const SectionCard = ({ title, subtitle, action, children, className = '', noPadding = false }) => (
  <div className={`bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden ${className}`}>
    {(title || action) && (
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-bold text-slate-900">{title}</h3>
          {subtitle && <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{subtitle}</p>}
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>
    )}
    <div className={noPadding ? '' : 'p-6'}>
      {children}
    </div>
  </div>
);
