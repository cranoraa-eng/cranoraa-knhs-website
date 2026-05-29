import { useEffect } from 'react';

const roleLabels = {
  student: 'Student Portal',
  teacher: 'Teacher Portal',
  parent: 'Parent Portal',
  admin: 'Admin Portal',
};

const IntroScreen = ({ open = false, user = null, duration = 900, onComplete }) => {
  useEffect(() => {
    if (!open) return undefined;

    const timer = window.setTimeout(() => {
      onComplete?.();
    }, duration);

    return () => window.clearTimeout(timer);
  }, [duration, onComplete, open]);

  if (!open) return null;

  const displayName =
    [user?.first_name, user?.last_name].filter(Boolean).join(' ') ||
    user?.email ||
    'Welcome';

  const portalLabel = roleLabels[user?.role] || 'KNHS Portal';

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-[#0F071E]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(139,92,246,0.24),_transparent_35%),radial-gradient(circle_at_bottom_left,_rgba(59,130,246,0.18),_transparent_30%)]" />
      <div className="relative mx-6 w-full max-w-md rounded-3xl border border-white/10 bg-white/5 px-8 py-10 text-center shadow-2xl backdrop-blur-xl">
        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-white p-3 shadow-lg ring-4 ring-violet-500/20">
          <img src="/icons/school-logo-source.png" alt="KNHS Logo" className="h-full w-full object-contain" />
        </div>
        <p className="mb-2 text-[11px] font-black uppercase tracking-[0.35em] text-violet-300">
          {portalLabel}
        </p>
        <h1 className="text-3xl font-black tracking-tight text-white">
          Welcome, {displayName}
        </h1>
        <p className="mt-2 text-sm text-slate-300">
          Taking you to your dashboard...
        </p>
        <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-400"
            style={{ animation: `intro-progress ${duration}ms linear forwards`, width: '0%' }}
          />
        </div>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes intro-progress {
              from { width: 0%; }
              to { width: 100%; }
            }
          `,
        }}
      />
    </div>
  );
};

export default IntroScreen;
