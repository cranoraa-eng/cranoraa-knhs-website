import { useState, useEffect, useRef, useCallback } from 'react';

const THRESHOLD = 80;   // px to pull before triggering
const MAX_PULL  = 120;  // px max visual stretch

/**
 * Pull-to-refresh hook.
 * Only activates in PWA standalone mode to avoid conflicting with
 * the browser's native pull-to-refresh on regular Chrome tabs.
 *
 * Returns:
 *   pullDistance  — current pull distance (0–MAX_PULL), for animating the indicator
 *   isRefreshing  — true while the refresh action is running
 *   isPulling     — true while the user is actively pulling
 */
export function usePullToRefresh(onRefresh, scrollContainerRef) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPulling, setIsPulling]       = useState(false);

  const startYRef    = useRef(null);
  const pullingRef   = useRef(false);
  const refreshingRef = useRef(false);

  // Only enable in PWA standalone mode
  const isPWA = () =>
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true;

  const getScrollTop = useCallback(() => {
    if (scrollContainerRef?.current) return scrollContainerRef.current.scrollTop;
    return window.scrollY || document.documentElement.scrollTop;
  }, [scrollContainerRef]);

  const triggerRefresh = useCallback(async () => {
    if (refreshingRef.current) return;
    refreshingRef.current = true;
    setIsRefreshing(true);
    setPullDistance(THRESHOLD); // hold at threshold while refreshing
    try {
      await onRefresh();
    } finally {
      // Animate back to 0
      setPullDistance(0);
      setIsRefreshing(false);
      setIsPulling(false);
      refreshingRef.current = false;
    }
  }, [onRefresh]);

  useEffect(() => {
    if (!isPWA()) return;

    const el = scrollContainerRef?.current || window;

    const onTouchStart = (e) => {
      if (refreshingRef.current) return;
      if (getScrollTop() > 0) return; // only trigger at top of scroll
      startYRef.current = e.touches[0].clientY;
      pullingRef.current = false;
    };

    const onTouchMove = (e) => {
      if (startYRef.current === null) return;
      if (refreshingRef.current) return;
      if (getScrollTop() > 2) { startYRef.current = null; return; } // scrolled away

      const delta = e.touches[0].clientY - startYRef.current;
      if (delta <= 0) { startYRef.current = null; return; } // pulling up

      // Prevent native scroll/bounce while pulling
      if (delta > 5) e.preventDefault();

      pullingRef.current = true;
      setIsPulling(true);
      // Apply rubber-band resistance
      const clamped = Math.min(delta * 0.5, MAX_PULL);
      setPullDistance(clamped);
    };

    const onTouchEnd = () => {
      if (!pullingRef.current) return;
      pullingRef.current = false;
      startYRef.current = null;

      if (pullDistance >= THRESHOLD || refreshingRef.current) {
        triggerRefresh();
      } else {
        setPullDistance(0);
        setIsPulling(false);
      }
    };

    const target = scrollContainerRef?.current || document;
    target.addEventListener('touchstart', onTouchStart, { passive: true });
    target.addEventListener('touchmove',  onTouchMove,  { passive: false });
    target.addEventListener('touchend',   onTouchEnd,   { passive: true });

    return () => {
      target.removeEventListener('touchstart', onTouchStart);
      target.removeEventListener('touchmove',  onTouchMove);
      target.removeEventListener('touchend',   onTouchEnd);
    };
  }, [getScrollTop, triggerRefresh, pullDistance, scrollContainerRef]);

  return { pullDistance, isRefreshing, isPulling };
}
