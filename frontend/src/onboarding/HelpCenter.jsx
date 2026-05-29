import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useOnboarding } from './OnboardingContext';
import OnboardingChecklist from './OnboardingChecklist';
import GuideContent from './GuideContent';

export const HelpHeaderButton = () => {
  const { helpOpen, setHelpOpen } = useOnboarding();

  return (
    <button
      type="button"
      data-tour="help-center"
      onClick={() => setHelpOpen(true)}
      aria-label="Open help center"
      aria-expanded={helpOpen}
      className={`inline-flex items-center gap-1.5 rounded-sm border px-2.5 py-2 text-[10px] font-bold uppercase tracking-wide transition-all focus:outline-none focus:ring-2 focus:ring-slate-400/40 focus:ring-offset-1 ${
        helpOpen
          ? 'border-slate-400 bg-slate-100 text-slate-800'
          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
      }`}
    >
      <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M8.228 9.228a4 4 0 117.544 1.886c-.847.706-1.522 1.249-1.522 2.386M12 17h.01M12 3a9 9 0 110 18 9 9 0 010-18z" />
      </svg>
      <span className="hidden sm:inline">Help</span>
    </button>
  );
};

const HelpCenter = () => {
  const {
    checklistPercent,
    config,
    helpOpen,
    resetRoleOnboarding,
    role,
    setHelpOpen,
    startTour,
  } = useOnboarding();
  const [query, setQuery] = useState('');
  const reduceMotion = useReducedMotion();
  const panelRef = useRef(null);

  const filteredArticles = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return config.helpArticles;
    return config.helpArticles.filter((article) => {
      const haystack = [
        article.title,
        article.category,
        article.body,
        article.note,
        ...(article.bullets || []),
      ].filter(Boolean).join(' ').toLowerCase();
      return haystack.includes(normalized);
    });
  }, [config.helpArticles, query]);

  useEffect(() => {
    if (!helpOpen) return;
    const previous = document.activeElement;
    panelRef.current?.focus();

    const onKeyDown = (event) => {
      if (event.key === 'Escape') setHelpOpen(false);
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      previous?.focus?.();
    };
  }, [helpOpen, setHelpOpen]);

  return (
    <>
      <AnimatePresence>
        {helpOpen && (
          <motion.div
            className="fixed inset-0 z-[85]"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduceMotion ? { opacity: 1 } : { opacity: 0 }}
          >
            <button
              type="button"
              className="absolute inset-0 cursor-default bg-slate-950/40 backdrop-blur-sm"
              onClick={() => setHelpOpen(false)}
              aria-label="Close help center"
            />

            <motion.aside
              ref={panelRef}
              tabIndex={-1}
              role="dialog"
              aria-modal="true"
              aria-labelledby="help-center-title"
              className="absolute bottom-0 right-0 top-auto flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl border border-white/70 bg-slate-50 shadow-2xl outline-none sm:bottom-4 sm:right-4 sm:top-4 sm:max-h-none sm:w-[460px] sm:rounded-3xl"
              initial={reduceMotion ? false : { x: 40, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={reduceMotion ? { opacity: 1 } : { x: 40, opacity: 0 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
            >
              <div className="border-b border-slate-200 bg-white p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-violet-500">{role} guide</p>
                    <h2 id="help-center-title" className="mt-1 text-xl font-black tracking-tight text-slate-900">Help center</h2>
                    <p className="mt-1 text-xs font-medium leading-5 text-slate-500">
                      Search quick guides, replay tours, and continue onboarding.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setHelpOpen(false)}
                    className="rounded-xl p-2 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                    aria-label="Close help center"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="mt-4 grid grid-cols-[1fr_auto] gap-2">
                  <label className="relative block">
                    <span className="sr-only">Search help articles</span>
                    <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M21 21l-4.35-4.35M11 18a7 7 0 110-14 7 7 0 010 14z" />
                    </svg>
                    <input
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm font-semibold text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-violet-300 focus:bg-white focus:ring-4 focus:ring-violet-100"
                      placeholder="Search guides"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => startTour('primary')}
                    className="rounded-2xl bg-violet-600 px-4 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-violet-200 transition-all hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
                  >
                    Tour
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                <div className="mb-4 rounded-2xl border border-violet-100 bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-violet-500">Progress</p>
                      <p className="mt-1 text-sm font-black text-slate-900">Onboarding is {checklistPercent}% complete</p>
                    </div>
                    <button
                      type="button"
                      onClick={resetRoleOnboarding}
                      className="rounded-xl border border-slate-200 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500 transition-all hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                    >
                      Reset
                    </button>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-gradient-to-r from-violet-600 to-emerald-500" style={{ width: `${checklistPercent}%` }} />
                  </div>
                </div>

                <OnboardingChecklist compact />

                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Quick guides</h3>
                    <span className="text-[10px] font-bold text-slate-400">{filteredArticles.length}</span>
                  </div>

                  {filteredArticles.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center">
                      <p className="text-sm font-black text-slate-700">No guide found</p>
                      <p className="mt-1 text-xs font-medium text-slate-500">Try a broader search term.</p>
                    </div>
                  ) : (
                    filteredArticles.map((article) => (
                      <article key={article.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <p className="text-[9px] font-black uppercase tracking-[0.22em] text-violet-500">{article.category}</p>
                        <h4 className="mt-1 text-sm font-black text-slate-900">{article.title}</h4>
                        <GuideContent
                          className="mt-2"
                          body={article.body}
                          bullets={article.bullets}
                          note={article.note}
                        />
                        {article.videoUrl && (
                          <a
                            href={article.videoUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-3 inline-flex rounded-xl border border-slate-200 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-violet-600 hover:bg-violet-50"
                          >
                            Watch tutorial
                          </a>
                        )}
                      </article>
                    ))
                  )}
                </div>
              </div>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default HelpCenter;
