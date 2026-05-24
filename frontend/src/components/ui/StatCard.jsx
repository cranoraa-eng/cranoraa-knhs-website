/**
 * StatCard — reusable dashboard stat card.
 * Matches the existing Dashboard.jsx StatCard but extracted for reuse.
 */
const THEMES = {
  violet: 'text-violet-600 bg-violet-50 border-violet-100 group-hover:bg-violet-600 group-hover:text-white',
  blue:   'text-blue-600 bg-blue-50 border-blue-100 group-hover:bg-blue-600 group-hover:text-white',
  emerald:'text-emerald-600 bg-emerald-50 border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white',
  rose:   'text-rose-600 bg-rose-50 border-rose-100 group-hover:bg-rose-600 group-hover:text-white',
  amber:  'text-amber-600 bg-amber-50 border-amber-100 group-hover:bg-amber-600 group-hover:text-white',
  indigo: 'text-indigo-600 bg-indigo-50 border-indigo-100 group-hover:bg-indigo-600 group-hover:text-white',
  slate:  'text-slate-600 bg-slate-50 border-slate-100 group-hover:bg-slate-600 group-hover:text-white',
};

export const StatCard = ({ label, value, sub, icon, color = 'violet', onClick, badge }) => (
  <div
    onClick={onClick}
    className={`group bg-white border border-slate-200 rounded-2xl p-4 md:p-6 transition-all duration-300 hover:border-transparent hover:shadow-xl hover:shadow-slate-200/50 ${onClick ? 'cursor-pointer' : ''}`}
  >
    <div className="flex items-start justify-between">
      <div className="space-y-4 w-full">
        <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${THEMES[color] || THEMES.violet}`}>
          {icon}
        </div>
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1">{label}</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight group-hover:text-violet-600 transition-colors">
              {value ?? '—'}
            </h3>
            {badge > 0 && (
              <span className="px-1.5 py-0.5 rounded-md bg-rose-100 text-rose-600 text-[10px] font-black">
                {badge} New
              </span>
            )}
          </div>
          {sub && <p className="text-xs font-bold text-slate-400 mt-1">{sub}</p>}
        </div>
      </div>
    </div>
  </div>
);
