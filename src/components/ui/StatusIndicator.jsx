import React from 'react';
import { ShieldCheck, Clock, CheckCircle2, AlertTriangle, WifiOff } from 'lucide-react';

/**
 * Reusable Operational Status Indicator Component.
 * 
 * Explicitly separates STATUS from ACTION BUTTONS.
 * Status components should NEVER look like clickable buttons.
 */
export default function StatusIndicator({
  status = 'NOT_STARTED',
  label,
  subtext,
  className = ''
}) {
  const normStatus = (status || '').toUpperCase().replace(/[\s-]/g, '_');

  const getStatusConfig = () => {
    switch (normStatus) {
      case 'LIVE':
        return {
          cssClass: 'live',
          icon: null,
          showPulse: true,
          defaultLabel: 'LIVE'
        };
      case 'NOT_STARTED':
      case 'NOTSTARTED':
        return {
          cssClass: 'not-started',
          icon: Clock,
          showPulse: false,
          defaultLabel: 'NOT STARTED'
        };
      case 'COMPLETED':
        return {
          cssClass: 'completed',
          icon: CheckCircle2,
          showPulse: false,
          defaultLabel: 'TRIP COMPLETED'
        };
      case 'STALE':
        return {
          cssClass: 'stale',
          icon: AlertTriangle,
          showPulse: false,
          defaultLabel: 'LOCATION MAY BE OUTDATED'
        };
      case 'OFFLINE':
        return {
          cssClass: 'offline',
          icon: WifiOff,
          showPulse: false,
          defaultLabel: 'OFFLINE'
        };
      case 'VERIFIED':
        return {
          cssClass: 'verified',
          icon: ShieldCheck,
          showPulse: false,
          defaultLabel: 'VERIFIED'
        };
      case 'PENDING':
        return {
          cssClass: 'pending',
          icon: Clock,
          showPulse: false,
          defaultLabel: 'PENDING REVIEW'
        };
      case 'REJECTED':
        return {
          cssClass: 'rejected',
          icon: AlertTriangle,
          showPulse: false,
          defaultLabel: 'REJECTED'
        };
      default:
        return {
          cssClass: 'not-started',
          icon: null,
          showPulse: false,
          defaultLabel: status
        };
    }
  };

  const config = getStatusConfig();
  const IconComp = config.icon;
  const displayText = label || config.defaultLabel;

  return (
    <div className={`status-indicator-wrapper ${className}`}>
      <span className={`status-badge ${config.cssClass}`}>
        {config.showPulse && <span className="pulse-dot" aria-hidden="true" />}
        {IconComp && <IconComp size={14} aria-hidden="true" />}
        <span>{displayText}</span>
      </span>
      {subtext && <span className="status-subtext">{subtext}</span>}
    </div>
  );
}
