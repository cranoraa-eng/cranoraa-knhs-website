import { useSWUpdate } from '../hooks/useSWUpdate';

/**
 * Banner shown when a new version of the app is available.
 * Prompts the user to reload and apply the update.
 */
const SWUpdateBanner = () => {
  const { needRefresh, applyUpdate, dismissUpdate } = useSWUpdate();

  if (!needRefresh) return null;

  return (
    <div
      role="alert"
      aria-live="polite"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 z-[9997] rounded-2xl border border-indigo-200 bg-white shadow-2xl shadow-indigo-900/20 overflow-hidden animate-fade-in-up"
    >
      <div className="flex items-start gap-4 p-4">
        <div className="h-10 w-10 flex-shrink-0 rounded-xl bg-indigo-100 flex items-center justify-center">
          <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-900">Update available</p>
          <p className="text-xs text-slate-500 mt-0.5">A new version of the portal is ready.</p>
        </div>
        <button
          onClick={dismissUpdate}
          aria-label="Dismiss update"
          className="flex-shrink-0 p-1 text-slate-400 hover:text-slate-600 transition-colors rounded-lg hover:bg-slate-100"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="flex border-t border-slate-100">
        <button
          onClick={dismissUpdate}
          className="flex-1 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-50 transition-colors"
        >
          Later
        </button>
        <div className="w-px bg-slate-100" />
        <button
          onClick={applyUpdate}
          className="flex-1 py-2.5 text-xs font-bold text-indigo-600 hover:bg-indigo-50 transition-colors"
        >
          Reload & Update
        </button>
      </div>
    </div>
  );
};

export default SWUpdateBanner;
