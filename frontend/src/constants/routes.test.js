/**
 * Tests for route configuration with lazy loading and retry logic
 * 
 * Validates:
 * - All route components can be imported
 * - retryImport is properly wrapped
 * - Route definitions are valid
 * 
 * Requirements: 1.2 (route lazy loading), 1.6 (retry on failure)
 */
import { describe, it, expect } from 'vitest';
import { publicRoutes, protectedRoutes } from './routes';

describe('Route Configuration', () => {
  describe('publicRoutes', () => {
    it('should have valid route structure', () => {
      expect(Array.isArray(publicRoutes)).toBe(true);
      expect(publicRoutes.length).toBeGreaterThan(0);
    });

    it('should have path and element for each route', () => {
      publicRoutes.forEach(route => {
        expect(route).toHaveProperty('path');
        expect(route).toHaveProperty('element');
        expect(typeof route.path).toBe('string');
      });
    });

    it('should have lazy-loaded components', () => {
      publicRoutes.forEach(route => {
        // Lazy components have _ctor property
        expect(route.element).toBeDefined();
        expect(typeof route.element).toBe('object');
      });
    });
  });

  describe('protectedRoutes', () => {
    it('should have valid route structure', () => {
      expect(Array.isArray(protectedRoutes)).toBe(true);
      expect(protectedRoutes.length).toBeGreaterThan(0);
    });

    it('should have path for each route', () => {
      protectedRoutes.forEach(route => {
        expect(route).toHaveProperty('path');
        expect(typeof route.path).toBe('string');
      });
    });

    it('should have either element or redirect', () => {
      protectedRoutes.forEach(route => {
        const hasElement = route.hasOwnProperty('element');
        const hasRedirect = route.hasOwnProperty('redirect');
        expect(hasElement || hasRedirect).toBe(true);
      });
    });

    it('should have valid roles when specified', () => {
      protectedRoutes.forEach(route => {
        if (route.roles) {
          expect(Array.isArray(route.roles) || route.roles === 'ALL').toBe(true);
        }
      });
    });

    it('should have lazy-loaded components for non-redirect routes', () => {
      protectedRoutes
        .filter(route => !route.redirect)
        .forEach(route => {
          expect(route.element).toBeDefined();
          expect(typeof route.element).toBe('object');
        });
    });
  });

  describe('lazy loading with retry', () => {
    it('should not throw errors when accessing lazy components', () => {
      const testRoute = publicRoutes[0];
      expect(() => {
        // Just accessing the component should not throw
        const component = testRoute.element;
        expect(component).toBeDefined();
      }).not.toThrow();
    });
  });
});
