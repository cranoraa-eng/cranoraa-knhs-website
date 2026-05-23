import { usePWAInstall } from '../hooks/usePWAInstall';

/**
 * Subtle install banner shown at the bottom of the screen
 * when the PWA install prompt is available.
 */
const PWAInstallBanner = () => {
  const { isInstallable, isInstalled, triggerInstall, dismissInstall } = usePWAInstall();

  if (!isInstallable || isInstalled) return null;

  return (
    <div
      role="complementary"
      aria-label="Install app"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 z-[9998] rounded-2xl border border-violet-200 bg-white shadow-2xl shadow-violet-900/20 overflow-hidden animate-fade-in-up"
    >
      <div className="flex items-start gap-4 p-4">
        {/* Icon */}
        <div className="h-12 w-12 flex-shrink-0 rounded-xl bg-[#1A0B2E] flex items-center justify-center shadow-lg">
          <img src="/icons/icon-192.png" alt="KNHS Portal" className="h-10 w-10 rounded-lg object-contain" />
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-900 leading-tight">Install KNHS Portal</p>
          <p className="text-xs text-slate-500 mt-0.5 leading-snug">
            Add to your home screen for faster access and offline support.
          </p>
        </div>

        {/* Dismiss */}
        <button
          onClick={dismissInstall}
          aria-label="Dismiss install prompt"
          className="flex-shrink-0 p-1 text-slate-400 hover:text-slate-600 transition-colors rounded-lg hover:bg-slate-100"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Action buttons */}
      <div className="flex border-t border-slate-100">
        <button
          onClick={dismissInstall}
          className="flex-1 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-50 transition-colors"
        >
          Not now
        </button>
        <div className="w-px bg-slate-100" />
        <button
          onClick={triggerInstall}
          className="flex-1 py-2.5 text-xs font-bold text-violet-600 hover:bg-violet-50 transition-colors"
        >
          Install App
        </button>
      </div>
    </div>
  );
};

export default PWAInstallBanner;
