import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SkipLink } from './SkipLink';

describe('SkipLink Component', () => {
  let mainElement;

  beforeEach(() => {
    // Create a main content element for tests
    mainElement = document.createElement('main');
    mainElement.id = 'main-content';
    document.body.appendChild(mainElement);
  });

  afterEach(() => {
    // Clean up
    if (mainElement && mainElement.parentNode) {
      mainElement.parentNode.removeChild(mainElement);
    }
  });

  describe('Rendering', () => {
    it('renders with default props', () => {
      render(<SkipLink />);
      const link = screen.getByRole('link', { name: /skip to main content/i });
      expect(link).toBeInTheDocument();
    });

    it('renders with custom label', () => {
      render(<SkipLink label="Skip navigation" />);
      const link = screen.getByRole('link', { name: /skip navigation/i });
      expect(link).toBeInTheDocument();
    });

    it('has correct href attribute', () => {
      render(<SkipLink targetId="content" />);
      const link = screen.getByRole('link', { name: /skip to main content/i });
      expect(link).toHaveAttribute('href', '#content');
    });

    it('applies custom className', () => {
      render(<SkipLink className="custom-class" />);
      const link = screen.getByRole('link', { name: /skip to main content/i });
      expect(link).toHaveClass('custom-class');
    });
  });

  describe('Accessibility', () => {
    it('has sr-only class for screen readers', () => {
      render(<SkipLink />);
      const link = screen.getByRole('link', { name: /skip to main content/i });
      expect(link).toHaveClass('sr-only');
    });

    it('has focus:not-sr-only class', () => {
      render(<SkipLink />);
      const link = screen.getByRole('link', { name: /skip to main content/i });
      expect(link).toHaveClass('focus:not-sr-only');
    });

    it('has aria-label attribute', () => {
      render(<SkipLink label="Skip to content" />);
      const link = screen.getByRole('link', { name: /skip to content/i });
      expect(link).toHaveAttribute('aria-label', 'Skip to content');
    });

    it('has visible focus styles', () => {
      render(<SkipLink />);
      const link = screen.getByRole('link', { name: /skip to main content/i });
      expect(link).toHaveClass('focus:absolute');
      expect(link).toHaveClass('focus:z-50');
      expect(link).toHaveClass('focus:ring-2');
      expect(link).toHaveClass('focus:ring-violet-500');
    });

    it('has proper focus ring contrast', () => {
      render(<SkipLink />);
      const link = screen.getByRole('link', { name: /skip to main content/i });
      expect(link).toHaveClass('focus:ring-offset-2');
    });
  });

  describe('Focus Management', () => {
    it('focuses target element on click', () => {
      render(<SkipLink targetId="main-content" />);
      const link = screen.getByRole('link', { name: /skip to main content/i });
      
      fireEvent.click(link);
      
      // Check if main element receives focus
      expect(document.activeElement).toBe(mainElement);
    });

    it('adds tabindex to target if not present', () => {
      render(<SkipLink targetId="main-content" />);
      const link = screen.getByRole('link', { name: /skip to main content/i });
      
      expect(mainElement.hasAttribute('tabindex')).toBe(false);
      
      fireEvent.click(link);
      
      expect(mainElement.hasAttribute('tabindex')).toBe(true);
      expect(mainElement.getAttribute('tabindex')).toBe('-1');
    });

    it('does not modify existing tabindex', () => {
      mainElement.setAttribute('tabindex', '0');
      
      render(<SkipLink targetId="main-content" />);
      const link = screen.getByRole('link', { name: /skip to main content/i });
      
      fireEvent.click(link);
      
      expect(mainElement.getAttribute('tabindex')).toBe('0');
    });

    it('prevents default link behavior', () => {
      render(<SkipLink targetId="main-content" />);
      const link = screen.getByRole('link', { name: /skip to main content/i });
      
      const event = new MouseEvent('click', { bubbles: true, cancelable: true });
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
      
      link.dispatchEvent(event);
      
      expect(preventDefaultSpy).toHaveBeenCalled();
    });
  });

  describe('Scrolling Behavior', () => {
    it('calls scrollIntoView on target element if available', () => {
      const scrollIntoViewMock = vi.fn();
      mainElement.scrollIntoView = scrollIntoViewMock;
      
      render(<SkipLink targetId="main-content" />);
      const link = screen.getByRole('link', { name: /skip to main content/i });
      
      fireEvent.click(link);
      
      expect(scrollIntoViewMock).toHaveBeenCalledWith({
        behavior: 'smooth',
        block: 'start'
      });
    });

    it('does not crash if scrollIntoView is not available', () => {
      // Ensure scrollIntoView is not defined
      delete mainElement.scrollIntoView;
      
      render(<SkipLink targetId="main-content" />);
      const link = screen.getByRole('link', { name: /skip to main content/i });
      
      expect(() => {
        fireEvent.click(link);
      }).not.toThrow();
      
      // Focus should still work
      expect(document.activeElement).toBe(mainElement);
    });
  });

  describe('Error Handling', () => {
    it('logs warning if target element not found', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      render(<SkipLink targetId="nonexistent-id" />);
      const link = screen.getByRole('link', { name: /skip to main content/i });
      
      fireEvent.click(link);
      
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'SkipLink: Target element with id "nonexistent-id" not found'
      );
      
      consoleWarnSpy.mockRestore();
    });

    it('does not crash if target element not found', () => {
      render(<SkipLink targetId="nonexistent-id" />);
      const link = screen.getByRole('link', { name: /skip to main content/i });
      
      expect(() => {
        fireEvent.click(link);
      }).not.toThrow();
    });
  });

  describe('Styling', () => {
    it('has background and text colors on focus', () => {
      render(<SkipLink />);
      const link = screen.getByRole('link', { name: /skip to main content/i });
      expect(link).toHaveClass('focus:bg-violet-600');
      expect(link).toHaveClass('focus:text-white');
    });

    it('has padding on focus', () => {
      render(<SkipLink />);
      const link = screen.getByRole('link', { name: /skip to main content/i });
      expect(link).toHaveClass('focus:px-4');
      expect(link).toHaveClass('focus:py-2');
    });

    it('has rounded corners', () => {
      render(<SkipLink />);
      const link = screen.getByRole('link', { name: /skip to main content/i });
      expect(link).toHaveClass('focus:rounded-lg');
    });

    it('has shadow on focus', () => {
      render(<SkipLink />);
      const link = screen.getByRole('link', { name: /skip to main content/i });
      expect(link).toHaveClass('focus:shadow-lg');
    });

    it('has transition animation', () => {
      render(<SkipLink />);
      const link = screen.getByRole('link', { name: /skip to main content/i });
      expect(link).toHaveClass('transition-all');
      expect(link).toHaveClass('duration-200');
    });
  });

  describe('Positioning', () => {
    it('positions at top-left when focused', () => {
      render(<SkipLink />);
      const link = screen.getByRole('link', { name: /skip to main content/i });
      expect(link).toHaveClass('focus:top-4');
      expect(link).toHaveClass('focus:left-4');
    });

    it('has high z-index on focus', () => {
      render(<SkipLink />);
      const link = screen.getByRole('link', { name: /skip to main content/i });
      expect(link).toHaveClass('focus:z-50');
    });
  });

  describe('Multiple SkipLinks', () => {
    it('renders multiple skip links with different targets', () => {
      const contentElement = document.createElement('div');
      contentElement.id = 'content';
      document.body.appendChild(contentElement);
      
      render(
        <>
          <SkipLink targetId="main-content" label="Skip to main" />
          <SkipLink targetId="content" label="Skip to content" />
        </>
      );
      
      const mainLink = screen.getByRole('link', { name: /skip to main/i });
      const contentLink = screen.getByRole('link', { name: /skip to content/i });
      
      expect(mainLink).toHaveAttribute('href', '#main-content');
      expect(contentLink).toHaveAttribute('href', '#content');
      
      document.body.removeChild(contentElement);
    });
  });

  describe('Keyboard Navigation', () => {
    it('can be focused with keyboard', () => {
      render(<SkipLink />);
      const link = screen.getByRole('link', { name: /skip to main content/i });
      
      link.focus();
      
      expect(document.activeElement).toBe(link);
    });

    it('responds to Enter key', () => {
      render(<SkipLink targetId="main-content" />);
      const link = screen.getByRole('link', { name: /skip to main content/i });
      
      link.focus();
      // Simulate Enter key press by clicking (browsers fire click on Enter for links)
      fireEvent.click(link);
      
      // The click handler should be triggered, which focuses the main element
      expect(document.activeElement).toBe(mainElement);
    });
  });
});
