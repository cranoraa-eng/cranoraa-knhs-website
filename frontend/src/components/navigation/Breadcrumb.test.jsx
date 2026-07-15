/**
 * Breadcrumb Component Tests
 * 
 * Tests for breadcrumb rendering, collapse functionality, accessibility, and navigation.
 */

import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import Breadcrumb from './Breadcrumb';

// Helper function to render component within Router context
const renderBreadcrumb = (props) => {
  return render(
    <BrowserRouter>
      <Breadcrumb {...props} />
    </BrowserRouter>
  );
};

describe('Breadcrumb Component', () => {
  describe('Basic Rendering', () => {
    it('renders all breadcrumb items', () => {
      const items = [
        { label: 'Home', path: '/dashboard' },
        { label: 'Academics', path: '/academics-hub' },
        { label: 'My Classes', path: '/my-classes', current: true }
      ];
      
      renderBreadcrumb({ items });
      
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Academics')).toBeInTheDocument();
      expect(screen.getByText('My Classes')).toBeInTheDocument();
    });
    
    it('returns null when no items provided', () => {
      const { container } = renderBreadcrumb({ items: [] });
      expect(container.firstChild).toBeNull();
    });
    
    it('returns null when items is undefined', () => {
      const { container } = renderBreadcrumb({ items: undefined });
      expect(container.firstChild).toBeNull();
    });
  });
  
  describe('Navigation Structure', () => {
    it('has proper ARIA navigation role', () => {
      const items = [
        { label: 'Home', path: '/dashboard' },
        { label: 'Current', path: '/current', current: true }
      ];
      
      renderBreadcrumb({ items });
      
      const nav = screen.getByRole('navigation');
      expect(nav).toHaveAttribute('aria-label', 'Breadcrumb');
    });
    
    it('renders items in an ordered list', () => {
      const items = [
        { label: 'Home', path: '/dashboard' },
        { label: 'Page', path: '/page', current: true }
      ];
      
      const { container } = renderBreadcrumb({ items });
      const ol = container.querySelector('ol');
      
      expect(ol).toBeInTheDocument();
      expect(ol.querySelectorAll('li')).toHaveLength(2);
    });
  });
  
  describe('Current Page Indicator', () => {
    it('marks current item with aria-current="page"', () => {
      const items = [
        { label: 'Home', path: '/dashboard' },
        { label: 'Current', path: '/current', current: true }
      ];
      
      renderBreadcrumb({ items });
      
      const currentItem = screen.getByText('Current');
      expect(currentItem).toHaveAttribute('aria-current', 'page');
    });
    
    it('marks last item as current even without current flag', () => {
      const items = [
        { label: 'Home', path: '/dashboard' },
        { label: 'Last Page', path: '/last' }
      ];
      
      renderBreadcrumb({ items });
      
      const lastItem = screen.getByText('Last Page');
      expect(lastItem).toHaveAttribute('aria-current', 'page');
    });
    
    it('does not render current item as a link', () => {
      const items = [
        { label: 'Home', path: '/dashboard' },
        { label: 'Current', path: '/current', current: true }
      ];
      
      renderBreadcrumb({ items });
      
      const currentItem = screen.getByText('Current');
      expect(currentItem.tagName).toBe('SPAN');
      expect(currentItem.closest('a')).toBeNull();
    });
  });
  
  describe('Links and Navigation', () => {
    it('renders non-current items as links', () => {
      const items = [
        { label: 'Home', path: '/dashboard' },
        { label: 'Academics', path: '/academics-hub' },
        { label: 'Current', path: '/current', current: true }
      ];
      
      renderBreadcrumb({ items });
      
      const homeLink = screen.getByText('Home').closest('a');
      const academicsLink = screen.getByText('Academics').closest('a');
      
      expect(homeLink).toHaveAttribute('href', '/dashboard');
      expect(academicsLink).toHaveAttribute('href', '/academics-hub');
    });
    
    it('adds aria-label to links for accessibility', () => {
      const items = [
        { label: 'Home', path: '/dashboard' },
        { label: 'Current', path: '/current', current: true }
      ];
      
      renderBreadcrumb({ items });
      
      const homeLink = screen.getByText('Home').closest('a');
      expect(homeLink).toHaveAttribute('aria-label', 'Navigate to Home');
    });
  });
  
  describe('Collapse Functionality', () => {
    it('collapses middle items when maxItems is exceeded', () => {
      const items = [
        { label: 'Home', path: '/' },
        { label: 'Level 1', path: '/1' },
        { label: 'Level 2', path: '/2' },
        { label: 'Level 3', path: '/3' },
        { label: 'Current', path: '/current', current: true }
      ];
      
      renderBreadcrumb({ items, maxItems: 3 });
      
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('...')).toBeInTheDocument();
      expect(screen.getByText('Current')).toBeInTheDocument();
      
      // Middle items should be hidden
      expect(screen.queryByText('Level 1')).not.toBeInTheDocument();
      expect(screen.queryByText('Level 2')).not.toBeInTheDocument();
    });
    
    it('keeps last item when collapsed', () => {
      const items = [
        { label: 'Home', path: '/' },
        { label: 'A', path: '/a' },
        { label: 'B', path: '/b' },
        { label: 'C', path: '/c' },
        { label: 'D', path: '/d' },
        { label: 'Current', path: '/current', current: true }
      ];
      
      renderBreadcrumb({ items, maxItems: 4 });
      
      // With maxItems=4, should show: Home, ..., D, Current
      // Formula: keep first (Home) + ellipsis + last (maxItems - 2) items
      // maxItems=4 means keep 2 items from end (4-2=2): D, Current
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('...')).toBeInTheDocument();
      expect(screen.getByText('D')).toBeInTheDocument();
      expect(screen.getByText('Current')).toBeInTheDocument();
      
      // Should NOT show these middle items
      expect(screen.queryByText('A')).not.toBeInTheDocument();
      expect(screen.queryByText('B')).not.toBeInTheDocument();
      expect(screen.queryByText('C')).not.toBeInTheDocument();
    });
    
    it('does not collapse when items are within maxItems limit', () => {
      const items = [
        { label: 'Home', path: '/' },
        { label: 'Page', path: '/page' },
        { label: 'Current', path: '/current', current: true }
      ];
      
      renderBreadcrumb({ items, maxItems: 5 });
      
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Page')).toBeInTheDocument();
      expect(screen.getByText('Current')).toBeInTheDocument();
      expect(screen.queryByText('...')).not.toBeInTheDocument();
    });
    
    it('renders ellipsis as non-clickable span', () => {
      const items = [
        { label: 'Home', path: '/' },
        { label: 'A', path: '/a' },
        { label: 'B', path: '/b' },
        { label: 'C', path: '/c' },
        { label: 'Current', path: '/current', current: true }
      ];
      
      renderBreadcrumb({ items, maxItems: 3 });
      
      const ellipsis = screen.getByText('...');
      expect(ellipsis.tagName).toBe('SPAN');
      expect(ellipsis.closest('a')).toBeNull();
      expect(ellipsis).toHaveAttribute('aria-hidden', 'true');
    });
  });
  
  describe('Styling and Appearance', () => {
    it('applies custom className to container', () => {
      const items = [
        { label: 'Home', path: '/dashboard' },
        { label: 'Current', path: '/current', current: true }
      ];
      
      const { container } = renderBreadcrumb({ 
        items, 
        className: 'custom-class' 
      });
      
      const nav = container.querySelector('nav');
      expect(nav.className).toContain('custom-class');
    });
    
    it('applies focus ring styles to links', () => {
      const items = [
        { label: 'Home', path: '/dashboard' },
        { label: 'Current', path: '/current', current: true }
      ];
      
      renderBreadcrumb({ items });
      
      const homeLink = screen.getByText('Home').closest('a');
      expect(homeLink.className).toContain('focus:ring-2');
      expect(homeLink.className).toContain('focus:ring-violet-500');
    });
    
    it('applies different styling to current page', () => {
      const items = [
        { label: 'Home', path: '/dashboard' },
        { label: 'Current', path: '/current', current: true }
      ];
      
      renderBreadcrumb({ items });
      
      const currentSpan = screen.getByText('Current');
      expect(currentSpan.className).toContain('font-medium');
      expect(currentSpan.className).toContain('text-slate-900');
    });
  });
  
  describe('Separators', () => {
    it('renders separators between items', () => {
      const items = [
        { label: 'Home', path: '/dashboard' },
        { label: 'Middle', path: '/middle' },
        { label: 'Current', path: '/current', current: true }
      ];
      
      const { container } = renderBreadcrumb({ items });
      
      // Should have 2 separators for 3 items
      const separators = container.querySelectorAll('[aria-hidden="true"]');
      // Note: aria-hidden is on both separators and potentially ellipsis
      // So we check for SVG elements specifically (ChevronRight icons)
      const chevrons = container.querySelectorAll('svg');
      expect(chevrons.length).toBe(2);
    });
    
    it('does not render separator after last item', () => {
      const items = [
        { label: 'Home', path: '/dashboard' },
        { label: 'Current', path: '/current', current: true }
      ];
      
      const { container } = renderBreadcrumb({ items });
      
      // Only 1 separator for 2 items
      const chevrons = container.querySelectorAll('svg');
      expect(chevrons.length).toBe(1);
    });
    
    it('accepts custom separator element', () => {
      const items = [
        { label: 'Home', path: '/dashboard' },
        { label: 'Current', path: '/current', current: true }
      ];
      
      renderBreadcrumb({ 
        items, 
        separator: <span className="custom-sep">/</span> 
      });
      
      const customSep = screen.getByText('/');
      expect(customSep).toBeInTheDocument();
      expect(customSep.className).toContain('custom-sep');
    });
  });
  
  describe('Edge Cases', () => {
    it('handles single item breadcrumb', () => {
      const items = [
        { label: 'Home', path: '/dashboard', current: true }
      ];
      
      renderBreadcrumb({ items });
      
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Home')).toHaveAttribute('aria-current', 'page');
    });
    
    it('handles items with special characters in labels', () => {
      const items = [
        { label: 'Home & Dashboard', path: '/dashboard' },
        { label: 'Items (5)', path: '/items', current: true }
      ];
      
      renderBreadcrumb({ items });
      
      expect(screen.getByText('Home & Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Items (5)')).toBeInTheDocument();
    });
    
    it('handles very long breadcrumb paths', () => {
      const items = Array.from({ length: 10 }, (_, i) => ({
        label: `Level ${i + 1}`,
        path: `/level-${i + 1}`,
        current: i === 9
      }));
      
      renderBreadcrumb({ items, maxItems: 3 });
      
      expect(screen.getByText('Level 1')).toBeInTheDocument();
      expect(screen.getByText('...')).toBeInTheDocument();
      expect(screen.getByText('Level 10')).toBeInTheDocument();
    });
  });
});
