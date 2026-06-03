import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../styles/designSystem';

/**
 * Professional Modal Component
 * Standardized modal dialogs with consistent styling
 * Uses React portal to escape overflow-hidden parent containers
 */

const Modal = ({
  isOpen,
  open,        // alias for isOpen (backward compat)
  onClose,
  children,
  size = 'md',
  className = '',
  closeOnOverlayClick = true,
  closeOnEscape = true,
  title,       // convenience title prop (renders as ModalHeader)
  subtitle,
}) => {
  const visible = isOpen ?? open ?? false;
  useEffect(() => {
    if (closeOnEscape) {
      const handleEscape = (e) => {
        if (e.key === 'Escape') onClose();
      };
      if (visible) {
        document.addEventListener('keydown', handleEscape);
        document.body.style.overflow = 'hidden';
      }
      return () => {
        document.removeEventListener('keydown', handleEscape);
        document.body.style.overflow = '';
      };
    }
  }, [visible, onClose, closeOnEscape]);

  if (!visible) return null;

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-6xl',
  };

  const modal = (
    <div
      className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={closeOnOverlayClick ? onClose : undefined}
    >
      <div
        className={cn(
          'bg-white rounded-2xl shadow-2xl w-full max-h-[90vh] overflow-hidden',
          sizes[size],
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Auto-render header when title prop is passed */}
        {title && (
          <div className="px-6 py-4 bg-purple-700 flex items-start justify-between flex-shrink-0">
            <div className="flex-1 min-w-0">
              <div className="text-white font-black text-base uppercase tracking-wide">{title}</div>
              {subtitle && <p className="text-purple-200 text-xs mt-0.5 font-medium">{subtitle}</p>}
            </div>
            <button type="button" onClick={onClose}
              className="ml-4 p-1.5 rounded-lg text-white/60 hover:bg-white/20 hover:text-white transition-all">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );

  // Render into document.body to escape any overflow-hidden ancestors
  return createPortal(modal, document.body);
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
      className={cn('px-6 py-4 bg-purple-700 flex items-start justify-between', className)}
      {...props}
    >
      <div className="flex-1 min-w-0">
        <div className="text-white font-black text-base uppercase tracking-wide">{children}</div>
        {subtitle && (
          <p className="text-purple-200 text-xs mt-0.5 font-medium">{subtitle}</p>
        )}
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="ml-4 p-1.5 rounded-lg text-white/60 hover:bg-white/20 hover:text-white transition-all"
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
      className={cn('px-6 py-4 border-t-2 border-purple-100 bg-purple-50 flex items-center justify-end gap-3', className)}
      {...props}
    >
      {children}
    </div>
  );
};

export default Modal;
