import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import RouteLoadingIndicator from './RouteLoadingIndicator';

describe('RouteLoadingIndicator', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('Threshold behavior (Requirement 1.5)', () => {
    it('should not display immediately when rendered', () => {
      render(<RouteLoadingIndicator />);
      
      // Should not show the spinner initially
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    it('should display after default 200ms threshold', async () => {
      render(<RouteLoadingIndicator />);
      
      // Fast-forward 199ms - should not show yet
      act(() => {
        vi.advanceTimersByTime(199);
      });
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
      
      // Fast-forward 1ms more (200ms total) - should show now
      await act(async () => {
        vi.advanceTimersByTime(1);
      });
      
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should accept custom threshold prop', async () => {
      render(<RouteLoadingIndicator threshold={500} />);
      
      // Should not show before custom threshold
      act(() => {
        vi.advanceTimersByTime(499);
      });
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
      
      // Should show after custom threshold
      await act(async () => {
        vi.advanceTimersByTime(1);
      });
      
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should clean up timer on unmount', () => {
      const { unmount } = render(<RouteLoadingIndicator />);
      
      // Unmount before threshold
      unmount();
      
      // Advance past threshold
      act(() => {
        vi.advanceTimersByTime(300);
      });
      
      // Should not throw or cause issues
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility features (Requirement 1.5)', () => {
    it('should have role="status" for screen readers', async () => {
      render(<RouteLoadingIndicator />);
      
      await act(async () => {
        vi.advanceTimersByTime(200);
      });
      
      const statusElement = screen.getByRole('status');
      expect(statusElement).toBeInTheDocument();
    });

    it('should have aria-live="polite" for announcements', async () => {
      render(<RouteLoadingIndicator />);
      
      await act(async () => {
        vi.advanceTimersByTime(200);
      });
      
      const statusElement = screen.getByRole('status');
      expect(statusElement).toHaveAttribute('aria-live', 'polite');
    });

    it('should have aria-label describing the loading state', async () => {
      render(<RouteLoadingIndicator />);
      
      await act(async () => {
        vi.advanceTimersByTime(200);
      });
      
      const statusElement = screen.getByRole('status');
      expect(statusElement).toHaveAttribute('aria-label', 'Loading page content');
    });

    it('should provide screen reader text', async () => {
      render(<RouteLoadingIndicator />);
      
      await act(async () => {
        vi.advanceTimersByTime(200);
      });
      
      // Check for sr-only text
      expect(screen.getByText('Page is loading. Please wait.')).toBeInTheDocument();
    });

    it('should mark spinner animation as aria-hidden', async () => {
      render(<RouteLoadingIndicator />);
      
      await act(async () => {
        vi.advanceTimersByTime(200);
      });
      
      const spinnerElements = screen.getByRole('status').querySelectorAll('[aria-hidden="true"]');
      expect(spinnerElements.length).toBeGreaterThan(0);
    });
  });

  describe('Visual content', () => {
    it('should display default loading text', async () => {
      render(<RouteLoadingIndicator />);
      
      await act(async () => {
        vi.advanceTimersByTime(200);
      });
      
      expect(screen.getByText('Loading page...')).toBeInTheDocument();
    });

    it('should accept custom loading text prop', async () => {
      render(<RouteLoadingIndicator loadingText="Loading dashboard..." />);
      
      await act(async () => {
        vi.advanceTimersByTime(200);
      });
      
      expect(screen.getByText('Loading dashboard...')).toBeInTheDocument();
    });

    it('should render spinner elements', async () => {
      render(<RouteLoadingIndicator />);
      
      await act(async () => {
        vi.advanceTimersByTime(200);
      });
      
      const statusElement = screen.getByRole('status');
      // Should have nested div structure for spinner
      expect(statusElement.querySelector('.animate-spin')).toBeInTheDocument();
    });
  });

  describe('Component structure', () => {
    it('should render with full height container', async () => {
      render(<RouteLoadingIndicator />);
      
      await act(async () => {
        vi.advanceTimersByTime(200);
      });
      
      const statusElement = screen.getByRole('status');
      expect(statusElement).toHaveClass('h-screen');
    });

    it('should center content vertically and horizontally', async () => {
      render(<RouteLoadingIndicator />);
      
      await act(async () => {
        vi.advanceTimersByTime(200);
      });
      
      const statusElement = screen.getByRole('status');
      expect(statusElement).toHaveClass('flex', 'items-center', 'justify-center');
    });
  });
});
