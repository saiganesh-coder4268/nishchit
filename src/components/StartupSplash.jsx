import React, { useState, useEffect, useRef } from 'react';

const INTRO_STORAGE_KEY = 'nishchit_intro_seen';

/**
 * StartupSplash Component
 * 
 * Faithfully implements the First Entry Animation:
 * - FRAME 1 (0.0s - 1.2s):
 *   Warm off-white background, subtle Nishchit route pattern.
 *   Real Nishchit logo appears large and centered (opacity 0 -> 1, subtle scale 0.96 -> 1, soft ease).
 * 
 * - FRAME 2 (1.2s - 2.2s):
 *   The SAME continuous logo glides responsively toward the exact layout position of the header logo
 *   and shrinks to its target dimensions.
 * 
 * - FRAME 3 (1.8s - 2.6s):
 *   The underlying interface reveals itself (opacity 0 -> 1, translate upward, scale 0.98 -> 1).
 * 
 * - FINAL STATE (2.8s):
 *   Animation unmounts, leaves interactive real page, sets localStorage 'nishchit_intro_seen'.
 * 
 * - RETURNING VISIT:
 *   Only a soft 0.4s fade; never replays full animation.
 */
export default function StartupSplash({ onComplete }) {
  const isFirstVisit = !localStorage.getItem(INTRO_STORAGE_KEY);

  const [active, setActive] = useState(true);
  const [phase, setPhase] = useState(isFirstVisit ? 'frame1' : 'returning');
  const [destRect, setDestRect] = useState(null);
  const [logoReady, setLogoReady] = useState(false);
  const logoRef = useRef(null);

  useEffect(() => {
    // If returning user, trigger quick fade and complete
    if (!isFirstVisit) {
      const t = setTimeout(() => {
        setActive(false);
        if (onComplete) onComplete();
      }, 400);
      return () => clearTimeout(t);
    }

    // Trigger Frame 1 entrance animation
    const tStart = setTimeout(() => {
      setLogoReady(true);
    }, 40);

    // FIRST VISIT:
    // Measure responsive header logo target position
    const measureTarget = () => {
      const targetEl =
        document.querySelector('.hero-media-top-brand img') ||
        document.querySelector('.auth-media-top-brand img') ||
        document.querySelector('.public-navbar-container img') ||
        document.querySelector('.auth-shell-header-container img');

      if (targetEl) {
        const r = targetEl.getBoundingClientRect();
        if (r.width > 0 && r.height > 0) {
          setDestRect({
            top: r.top,
            left: r.left,
            width: r.width,
            height: r.height
          });
          return;
        }
      }
      // Responsive fallback if target element not yet in DOM
      const isMobile = window.innerWidth < 1024;
      setDestRect({
        top: isMobile ? 18 : 28,
        left: isMobile ? 20 : 36,
        width: isMobile ? 120 : 160,
        height: isMobile ? 32 : 38
      });
    };

    measureTarget();
    window.addEventListener('resize', measureTarget);

    // Frame 1 -> Frame 2: Begin continuous glide toward header (1.2s)
    const tFrame2 = setTimeout(() => {
      measureTarget();
      setPhase('frame2');
    }, 1200);

    // Frame 2 -> Frame 3: Reveal interface underneath (1.8s)
    const tFrame3 = setTimeout(() => {
      setPhase('frame3');
    }, 1800);

    // Final State: Unmount animation, save localStorage (2.8s)
    const tDone = setTimeout(() => {
      try {
        localStorage.setItem(INTRO_STORAGE_KEY, 'true');
      } catch (e) {
        console.warn('Could not save intro seen:', e);
      }
      setPhase('final');
      setActive(false);
      if (onComplete) onComplete();
    }, 2800);

    return () => {
      window.removeEventListener('resize', measureTarget);
      clearTimeout(tStart);
      clearTimeout(tFrame2);
      clearTimeout(tFrame3);
      clearTimeout(tDone);
    };
  }, [isFirstVisit, onComplete]);

  if (!active) return null;

  // Returning visit: gentle quick veil
  if (!isFirstVisit) {
    return (
      <div
        className="nishchit-intro-returning-fade"
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: '#FFFFFF',
          zIndex: 99999,
          pointerEvents: 'none',
          opacity: 0,
          transition: 'opacity 400ms ease-out'
        }}
      />
    );
  }

  // FIRST VISIT: Pure Native React / CSS Animation
  // Center coordinates vs Destination coordinates
  const isCentered = phase === 'frame1';
  const logoWidth = isCentered ? Math.min(window.innerWidth * 0.75, 320) : (destRect?.width || 160);
  const logoHeight = isCentered ? (logoWidth * 341) / 1024 : (destRect?.height || 38);

  const currentTop = isCentered ? (window.innerHeight / 2 - logoHeight / 2) : (destRect?.top || 28);
  const currentLeft = isCentered ? (window.innerWidth / 2 - logoWidth / 2) : (destRect?.left || 36);

  return (
    <div
      className="nishchit-native-intro-stage"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        backgroundColor: '#F8FAFC',
        pointerEvents: phase === 'frame3' || phase === 'final' ? 'none' : 'all',
        opacity: phase === 'frame3' || phase === 'final' ? 0 : 1,
        transition: 'opacity 750ms cubic-bezier(0.16, 1, 0.3, 1)',
        overflow: 'hidden'
      }}
    >
      {/* Background: Authentic Nishchit Transportation Route Pattern */}
      <div
        className="nishchit-pattern-bg"
        style={{
          position: 'absolute',
          inset: 0,
          opacity: isCentered ? 0.05 : 0.02,
          transition: 'opacity 1s ease',
          pointerEvents: 'none'
        }}
      />

      {/* The ONE Continuous Physical Logo Asset */}
      <div
        ref={logoRef}
        style={{
          position: 'fixed',
          top: `${currentTop}px`,
          left: `${currentLeft}px`,
          width: `${logoWidth}px`,
          height: `${logoHeight}px`,
          zIndex: 100000,
          transition: isCentered
            ? 'opacity 650ms cubic-bezier(0.16, 1, 0.3, 1), transform 650ms cubic-bezier(0.16, 1, 0.3, 1)'
            : 'top 1050ms cubic-bezier(0.16, 1, 0.3, 1), left 1050ms cubic-bezier(0.16, 1, 0.3, 1), width 1050ms cubic-bezier(0.16, 1, 0.3, 1), height 1050ms cubic-bezier(0.16, 1, 0.3, 1)',
          opacity: isCentered ? (logoReady ? 1 : 0) : 1,
          transform: isCentered ? (logoReady ? 'scale(1)' : 'scale(0.96)') : 'none',
          pointerEvents: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <img
          src="/nishchit-logo.png"
          alt="Nishchit — Certainty for every parent"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            display: 'block'
          }}
        />
      </div>
    </div>
  );
}
