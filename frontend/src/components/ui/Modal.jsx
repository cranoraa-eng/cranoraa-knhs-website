/**
 * Modal — consistent modal/dialog wrapper.
 * Usage:
 *   <Modal open={showModal} onClose={() => setShowModal(false)} title="Create Announcement" size="lg">
 *     ...content...
 *   </Modal>
 */
import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

export const Modal = ({ open, onClose, title, subtitle, children, footer, size = 'md', className = '' }) => {
  // Lock body scroll when modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [open]);

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  const sizeClass = {
    sm:  'max-w-sm',
    md:  'max-w-lg',
    lg:  'max-w-2xl',
    xl:  'max-w-4xl',
    full:'max-w-[95vw]',
  }[size] || 'max-w-lg';

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity animate-in fade-in duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className={`relative w-full ${sizeClass} max-h-[90vh] flex flex-col bg-white rounded-3xl shadow-2xl border border-slate-200/50 overflow-hidden animate-in zoom-in-95 duration-300 ${className}`}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0 bg-slate-50/50">
          <div>
            <h2 className="text-base font-black text-slate-900 tracking-tight uppercase">{title}</h2>
            {subtitle && <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-1">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-2.5 rounded-2xl hover:bg-slate-200 text-slate-400 transition-all active:scale-90"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex-shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};
