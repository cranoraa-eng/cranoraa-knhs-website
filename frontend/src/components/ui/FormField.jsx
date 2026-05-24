/**
 * Form field components — consistent label + input + error pattern.
 *
 * FormField   — wrapper with label and error
 * FormInput   — text/email/password/number input
 * FormSelect  — select dropdown
 * FormTextarea — textarea
 */

export const FormField = ({ label, required, error, hint, children, className = '' }) => (
  <div className={`space-y-1.5 ${className}`}>
    {label && (
      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
    )}
    {children}
    {hint && !error && <p className="text-xs text-slate-400">{hint}</p>}
    {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
  </div>
);

const baseInputClass = `
  w-full px-4 py-2.5 rounded-xl border text-sm bg-white text-slate-800
  placeholder-slate-400 transition-all
  focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400
  disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed
`.trim();

export const FormInput = ({ error, className = '', ...props }) => (
  <input
    {...props}
    className={`${baseInputClass} ${error ? 'border-red-400 bg-red-50 focus:border-red-400 focus:ring-red-400/20' : 'border-slate-200'} ${className}`}
  />
);

export const FormSelect = ({ error, children, className = '', ...props }) => (
  <select
    {...props}
    className={`${baseInputClass} ${error ? 'border-red-400 bg-red-50 focus:border-red-400 focus:ring-red-400/20' : 'border-slate-200'} ${className}`}
  >
    {children}
  </select>
);

export const FormTextarea = ({ error, rows = 4, className = '', ...props }) => (
  <textarea
    {...props}
    rows={rows}
    className={`${baseInputClass} resize-none ${error ? 'border-red-400 bg-red-50 focus:border-red-400 focus:ring-red-400/20' : 'border-slate-200'} ${className}`}
  />
);
