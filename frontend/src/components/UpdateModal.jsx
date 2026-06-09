import { useState, useEffect } from 'react';
import { useSWUpdate } from '../hooks/useSWUpdate';

/**
 * Professional PWA update modal.
 *
 * Appears as a centered overlay when a new service worker version is waiting.
 * The user can apply the update immediately or defer it.
 *
 * States:
 *   idle      → shows "New update available" with Refresh / Later buttons
 *   updating  → shows spinner + "Applying update…" while SW activates
 */
const UpdateModal = () => {
  const { needRefresh, applyUpdate, dismissUpdate } = useSWUpdate();
  const [visible, setVisible] = useState(false);
  const [updating, setUpdating] = useState(false);

  // Show immediately — no delay
  useEffect(() => {
    if (needRefresh) {
      setVisible(true);
    } else {
      setVisible(false);
      setUpdating(false);
    }
  }, [needRefresh]);

  const handleRefresh = () => {
    setUpdating(true);
    setTimeout(() => {
      applyUpdate();
      // Hard reload fallback — if the SW skipWaiting + reload doesn't fire
      // within 4 seconds (e.g. blocked by another SW), force a full navigation.
      setTimeout(() => {
        window.location.href = window.location.href;
      }, 4000);
    }, 400);
  };

  const handleLater = () => {
    setVisible(false);
    setTimeout(() => dismissUpdate(), 200);
  };

  if (!needRefresh) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden="true"
        className={`fixed inset-0 z-[9998] bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 ${
          visible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={!updating ? handleLater : undefined}
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="update-modal-title"
        aria-describedby="update-modal-desc"
        className={`fixed inset-x-4 bottom-6 sm:inset-auto sm:bottom-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 z-[9999] w-auto sm:w-[420px] transition-all duration-300 ${
          visible
            ? 'opacity-100 translate-y-0 scale-100'
            : 'opacity-0 translate-y-4 scale-95'
        }`}
      >
        <div className="rounded-2xl bg-white shadow-2xl shadow-slate-900/25 overflow-hidden border border-slate-200/80">

          {/* Header stripe */}
          <div className="h-1 w-full bg-violet-600" />

          <div className="p-6">
            {updating ? (
              /* ── Updating state ── */
              <div className="flex flex-col items-center gap-4 py-2">
                {/* Spinning ring */}
                <div className="relative h-14 w-14">
                  <div className="absolute inset-0 rounded-full border-4 border-violet-100" />
                  <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-violet-600 animate-spin" />
                  <div className="absolute inset-2 rounded-full bg-violet-50 flex items-center justify-center">
                    <svg className="w-5 h-5 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-slate-900">Applying update…</p>
                  <p className="text-xs text-slate-500 mt-1">The page will reload in a moment.</p>
                </div>
              </div>
            ) : (
              /* ── Idle state ── */
              <>
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="flex-shrink-0 h-11 w-11 rounded-xl bg-violet-600 flex items-center justify-center shadow-sm">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0 pt-0.5">
                    <h2
                      id="update-modal-title"
                      className="text-base font-bold text-slate-900 leading-tight"
                    >
                      New update available
                    </h2>
                    <p
                      id="update-modal-desc"
                      className="text-sm text-slate-500 mt-1 leading-relaxed"
                    >
                      A new version of the portal is ready. Refresh to get the latest features and fixes.
                    </p>
                  </div>
                </div>

                {/* What's new pill */}
                <div className="mt-4 flex items-center gap-2 rounded-xl bg-violet-50 border border-violet-100 px-3.5 py-2.5">
                  <svg className="w-3.5 h-3.5 text-violet-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <p className="text-xs font-semibold text-violet-700">
                    Your current session and data will be preserved.
                  </p>
                </div>

                {/* Action buttons */}
                <div className="mt-5 flex items-center gap-3">
                  <button
                    onClick={handleLater}
                    className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 active:scale-95 transition-all duration-150"
                  >
                    Later
                  </button>
                  <button
                    onClick={handleRefresh}
                    className="flex-1 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-violet-700 active:scale-95 transition-all duration-150 flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh Now
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default UpdateModal;
