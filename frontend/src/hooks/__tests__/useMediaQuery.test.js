import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useMediaQuery, useIsMobile, useIsDesktop, usePrefersDarkMode } from '../useMediaQuery';

describe('useMediaQuery', () => {
  let matchMediaMock;

  beforeEach(() => {
    // Mock window.matchMedia
    matchMediaMock = vi.fn((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn()
    }));

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: matchMediaMock
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('returns false by default', () => {
    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'));
    expect(result.current).toBe(false);
  });

  it('returns true when media query matches', () => {
    matchMediaMock.mockReturnValue({
      matches: true,
      media: '(min-width: 768px)',
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    });

    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'));
    expect(result.current).toBe(true);
  });

  it('calls addEventListener when available', () => {
    const addEventListener = vi.fn();
    matchMediaMock.mockReturnValue({
      matches: false,
      media: '(min-width: 768px)',
      addEventListener,
      removeEventListener: vi.fn()
    });

    renderHook(() => useMediaQuery('(min-width: 768px)'));
    expect(addEventListener).toHaveBeenCalledWith('change', expect.any(Function));
  });

  it('useIsMobile checks correct query', () => {
    renderHook(() => useIsMobile());
    expect(matchMediaMock).toHaveBeenCalledWith('(max-width: 639px)');
  });

  it('useIsDesktop checks correct query', () => {
    renderHook(() => useIsDesktop());
    expect(matchMediaMock).toHaveBeenCalledWith('(min-width: 1024px)');
  });

  it('usePrefersDarkMode checks correct query', () => {
    renderHook(() => usePrefersDarkMode());
    expect(matchMediaMock).toHaveBeenCalledWith('(prefers-color-scheme: dark)');
  });
});
