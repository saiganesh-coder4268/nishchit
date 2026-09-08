import React from 'react';

/**
 * Reusable Operational Button Component for Nishchit Design System.
 * 
 * Supports:
 * - Variants: 'primary' | 'secondary' | 'ghost' | 'destructive' | 'outline' | 'success'
 * - Sizes: 'sm' | 'md' | 'lg' | 'huge'
 * - States: loading, disabled, fullWidth
 */
export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  icon: Icon,
  iconPosition = 'left',
  className = '',
  type = 'button',
  onClick,
  disabledReason,
  ...props
}) {
  const isClickDisabled = disabled || loading;

  const getVariantClass = () => {
    switch (variant) {
      case 'primary': return 'btn-primary';
      case 'secondary': return 'btn-secondary';
      case 'ghost': return 'btn-ghost';
      case 'destructive':
      case 'danger': return 'btn-danger';
      case 'outline': return 'btn-outline';
      case 'success': return 'btn-success';
      default: return 'btn-primary';
    }
  };

  const getSizeClass = () => {
    switch (size) {
      case 'sm': return 'btn-sm';
      case 'lg': return 'btn-lg';
      case 'huge': return 'btn-huge-driver';
      case 'md':
      default: return '';
    }
  };

  const combinedClasses = [
    'btn',
    getVariantClass(),
    getSizeClass(),
    fullWidth ? 'btn-full' : '',
    loading ? 'btn-loading' : '',
    isClickDisabled ? 'disabled' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <button
      type={type}
      className={combinedClasses}
      disabled={isClickDisabled}
      onClick={isClickDisabled ? undefined : onClick}
      title={disabled ? disabledReason || undefined : undefined}
      aria-disabled={isClickDisabled}
      {...props}
    >
      {loading ? (
        <span className="btn-spinner-wrapper">
          <span className="btn-spinner" aria-hidden="true" />
          <span>Processing...</span>
        </span>
      ) : (
        <>
          {Icon && iconPosition === 'left' && <Icon size={size === 'sm' ? 14 : size === 'huge' ? 24 : 18} aria-hidden="true" />}
          <span>{children}</span>
          {Icon && iconPosition === 'right' && <Icon size={size === 'sm' ? 14 : size === 'huge' ? 24 : 18} aria-hidden="true" />}
        </>
      )}
    </button>
  );
}
