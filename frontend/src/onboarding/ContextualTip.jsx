import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useOnboarding } from './OnboardingContext';

const ContextualTip = () => {
  const location = useLocation();
  const reduceMotion = useReducedMotion();
  const {
    activeTour,
    config,
    dismissTip,
    helpOpen,
    startTour,
    state,
    welcomeOpen,
  } = useOnboarding();
  const [ready, setReady] = useState(false);

  const tip = useMemo(() => {
    if (activeTour || helpOpen || welcomeOpen) return null;
    return config.tips.find((item) => (
      item.path === location.pathname &&
      !(state.dismissed_tips || []).includes(item.id)
    ));
  }, [activeTour, config.tips, helpOpen, location.pathname, state.dismissed_tips, welcomeOpen]);

  useEffect(() => {
    setReady(false);
    if (!tip) return undefined;
    const timer = setTimeout(() => setReady(true), 900);
    return () => clearTimeout(timer);
  }, [tip]);

  return (
    <AnimatePresence>
      {tip && ready && (
        <motion.aside
          className="fixed left-3 right-3 z-[60] rounded-2xl border border-violet-100 bg-white/95 p-4 shadow-2xl shadow-slate-900/10 backdrop-blur-xl sm:left-auto sm:right-5 sm:w-[360px]"
          style={{ bottom: 'calc(5.5rem + env(safe-area-inset-bottom))' }}
          initial={reduceMotion ? false : { opacity: 0, y: 18, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 12, scale: 0.98 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          role="region"
          aria-label="Contextual onboarding tip"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M13 16h-1v-4h-1m1-4h.01M12 3a9 9 0 110 18 9 9 0 010-18z" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-violet-500">Smart tip</p>
              <h3 className="mt-1 text-sm font-black leading-tight text-slate-900">{tip.title}</h3>
              <p className="mt-2 text-xs font-medium leading-5 text-slate-600">{tip.body}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => dismissTip(tip.id)}
                  className="rounded-xl bg-slate-900 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-white transition-all hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
                >
                  Got it
                </button>
                <button
                  type="button"
                  onClick={() => startTour('primary')}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500 transition-all hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                >
                  Show tour
                </button>
              </div>
            </div>
            <button
              type="button"
              onClick={() => dismissTip(tip.id)}
              className="rounded-xl p-1.5 text-slate-300 transition-all hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
              aria-label="Dismiss tip"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
};

export default ContextualTip;
