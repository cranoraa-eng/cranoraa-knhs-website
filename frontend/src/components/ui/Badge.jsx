/**
 * Badge — consistent pill/badge component.
 * variant: 'violet' | 'blue' | 'green' | 'amber' | 'red' | 'slate' | 'indigo'
 * size: 'sm' | 'md'
 */
const VARIANTS = {
  violet: 'bg-violet-100 text-violet-700 border-violet-200',
  blue:   'bg-blue-100 text-blue-700 border-blue-200',
  green:  'bg-emerald-100 text-emerald-700 border-emerald-200',
  amber:  'bg-amber-100 text-amber-700 border-amber-200',
  red:    'bg-red-100 text-red-700 border-red-200',
  slate:  'bg-slate-100 text-slate-600 border-slate-200',
  indigo: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  rose:   'bg-rose-100 text-rose-700 border-rose-200',
};

export const Badge = ({ children, variant = 'slate', size = 'sm', className = '' }) => {
  const sizeClass = size === 'md'
    ? 'px-2.5 py-1 text-xs'
    : 'px-2 py-0.5 text-[10px]';

  return (
    <span className={`inline-flex items-center gap-1 font-bold uppercase tracking-wider rounded-full border ${VARIANTS[variant] || VARIANTS.slate} ${sizeClass} ${className}`}>
      {children}
    </span>
  );
};
