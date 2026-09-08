import React from 'react';
import { ShieldCheck, ShieldAlert, Clock, Bus, Building2 } from 'lucide-react';

export default function DriverVerificationCard({ driver, busInfo }) {
  if (!driver) return null;

  const status = driver.verificationStatus || 'VERIFIED';
  const isVerified = status === 'VERIFIED';
  const isPending = status === 'PENDING';
  const isRejected = status === 'REJECTED';

  return (
    <div className="card driver-verification-card">
      <div className="verification-header">
        <div className="header-title-group">
          <h3>DRIVER VERIFICATION</h3>
          <span className="sub-title">Transport System Authorization</span>
        </div>
        
        {isVerified && (
          <div className="status-badge live">
            <ShieldCheck size={16} /> VERIFIED ✓
          </div>
        )}
        {isPending && (
          <div className="status-badge pending">
            <Clock size={16} /> PENDING REVIEW
          </div>
        )}
        {isRejected && (
          <div className="status-badge not-started">
            <ShieldAlert size={16} /> REJECTED
          </div>
        )}
      </div>

      <div className="verification-details-grid">
        <div className="detail-item">
          <span className="label">Driver Name</span>
          <span className="value font-bold">{driver.name || 'Rajesh Kumar'}</span>
        </div>

        <div className="detail-item">
          <span className="label">Driver ID</span>
          <span className="value code">{driver.driverId || 'DRV001'}</span>
        </div>

        <div className="detail-item">
          <span className="label">Institution</span>
          <span className="value">
            <Building2 size={14} className="icon-inline" />
            {driver.institution || "St. Mary's High School"}
          </span>
        </div>

        <div className="detail-item">
          <span className="label">Assigned Transport</span>
          <span className="value highlight">
            <Bus size={14} className="icon-inline" />
            {busInfo?.busNumber || 'Bus 24'} ({busInfo?.routeNumber || 'Route 04'})
          </span>
        </div>

        <div className="detail-item">
          <span className="label">Bus Registration</span>
          <span className="value code">{driver.busRegistrationNumber || 'TS 09 UB 2424'}</span>
        </div>

        <div className="detail-item">
          <span className="label">Licence Number</span>
          <span className="value code">{driver.licenceNumber || 'DL-1420110012345'}</span>
        </div>
      </div>

      {isPending && (
        <div className="verification-notice pending">
          <Clock size={18} />
          <div>
            <strong>Awaiting Verification</strong>
            <p>Your driver account is awaiting institution verification. You cannot start a trip until authorized.</p>
          </div>
        </div>
      )}

      {isRejected && (
        <div className="verification-notice rejected">
          <ShieldAlert size={18} />
          <div>
            <strong>Verification Rejected</strong>
            <p>This driver profile has not been approved by the institution transport department.</p>
          </div>
        </div>
      )}

      {isVerified && (
        <div className="verification-notice verified">
          <ShieldCheck size={18} />
          <span>Authorized to operate <strong>{busInfo?.busNumber || 'Bus 24'}</strong> on <strong>{busInfo?.routeNumber || 'Route 04'}</strong>.</span>
        </div>
      )}
    </div>
  );
}
