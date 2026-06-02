import React from 'react';
import { cn } from '../../styles/designSystem';

/**
 * Professional Input Component
 * Text inputs, textareas, selects with consistent styling
 */

export const Input = React.forwardRef(({
  label = null,
  error = null,
  hint = null,
  className = '',
  containerClassName = '',
  required = false,
  ...props
}, ref) => {
  return (
    <div className={cn('space-y-1.5', containerClassName)}>
      {label && (
        <label className="block text-xs font-medium text-slate-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        ref={ref}
        className={cn(
          'w-full px-4 py-2.5 rounded-lg bg-white text-sm text-slate-900',
          'border border-slate-300 placeholder:text-slate-400',
          'focus:outline-none focus:ring-2 focus:ring-purple-100 focus:border-purple-500',
          'disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed',
          'transition-all duration-150',
          error && 'border-red-300 focus:border-red-500 focus:ring-red-100',
          className
        )}
        {...props}
      />
      {hint && !error && (
        <p className="text-[11px] text-slate-500">{hint}</p>
      )}
      {error && (
        <p className="text-[11px] text-red-600 font-medium">{error}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export const Textarea = React.forwardRef(({
  label = null,
  error = null,
  hint = null,
  className = '',
  containerClassName = '',
  required = false,
  rows = 3,
  ...props
}, ref) => {
  return (
    <div className={cn('space-y-1.5', containerClassName)}>
      {label && (
        <label className="block text-xs font-medium text-slate-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <textarea
        ref={ref}
        rows={rows}
        className={cn(
          'w-full px-4 py-2.5 rounded-lg bg-white text-sm text-slate-900',
          'border border-slate-300 placeholder:text-slate-400',
          'focus:outline-none focus:ring-2 focus:ring-purple-100 focus:border-purple-500',
          'disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed',
          'resize-none transition-all duration-150',
          error && 'border-red-300 focus:border-red-500 focus:ring-red-100',
          className
        )}
        {...props}
      />
      {hint && !error && (
        <p className="text-[11px] text-slate-500">{hint}</p>
      )}
      {error && (
        <p className="text-[11px] text-red-600 font-medium">{error}</p>
      )}
    </div>
  );
});

Textarea.displayName = 'Textarea';

export const Select = React.forwardRef(({
  label = null,
  error = null,
  hint = null,
  className = '',
  containerClassName = '',
  required = false,
  children,
  ...props
}, ref) => {
  return (
    <div className={cn('space-y-1.5', containerClassName)}>
      {label && (
        <label className="block text-xs font-medium text-slate-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <select
        ref={ref}
        className={cn(
          'w-full px-4 py-2.5 rounded-lg bg-white text-sm text-slate-900 font-medium',
          'border border-slate-300',
          'focus:outline-none focus:ring-2 focus:ring-purple-100 focus:border-purple-500',
          'disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed',
          'cursor-pointer transition-all duration-150',
          error && 'border-red-300 focus:border-red-500 focus:ring-red-100',
          className
        )}
        {...props}
      >
        {children}
      </select>
      {hint && !error && (
        <p className="text-[11px] text-slate-500">{hint}</p>
      )}
      {error && (
        <p className="text-[11px] text-red-600 font-medium">{error}</p>
      )}
    </div>
  );
});

Select.displayName = 'Select';

export const SearchInput = React.forwardRef(({
  placeholder = 'Search...',
  className = '',
  ...props
}, ref) => {
  return (
    <div className="relative">
      <svg
        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
      <input
        ref={ref}
        type="search"
        placeholder={placeholder}
        className={cn(
          'w-full pl-10 pr-4 py-2.5 rounded-lg',
          'bg-slate-50 text-sm text-slate-900',
          'border border-slate-200 placeholder:text-slate-400',
          'focus:outline-none focus:ring-2 focus:ring-purple-100 focus:border-purple-500 focus:bg-white',
          'transition-all duration-150',
          className
        )}
        {...props}
      />
    </div>
  );
});

SearchInput.displayName = 'SearchInput';

export const Checkbox = React.forwardRef(({
  label = null,
  className = '',
  containerClassName = '',
  ...props
}, ref) => {
  return (
    <label className={cn('flex items-center gap-2 cursor-pointer', containerClassName)}>
      <input
        ref={ref}
        type="checkbox"
        className={cn(
          'w-4 h-4 rounded border-slate-300 text-purple-600',
          'focus:ring-2 focus:ring-purple-100 focus:ring-offset-0',
          'cursor-pointer transition-all duration-150',
          className
        )}
        {...props}
      />
      {label && (
        <span className="text-sm text-slate-700 select-none">{label}</span>
      )}
    </label>
  );
});

Checkbox.displayName = 'Checkbox';

export default Input;
