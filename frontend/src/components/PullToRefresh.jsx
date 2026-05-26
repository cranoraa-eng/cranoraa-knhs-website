import { useRef } from 'react';
import { usePullToRefresh } from '../hooks/usePullToRefresh';

const THRESHOLD = 80;

/**
 * Wraps a scrollable container with pull-to-refresh behaviour.
 * Only activates in PWA standalone mode.
 *
 * Props:
 *   onRefresh  — async function called when the user pulls far enough
 *   children   — the scrollable content
 *   className  — extra classes for the scroll container
 */
const PullToRefresh = ({ onRefresh, children, className = '' }) => {
  const containerRef = useRef(null);
  const { pullDistance, isRefreshing, isPulling } = usePullToRefresh(onRefresh, containerRef);

  const progress = Math.min(pullDistance / THRESHOLD, 1); // 0 → 1
  const ready    = progress >= 1;

  return (
    <div className="relative overflow-hidden flex-1 min-h-0">
      {/* ── Pull indicator ── */}
      <div
        aria-hidden="true"
        style={{
          transform: `translateY(${Math.min(pullDistance - 48, 16)}px)`,
          opacity: isPulling || isRefreshing ? Math.min(progress * 1.5, 1) : 0,
          transition: isPulling ? 'none' : 'transform 0.3s ease, opacity 0.3s ease',
        }}
        className="absolute top-0 inset-x-0 z-50 flex justify-center pointer-events-none"
      >
        <div className={`flex items-center gap-2 px-4 py-2 rounded-full shadow-lg text-xs font-bold transition-colors ${
          ready || isRefreshing
            ? 'bg-violet-600 text-white'
            : 'bg-white text-slate-600 border border-slate-200'
        }`}>
          {isRefreshing ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Refreshing…
            </>
          ) : (
            <>
              {/* Rotating arrow — rotates 180° when ready */}
              <svg
                className="w-4 h-4 transition-transform duration-200"
                style={{ transform: ready ? 'rotate(180deg)' : 'rotate(0deg)' }}
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
              </svg>
              {ready ? 'Release to refresh' : 'Pull to refresh'}
            </>
          )}
        </div>
      </div>

      {/* ── Scrollable content ── */}
      <div
        ref={containerRef}
        style={{
          transform: pullDistance > 0 ? `translateY(${pullDistance * 0.4}px)` : 'none',
          transition: isPulling ? 'none' : 'transform 0.3s ease',
        }}
        className={`h-full overflow-y-auto overflow-x-hidden ${className}`}
      >
        {children}
      </div>
    </div>
  );
};

export default PullToRefresh;
