import React from 'react';

/**
 * QuickMessageButton Component for Driver Quick Status Announcements.
 * 
 * Provides touch-friendly, distinct, single-tap controls.
 * 'Emergency' is visually distinguished with a warning accent, while
 * standard status announcements maintain calm, clean, operational styling.
 */
export default function QuickMessageButton({
  label,
  text,
  onClick,
  isEmergency = false,
  disabled = false
}) {
  const cssClass = isEmergency ? 'quick-action-btn emergency' : 'quick-action-btn';

  return (
    <button
      type="button"
      className={cssClass}
      onClick={disabled ? undefined : () => onClick(text)}
      disabled={disabled}
    >
      <span>{label}</span>
    </button>
  );
}
