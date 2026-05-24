/**
 * Button components — consistent button system for the portal.
 *
 * PrimaryButton   — violet filled (main CTA)
 * SecondaryButton — white/outlined (secondary action)
 * DangerButton    — red filled (destructive)
 * GhostButton     — transparent (subtle action)
 * ActionButton    — icon-only or icon+text utility button
 */

export const PrimaryButton = ({ children, onClick, disabled, type = 'button', className = '', size = 'md' }) => {
  const sizeClass = size === 'sm'
    ? 'px-3 py-1.5 text-xs'
    : size === 'lg'
    ? 'px-8 py-3.5 text-sm'
    : 'px-5 py-2.5 text-sm';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 font-bold rounded-xl bg-violet-600 text-white hover:bg-violet-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm ${sizeClass} ${className}`}
    >
      {children}
    </button>
  );
};

export const SecondaryButton = ({ children, onClick, disabled, type = 'button', className = '', size = 'md' }) => {
  const sizeClass = size === 'sm'
    ? 'px-3 py-1.5 text-xs'
    : size === 'lg'
    ? 'px-8 py-3.5 text-sm'
    : 'px-5 py-2.5 text-sm';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 font-bold rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${sizeClass} ${className}`}
    >
      {children}
    </button>
  );
};

export const DangerButton = ({ children, onClick, disabled, type = 'button', className = '', size = 'md' }) => {
  const sizeClass = size === 'sm'
    ? 'px-3 py-1.5 text-xs'
    : size === 'lg'
    ? 'px-8 py-3.5 text-sm'
    : 'px-5 py-2.5 text-sm';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 font-bold rounded-xl bg-red-500 text-white hover:bg-red-600 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${sizeClass} ${className}`}
    >
      {children}
    </button>
  );
};

export const GhostButton = ({ children, onClick, disabled, type = 'button', className = '', size = 'md' }) => {
  const sizeClass = size === 'sm'
    ? 'px-3 py-1.5 text-xs'
    : size === 'lg'
    ? 'px-8 py-3.5 text-sm'
    : 'px-5 py-2.5 text-sm';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 font-medium rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-800 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${sizeClass} ${className}`}
    >
      {children}
    </button>
  );
};

/**
 * ActionButton — small icon button for table rows / card actions.
 * variant: 'default' | 'violet' | 'blue' | 'green' | 'amber' | 'red'
 */
const ACTION_VARIANTS = {
  default: 'text-slate-400 hover:bg-slate-100 hover:text-slate-600',
  violet:  'text-violet-500 hover:bg-violet-50 hover:text-violet-700',
  blue:    'text-blue-500 hover:bg-blue-50 hover:text-blue-700',
  green:   'text-emerald-500 hover:bg-emerald-50 hover:text-emerald-700',
  amber:   'text-amber-500 hover:bg-amber-50 hover:text-amber-700',
  red:     'text-red-500 hover:bg-red-50 hover:text-red-700',
};

export const ActionButton = ({ children, onClick, title, variant = 'default', className = '' }) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    className={`p-2 rounded-lg transition-all active:scale-90 ${ACTION_VARIANTS[variant] || ACTION_VARIANTS.default} ${className}`}
  >
    {children}
  </button>
);
