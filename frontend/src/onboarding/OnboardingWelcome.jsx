import { memo, useEffect, useRef } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useOnboarding } from './OnboardingContext';
import OnboardingChecklist from './OnboardingChecklist';

const FEATURES = [
  { label: 'Guided tour', body: 'Step-by-step walkthrough of each menu item.' },
  { label: 'Smart tips', body: 'Page-specific hints that appear when useful.' },
  { label: 'Help center', body: 'Search guides, replay tours, reset onboarding.' },
];

const OnboardingWelcome = () => {
  const { user } = useAuth();
  const {
    config,
    setWelcomeSeen,
    startTour,
    welcomeOpen,
  } = useOnboarding();
  const reduceMotion = useReducedMotion();
  const modalRef = useRef(null);

  useEffect(() => {
    if (!welcomeOpen) return;
    const previous = document.activeElement;
    modalRef.current?.focus();

    const onKeyDown = (event) => {
      if (event.key === 'Escape') setWelcomeSeen(true);
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      previous?.focus?.();
    };
  }, [setWelcomeSeen, welcomeOpen]);

  return (
    <AnimatePresence>
      {welcomeOpen && (
        <motion.div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/55 px-3 py-6 backdrop-blur-sm"
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduceMotion ? { opacity: 1 } : { opacity: 0 }}
        >
          <motion.div
            ref={modalRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-labelledby="onboarding-welcome-title"
            className="grid max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-3xl border border-white/60 bg-white shadow-2xl outline-none lg:grid-cols-[1fr_390px]"
            initial={reduceMotion ? false : { y: 22, scale: 0.98, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={reduceMotion ? { opacity: 1 } : { y: 16, scale: 0.98, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            <div className="relative overflow-hidden bg-[#161128] p-6 text-white sm:p-8">
              <div className="absolute inset-0 opacity-40" aria-hidden="true">
                <div className="absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-violet-400/25 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 h-44 bg-[radial-gradient(circle_at_25%_80%,rgba(16,185,129,0.26),transparent_32%),radial-gradient(circle_at_75%_70%,rgba(59,130,246,0.24),transparent_30%)]" />
              </div>

              <div className="relative z-10 flex h-full min-h-[430px] flex-col">
                <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.22em] text-violet-100">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  First-time guide
                </div>

                <div className="mt-10 max-w-xl">
                  <p className="text-sm font-bold text-violet-200">
                    Hi {user?.first_name || 'there'},
                  </p>
                  <h2 id="onboarding-welcome-title" className="mt-3 text-3xl font-black leading-tight tracking-tight text-white sm:text-5xl">
                    {config.welcomeTitle}
                  </h2>
                  <p className="mt-5 max-w-lg text-sm font-medium leading-7 text-slate-200">
                    {config.welcomeBody}
                  </p>
                </div>

                <div className="mt-auto grid gap-3 pt-10 sm:grid-cols-3">
                  {FEATURES.map((item) => (
                    <div key={item.label} className="rounded-2xl border border-white/10 bg-white/[0.08] p-4">
                      <p className="text-xs font-black text-white">{item.label}</p>
                      <p className="mt-2 text-[11px] font-medium leading-relaxed text-slate-300">{item.body}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex max-h-[92vh] flex-col overflow-y-auto bg-slate-50 p-4 sm:p-5">
              <OnboardingChecklist compact />
              <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Recommended</p>
                <p className="mt-1 text-sm font-black text-slate-900">Take the 2-minute tour</p>
                <p className="mt-2 text-xs font-medium leading-6 text-slate-500">
                  Takes about 2 minutes. You can replay anytime from <strong className="text-slate-700">Need help</strong> → <strong className="text-slate-700">Tour</strong>.
                </p>
                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => startTour('primary')}
                    className="inline-flex flex-1 items-center justify-center rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-violet-200 transition-all hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
                  >
                    Start tour
                  </button>
                  <button
                    type="button"
                    onClick={() => setWelcomeSeen(true)}
                    className="inline-flex flex-1 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-black uppercase tracking-widest text-slate-500 transition-all hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
                  >
                    Maybe later
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OnboardingWelcome;
