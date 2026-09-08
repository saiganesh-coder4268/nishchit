import React, { useEffect } from 'react';
import Button from './Button';
import { AlertTriangle, X } from 'lucide-react';

/**
 * Reusable Confirmation Dialog Component.
 * 
 * Used for meaningful/destructive state transitions (e.g. END TRIP).
 */
export default function ConfirmDialog({
  isOpen = false,
  title = "Confirm Action",
  message = "Are you sure you want to proceed?",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  variant = "destructive",
  loading = false
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isOpen && e.key === 'Escape') {
        onCancel?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="confirm-dialog-title">
      <div className="modal-content confirm-dialog-box">
        <div className="modal-header">
          <div className="confirm-title-group">
            {variant === 'destructive' && (
              <div className="confirm-icon-wrapper destructive">
                <AlertTriangle size={20} />
              </div>
            )}
            <h3 id="confirm-dialog-title">{title}</h3>
          </div>
          
          <button 
            onClick={onCancel} 
            className="drawer-close-btn"
            aria-label="Close confirmation dialog"
          >
            <X size={18} />
          </button>
        </div>

        <p className="confirm-dialog-message">{message}</p>

        <div className="confirm-dialog-actions">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelLabel}
          </Button>

          <Button
            variant={variant === 'destructive' ? 'destructive' : 'primary'}
            onClick={onConfirm}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
