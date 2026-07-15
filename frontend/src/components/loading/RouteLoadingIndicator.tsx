import React, { useState, useEffect } from 'react';

/**
 * RouteLoadingIndicator displays a loading spinner for route transitions.
 * It only appears if loading takes longer than the threshold (default 200ms)
 * to avoid flashing for fast loads.
 * 
 * Requirements: 1.5 - Display loading indicator for route chunks that take >200ms to load
 */

interface RouteLoadingIndicatorProps {
  /**
   * Delay in milliseconds before showing the loading indicator.
   * Default: 200ms to prevent flash of loading state for fast loads.
   */
  threshold?: number;
  
  /**
   * Optional custom text to display below the spinner.
   */
  loadingText?: string;
}

export const RouteLoadingIndicator: React.FC<RouteLoadingIndicatorProps> = ({ 
  threshold = 200,
  loadingText = 'Loading page...'
}) => {
  const [showSpinner, setShowSpinner] = useState(false);

  useEffect(() => {
    // Only show spinner if loading takes longer than threshold
    const timer = setTimeout(() => {
      setShowSpinner(true);
    }, threshold);

    return () => clearTimeout(timer);
  }, [threshold]);

  // Don't render anything until threshold is reached
  if (!showSpinner) {
    return null;
  }

  return (
    <div 
      className="flex flex-col items-center justify-center h-screen"
      role="status"
      aria-live="polite"
      aria-label="Loading page content"
    >
      <div className="relative">
        {/* Background circle */}
        <div className="w-12 h-12 rounded-full border-4 border-slate-200" />
        {/* Animated spinner */}
        <div 
          className="absolute top-0 left-0 w-12 h-12 rounded-full border-4 border-violet-600 border-t-transparent animate-spin"
          aria-hidden="true"
        />
      </div>
      
      {/* Loading text for screen readers and visual users */}
      <p className="mt-4 text-slate-600 text-sm font-medium">
        {loadingText}
      </p>
      
      {/* Screen reader announcement */}
      <span className="sr-only">
        Page is loading. Please wait.
      </span>
    </div>
  );
};

export default RouteLoadingIndicator;
