import React, { useEffect } from 'react';
import { cn } from '../../styles/designSystem';

/**
 * Professional Modal Component
 * Standardized modal dialogs with consistent styling
 */

const Modal = ({
  isOpen,
  onClose,
  children,
  size = 'md',
  className = '',
  closeOnOverlayClick = true,
  closeOnEscape = true,
}) => {
  useEffect(() => {
    if (closeOnEscape) {
      const handleEscape = (e) => {
        if (e.key === 'Escape') onClose();
      };
      if (isOpen) {
        document.addEventListener('keydown', handleEscape);
        document.body.style.overflow = 'hidden';
      }
      return () => {
        document.removeEventListener('keydown', handleEscape);
        document.body.style.overflow = '';
      };
    }
  }, [isOpen, onClose, closeOnEscape]);

  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-6xl',
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
      onClick={closeOnOverlayClick ? onClose : undefined}
    >
      <div
        className={cn(
          'bg-white rounded-2xl shadow-2xl w-full max-h-[90vh] overflow-hidden animate-slideUp',
          sizes[size],
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
};

export const ModalHeader = ({
  children,
  onClose,
  className = '',
  subtitle = null,
  ...props
}) => {
  return (
    <div
      className={cn('px-6 py-4 border-b border-slate-200 flex items-start justify-between', className)}
      {...props}
    >
      <div className="flex-1 min-w-0">
        <h3 className="text-lg font-semibold text-slate-900">{children}</h3>
        {subtitle && (
          <p className="text-xs text-slate-500 mt-0.5 font-medium">{subtitle}</p>
        )}
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="ml-4 p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
};

export const ModalBody = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <div
      className={cn('px-6 py-4 overflow-y-auto max-h-[60vh]', className)}
      {...props}
    >
      {children}
    </div>
  );
};

export const ModalFooter = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <div
      className={cn('px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-3', className)}
      {...props}
    >
      {children}
    </div>
  );
};

export default Modal;
