import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useOnboarding } from './OnboardingContext';

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const getVisibleRect = (selector) => {
  if (!selector) return null;
  const elements = Array.from(document.querySelectorAll(selector));
  const visible = elements.find((element) => {
    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);
    return (
      rect.width > 0 &&
      rect.height > 0 &&
      style.visibility !== 'hidden' &&
      style.display !== 'none' &&
      rect.bottom > 0 &&
      rect.right > 0 &&
      rect.top < window.innerHeight &&
      rect.left < window.innerWidth
    );
  });

  if (!visible) return null;
  const rect = visible.getBoundingClientRect();
  return {
    top: rect.top,
    left: rect.left,
    width: rect.width,
    height: rect.height,
    bottom: rect.bottom,
    right: rect.right,
  };
};

const GuidedTour = () => {
  const {
    activeStepIndex,
    activeTour,
    endTour,
    setActiveStepIndex,
  } = useOnboarding();
  const navigate = useNavigate();
  const location = useLocation();
  const reduceMotion = useReducedMotion();
  const dialogRef = useRef(null);
  const [targetRect, setTargetRect] = useState(null);

  const step = activeTour?.steps?.[activeStepIndex];
  const totalSteps = activeTour?.steps?.length || 0;
  const isLastStep = activeStepIndex >= totalSteps - 1;

  useEffect(() => {
    if (!step?.path) return;
    if (location.pathname !== step.path) navigate(step.path);
  }, [location.pathname, navigate, step?.path]);

  useEffect(() => {
    if (!step) return;

    let cancelled = false;
    let attempts = 0;

    const updateTarget = () => {
      if (cancelled) return;
      const element = step.target ? document.querySelector(step.target) : null;
      if (element && attempts === 0) {
        element.scrollIntoView({ block: 'center', inline: 'center', behavior: reduceMotion ? 'auto' : 'smooth' });
      }

      window.setTimeout(() => {
        if (cancelled) return;
        const rect = getVisibleRect(step.target);
        setTargetRect(rect);
        attempts += 1;
        if (!rect && attempts < 12) updateTarget();
      }, attempts === 0 ? 180 : 90);
    };

    updateTarget();
    window.addEventListener('resize', updateTarget);
    window.addEventListener('scroll', updateTarget, true);

    return () => {
      cancelled = true;
      window.removeEventListener('resize', updateTarget);
      window.removeEventListener('scroll', updateTarget, true);
    };
  }, [location.pathname, reduceMotion, step]);

  useEffect(() => {
    if (!activeTour) return;
    const previous = document.activeElement;
    dialogRef.current?.focus();

    const onKeyDown = (event) => {
      if (event.key === 'Escape') endTour(false);
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      previous?.focus?.();
    };
  }, [activeTour, endTour]);

  const popoverStyle = useMemo(() => {
    const margin = 16;
    const width = Math.min(380, window.innerWidth - margin * 2);

    if (!targetRect || window.innerWidth < 640) {
      return {
        left: margin,
        right: margin,
        bottom: 'calc(1rem + env(safe-area-inset-bottom))',
        width: 'auto',
      };
    }

    const topCandidate = targetRect.bottom + 16;
    const top = clamp(topCandidate, margin, window.innerHeight - 310);
    const left = clamp(targetRect.left + targetRect.width / 2 - width / 2, margin, window.innerWidth - width - margin);
    return { top, left, width };
  }, [targetRect]);

  if (!activeTour || !step) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[90]"
        initial={reduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={reduceMotion ? { opacity: 1 } : { opacity: 0 }}
      >
        <div className="absolute inset-0 bg-slate-950/65 backdrop-blur-[1px]" />

        {targetRect && (
          <motion.div
            className="pointer-events-none fixed rounded-2xl border-2 border-white bg-transparent shadow-[0_0_0_9999px_rgba(15,23,42,0.52),0_20px_70px_rgba(255,255,255,0.2)]"
            initial={false}
            animate={{
              top: targetRect.top - 8,
              left: targetRect.left - 8,
              width: targetRect.width + 16,
              height: targetRect.height + 16,
            }}
            transition={{ duration: reduceMotion ? 0 : 0.22, ease: 'easeOut' }}
          />
        )}

        <motion.div
          ref={dialogRef}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          aria-live="polite"
          aria-labelledby="tour-step-title"
          className="fixed rounded-2xl border border-white/70 bg-white p-4 shadow-2xl outline-none sm:p-5"
          style={popoverStyle}
          initial={reduceMotion ? false : { y: 14, opacity: 0, scale: 0.98 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={reduceMotion ? { opacity: 1 } : { y: 10, opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
        >
          <div className="mb-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-violet-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-violet-600">
                Step {activeStepIndex + 1} of {totalSteps}
              </span>
              {!targetRect && (
                <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-amber-600">
                  Page guide
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => endTour(false)}
              className="rounded-xl p-2 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
              aria-label="Close tour"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <h2 id="tour-step-title" className="text-lg font-black leading-tight text-slate-900">
            {step.title}
          </h2>
          <p className="mt-2 text-sm font-medium leading-6 text-slate-600">
            {step.body}
          </p>

          <div className="mt-5 flex items-center gap-1.5" aria-hidden="true">
            {activeTour.steps.map((item, index) => (
              <span
                key={item.id}
                className={`h-1.5 flex-1 rounded-full ${index <= activeStepIndex ? 'bg-violet-600' : 'bg-slate-200'}`}
              />
            ))}
          </div>

          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={() => endTour(false)}
              className="rounded-xl px-3 py-2 text-xs font-black uppercase tracking-widest text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
            >
              Skip
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={activeStepIndex === 0}
                onClick={() => setActiveStepIndex(Math.max(0, activeStepIndex - 1))}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black uppercase tracking-widest text-slate-500 transition-all hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => {
                  if (isLastStep) endTour(true);
                  else setActiveStepIndex(activeStepIndex + 1);
                }}
                className="rounded-xl bg-violet-600 px-4 py-2 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-violet-200 transition-all hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
              >
                {isLastStep ? 'Finish' : 'Next'}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default GuidedTour;
