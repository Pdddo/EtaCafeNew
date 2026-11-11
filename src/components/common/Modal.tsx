// KOMPONEN : Modal
// PERAN    : Dialog modal reusable bertema warm-cream khas EtaCafe Figma

import React, { useEffect } from 'react';
import './Modal.css';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export default function Modal({
  isOpen,
  onClose,
  title,
  size = 'md',
  children,
  footer,
}: ModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="etacafe-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className={`etacafe-modal-card etacafe-modal-card--${size}`}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="etacafe-modal-header">
            <h3 className="etacafe-modal-title">{title}</h3>
            <button
              type="button"
              className="etacafe-modal-close-btn"
              onClick={onClose}
              aria-label="Tutup"
            >
              &times;
            </button>
          </div>
        )}

        <div className="etacafe-modal-body">{children}</div>

        {footer && <div className="etacafe-modal-footer">{footer}</div>}
      </div>
    </div>
  );
}
