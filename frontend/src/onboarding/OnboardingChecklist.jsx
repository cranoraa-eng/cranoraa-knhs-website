import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOnboarding } from './OnboardingContext';

const CheckIcon = memo(({ checked }) => (
  <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${checked ? 'border-emerald-200 bg-emerald-500 text-white' : 'border-slate-200 bg-white text-slate-300'}`}>
    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
    </svg>
  </span>
));
CheckIcon.displayName = 'CheckIcon';

const OnboardingChecklist = ({ compact = false }) => {
  const { checklistPercent, config, markChecklistItem, state } = useOnboarding();
  const navigate = useNavigate();

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-violet-500">Onboarding checklist</p>
            <h3 className="mt-1 text-sm font-black text-slate-900">First steps</h3>
          </div>
          <div className="text-right">
            <p className="text-lg font-black tabular-nums text-slate-900">{checklistPercent}%</p>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Complete</p>
          </div>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-violet-600 to-emerald-500 transition-[width] duration-300 ease-out"
            style={{ width: `${checklistPercent}%` }}
          />
        </div>
      </div>

      <div className={compact ? 'max-h-80 overflow-y-auto p-2' : 'p-2'}>
        {config.checklist.map((item) => {
          const checked = !!state.checklist_progress?.[item.id];
          return (
            <button
              type="button"
              key={item.id}
              onClick={() => {
                markChecklistItem(item.id);
                if (item.to) navigate(item.to);
              }}
              className="flex w-full items-start gap-3 rounded-xl p-3 text-left transition-all hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
            >
              <CheckIcon checked={checked} />
              <span className="min-w-0 flex-1">
                <span className={`block text-xs font-black ${checked ? 'text-slate-500 line-through decoration-slate-300' : 'text-slate-900'}`}>
                  {item.title}
                </span>
                {item.description && (
                  <span className="mt-1 block text-[11px] font-medium leading-relaxed text-slate-500">
                    {item.description}
                  </span>
                )}
              </span>
              <svg className="mt-1 h-4 w-4 shrink-0 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.4} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          );
        })}
        {checklistPercent === 100 && (
          <div className="m-2 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
            <p className="text-xs font-black text-emerald-700">Onboarding complete</p>
            <p className="mt-1 text-[11px] font-medium leading-5 text-emerald-700/80">
              You can replay the tour any time from the Need help button.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OnboardingChecklist;
