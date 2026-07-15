import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

/**
 * OnboardingContext - Manages tour completion and tooltip dismissal state
 * 
 * Provides:
 * - Completed tours tracking
 * - Dismissed tooltips tracking
 * - Tour start/complete/restart methods
 * - Tooltip show/dismiss methods
 * - Persistent state via localStorage
 */

const OnboardingContext = createContext(null);

const STORAGE_KEY = 'onboarding_state';

export const OnboardingProvider = ({ children }) => {
  const [state, setState] = useState({
    completedTours: [],
    dismissedTooltips: [],
    currentTour: null,
    lastCompletedDate: null,
  });

  // Load state from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setState(parsed);
      }
    } catch (error) {
      console.error('Failed to load onboarding state:', error);
    }
  }, []);

  // Persist state to localStorage
  const persistState = useCallback((newState) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
      setState(newState);
    } catch (error) {
      console.error('Failed to save onboarding state:', error);
      setState(newState); // Update state anyway
    }
  }, []);

  /**
   * Check if a tour has been completed
   */
  const isTourCompleted = useCallback(
    (tourId) => {
      return state.completedTours.includes(tourId);
    },
    [state.completedTours]
  );

  /**
   * Start a tour
   */
  const startTour = useCallback(
    (tourId) => {
      persistState({
        ...state,
        currentTour: tourId,
      });
    },
    [state, persistState]
  );

  /**
   * Mark a tour as completed
   */
  const completeTour = useCallback(
    (tourId) => {
      if (!state.completedTours.includes(tourId)) {
        persistState({
          ...state,
          completedTours: [...state.completedTours, tourId],
          currentTour: null,
          lastCompletedDate: new Date().toISOString(),
        });
      }
    },
    [state, persistState]
  );

  /**
   * Restart a tour (remove from completed list)
   */
  const restartTour = useCallback(
    (tourId) => {
      persistState({
        ...state,
        completedTours: state.completedTours.filter((id) => id !== tourId),
        currentTour: tourId,
      });
    },
    [state, persistState]
  );

  /**
   * Cancel current tour without completing
   */
  const cancelTour = useCallback(() => {
    persistState({
      ...state,
      currentTour: null,
    });
  }, [state, persistState]);

  /**
   * Check if a tooltip has been dismissed
   */
  const isTooltipDismissed = useCallback(
    (tooltipId) => {
      return state.dismissedTooltips.includes(tooltipId);
    },
    [state.dismissedTooltips]
  );

  /**
   * Dismiss a tooltip
   */
  const dismissTooltip = useCallback(
    (tooltipId) => {
      if (!state.dismissedTooltips.includes(tooltipId)) {
        persistState({
          ...state,
          dismissedTooltips: [...state.dismissedTooltips, tooltipId],
        });
      }
    },
    [state, persistState]
  );

  /**
   * Reset a dismissed tooltip
   */
  const resetTooltip = useCallback(
    (tooltipId) => {
      persistState({
        ...state,
        dismissedTooltips: state.dismissedTooltips.filter((id) => id !== tooltipId),
      });
    },
    [state, persistState]
  );

  /**
   * Reset all onboarding state
   */
  const resetAll = useCallback(() => {
    const newState = {
      completedTours: [],
      dismissedTooltips: [],
      currentTour: null,
      lastCompletedDate: null,
    };
    persistState(newState);
  }, [persistState]);

  /**
   * Reset all tours but keep tooltip dismissals
   */
  const resetTours = useCallback(() => {
    persistState({
      ...state,
      completedTours: [],
      currentTour: null,
      lastCompletedDate: null,
    });
  }, [state, persistState]);

  /**
   * Reset all tooltips but keep tour completions
   */
  const resetTooltips = useCallback(() => {
    persistState({
      ...state,
      dismissedTooltips: [],
    });
  }, [state, persistState]);

  /**
   * Get onboarding statistics
   */
  const getStats = useCallback(() => {
    return {
      completedToursCount: state.completedTours.length,
      dismissedTooltipsCount: state.dismissedTooltips.length,
      hasCurrentTour: !!state.currentTour,
      lastCompletedDate: state.lastCompletedDate,
    };
  }, [state]);

  /**
   * Check if user should see onboarding (first-time user)
   */
  const shouldShowOnboarding = useCallback(() => {
    return state.completedTours.length === 0 && state.dismissedTooltips.length === 0;
  }, [state]);

  const value = {
    // State
    completedTours: state.completedTours,
    dismissedTooltips: state.dismissedTooltips,
    currentTour: state.currentTour,
    lastCompletedDate: state.lastCompletedDate,

    // Tour methods
    isTourCompleted,
    startTour,
    completeTour,
    restartTour,
    cancelTour,

    // Tooltip methods
    isTooltipDismissed,
    dismissTooltip,
    resetTooltip,

    // Reset methods
    resetAll,
    resetTours,
    resetTooltips,

    // Utility methods
    getStats,
    shouldShowOnboarding,
  };

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
};

/**
 * Hook to use onboarding context
 */
export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within OnboardingProvider');
  }
  return context;
};

/**
 * Hook to manage a specific tour
 */
export const useTour = (tourId) => {
  const {
    isTourCompleted,
    startTour,
    completeTour,
    restartTour,
    cancelTour,
    currentTour,
  } = useOnboarding();

  const isActive = currentTour === tourId;
  const isCompleted = isTourCompleted(tourId);

  const start = useCallback(() => {
    startTour(tourId);
  }, [startTour, tourId]);

  const complete = useCallback(() => {
    completeTour(tourId);
  }, [completeTour, tourId]);

  const restart = useCallback(() => {
    restartTour(tourId);
  }, [restartTour, tourId]);

  return {
    isActive,
    isCompleted,
    start,
    complete,
    restart,
    cancel: cancelTour,
  };
};

/**
 * Hook to manage a specific tooltip
 */
export const useTooltipState = (tooltipId) => {
  const { isTooltipDismissed, dismissTooltip, resetTooltip } = useOnboarding();

  const isDismissed = isTooltipDismissed(tooltipId);

  const dismiss = useCallback(() => {
    dismissTooltip(tooltipId);
  }, [dismissTooltip, tooltipId]);

  const reset = useCallback(() => {
    resetTooltip(tooltipId);
  }, [resetTooltip, tooltipId]);

  return {
    isDismissed,
    dismiss,
    reset,
    shouldShow: !isDismissed,
  };
};

/**
 * Hook to auto-start tour for first-time users
 */
export const useAutoStartTour = (tourId, enabled = true, delay = 1000) => {
  const { isTourCompleted, startTour, shouldShowOnboarding } = useOnboarding();
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    if (!enabled || hasStarted) return;

    const shouldStart = shouldShowOnboarding() || !isTourCompleted(tourId);

    if (shouldStart) {
      const timer = setTimeout(() => {
        startTour(tourId);
        setHasStarted(true);
      }, delay);

      return () => clearTimeout(timer);
    }
  }, [tourId, enabled, delay, hasStarted, isTourCompleted, startTour, shouldShowOnboarding]);
};

export default OnboardingContext;
