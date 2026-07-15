/**
 * Breadcrumb Component
 * 
 * Displays hierarchical navigation trail showing current page location in site hierarchy.
 * Features:
 * - Configurable max items with ellipsis collapse for long paths
 * - ARIA navigation role and aria-current attribute for accessibility
 * - Keyboard navigation support
 * - Styled with Tailwind CSS (separators, hover states, active indicators)
 * 
 * @component
 */

import React from 'react';
import { Link } from 'react-router-dom';

/**
 * ChevronRight SVG Icon Component
 */
const ChevronRightIcon = ({ className = "h-4 w-4" }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 5l7 7-7 7"
    />
  </svg>
);

/**
 * Breadcrumb component props
 * @typedef {Object} BreadcrumbProps
 * @property {Array<{label: string, path: string, current?: boolean, collapsed?: boolean}>} items - Breadcrumb items to display
 * @property {number} [maxItems] - Maximum number of items to display before collapsing (default: no limit)
 * @property {React.ReactNode} [separator] - Custom separator element (default: ChevronRight icon)
 * @property {string} [className] - Additional CSS classes to apply to the breadcrumb container
 */

/**
 * Collapses breadcrumbs when they exceed maxItems count.
 * Keeps first item (home), last item (current), and uses ellipsis for middle items.
 * 
 * @param {Array} breadcrumbs - Original breadcrumb items
 * @param {number} maxItems - Maximum items to display
 * @returns {Array} Collapsed breadcrumb items
 */
function collapseBreadcrumbs(breadcrumbs, maxItems) {
  if (breadcrumbs.length <= maxItems) {
    return breadcrumbs;
  }
  
  const result = [];
  
  // Always keep first item (home)
  result.push(breadcrumbs[0]);
  
  // Add ellipsis for collapsed middle items
  result.push({
    label: '...',
    path: '#',
    collapsed: true
  });
  
  // Keep last (maxItems - 2) items
  const keepFromEnd = maxItems - 2;
  const startIndex = breadcrumbs.length - keepFromEnd;
  
  for (let i = startIndex; i < breadcrumbs.length; i++) {
    result.push(breadcrumbs[i]);
  }
  
  return result;
}

/**
 * Breadcrumb Component
 * 
 * Renders a navigation breadcrumb trail with accessibility features.
 * 
 * @param {BreadcrumbProps} props - Component props
 * @returns {JSX.Element} Breadcrumb component
 * 
 * @example
 * <Breadcrumb items={[
 *   { label: 'Home', path: '/dashboard' },
 *   { label: 'Academics', path: '/academics-hub' },
 *   { label: 'Grades', path: '/academics-hub/grades', current: true }
 * ]} />
 * 
 * @example
 * // With max items and collapse
 * <Breadcrumb 
 *   items={longPathItems} 
 *   maxItems={4}
 * />
 */
const Breadcrumb = ({ 
  items = [], 
  maxItems, 
  separator = <ChevronRightIcon />,
  className = ''
}) => {
  // Return null if no items provided
  if (!items || items.length === 0) {
    return null;
  }
  
  // Collapse items if maxItems is specified
  const displayItems = maxItems ? collapseBreadcrumbs(items, maxItems) : items;
  
  return (
    <nav 
      aria-label="Breadcrumb" 
      className={`flex items-center text-sm ${className}`}
      role="navigation"
    >
      <ol className="flex items-center space-x-2">
        {displayItems.map((item, index) => {
          const isLast = index === displayItems.length - 1;
          const isCurrent = item.current || isLast;
          const isCollapsed = item.collapsed;
          
          return (
            <li key={`${item.path}-${index}`} className="flex items-center">
              {/* Breadcrumb Link/Text */}
              {isCollapsed ? (
                // Collapsed ellipsis - not clickable
                <span 
                  className="px-2 py-1 text-slate-500"
                  aria-hidden="true"
                >
                  {item.label}
                </span>
              ) : isCurrent ? (
                // Current page - not a link
                <span 
                  className="px-2 py-1 font-medium text-slate-900 dark:text-slate-100"
                  aria-current="page"
                >
                  {item.label}
                </span>
              ) : (
                // Regular breadcrumb link
                <Link
                  to={item.path}
                  className="px-2 py-1 text-slate-600 hover:text-violet-600 dark:text-slate-400 dark:hover:text-violet-400 
                             transition-colors duration-150 rounded focus:outline-none focus:ring-2 focus:ring-violet-500 
                             focus:ring-offset-2 dark:focus:ring-offset-slate-900"
                  aria-label={`Navigate to ${item.label}`}
                >
                  {item.label}
                </Link>
              )}
              
              {/* Separator */}
              {!isLast && (
                <span 
                  className="ml-2 text-slate-400 dark:text-slate-600"
                  aria-hidden="true"
                >
                  {separator}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumb;
