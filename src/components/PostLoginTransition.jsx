import React, { useEffect, useState } from 'react';
import { Check, Bus, Users, TrendingUp } from 'lucide-react';

/**
 * PostLoginTransition Component
 * 
 * Implements the "POST-LOGIN (SUCCESS) QUICK • CONFIDENT • SMOOTH" screen from Reference 1:
 * - Concentric expanding ripple circles
 * - Amber location pin on the orbit
 * - Blue checkmark badge
 * - "All set! Taking you to your dashboard..."
 * - Reassurance trust pills: "Safer Journeys • Happier Families • Brighter Tomorrows"
 */
export default function PostLoginTransition({ onFinish, duration = 1400 }) {
  const [progress, setProgress] = useState(20);

  useEffect(() => {
    const tProgress = setTimeout(() => setProgress(100), 250);
    const tTimer = setTimeout(() => {
      if (onFinish) onFinish();
    }, duration);

    return () => {
      clearTimeout(tProgress);
      clearTimeout(tTimer);
    };
  }, [onFinish, duration]);

  return (
    <div
      className="nishchit-postlogin-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999998,
        backgroundColor: '#FFFFFF',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        animation: 'fadeIn 250ms ease-out forwards'
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          maxWidth: '420px',
          width: '100%',
          padding: '0 24px',
          textAlign: 'center'
        }}
      >
        {/* Concentric Ripple with Checkmark & Orbiting Pin */}
        <div
          style={{
            position: 'relative',
            width: '160px',
            height: '160px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '32px'
          }}
        >
          {/* Outer Ripple Circle */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              border: '1.5px dashed #DBEAFE',
              animation: 'spin 18s linear infinite'
            }}
          />

          {/* Middle Ripple Circle */}
          <div
            style={{
              position: 'absolute',
              inset: '16px',
              borderRadius: '50%',
              backgroundColor: '#EFF6FF',
              opacity: 0.8
            }}
          />

          {/* Orbiting Amber Location Pin */}
          <div
            style={{
              position: 'absolute',
              top: '4px',
              right: '18px',
              zIndex: 3
            }}
          >
            <svg width="22" height="26" viewBox="0 0 24 28" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M12 2C7.58172 2 4 5.58172 4 10C4 15.5 12 24 12 24C12 24 20 15.5 20 10C20 5.58172 16.4183 2 12 2Z"
                fill="#F59E0B"
              />
              <circle cx="12" cy="10" r="3.5" fill="#FFFFFF" />
            </svg>
          </div>

          {/* Center Checkmark Circle Badge */}
          <div
            style={{
              position: 'relative',
              zIndex: 2,
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: '#2563EB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(37, 99, 235, 0.25)',
              animation: 'scaleIn 350ms cubic-bezier(0.16, 1, 0.3, 1) forwards'
            }}
          >
            <Check size={32} color="#FFFFFF" strokeWidth={3} />
          </div>
        </div>

        {/* Affirmation Text */}
        <h2
          style={{
            fontSize: '1.75rem',
            fontWeight: 800,
            color: '#172033',
            margin: '0 0 8px 0',
            letterSpacing: '-0.02em'
          }}
        >
          All set!
        </h2>
        <p
          style={{
            fontSize: '0.95rem',
            color: '#64748b',
            margin: '0 0 24px 0',
            fontWeight: 500
          }}
        >
          Taking you to your dashboard...
        </p>

        {/* Loading Bar */}
        <div
          style={{
            width: '120px',
            height: '3.5px',
            backgroundColor: '#F1F5F9',
            borderRadius: '99px',
            overflow: 'hidden',
            marginBottom: '48px'
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${progress}%`,
              backgroundColor: '#2563EB',
              borderRadius: '99px',
              transition: 'width 800ms cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          />
        </div>

        {/* Micro Trust Pills from Reference 1 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '24px',
            borderTop: '1px solid #F1F5F9',
            paddingTop: '20px',
            width: '100%'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '0.75rem', fontWeight: 600 }}>
            <Bus size={15} color="#2563EB" />
            <span>Safer Journeys</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '0.75rem', fontWeight: 600 }}>
            <Users size={15} color="#16A34A" />
            <span>Happier Families</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '0.75rem', fontWeight: 600 }}>
            <TrendingUp size={15} color="#F59E0B" />
            <span>Brighter Tomorrows</span>
          </div>
        </div>
      </div>
    </div>
  );
}
