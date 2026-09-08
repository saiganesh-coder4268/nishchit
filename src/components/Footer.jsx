import React from 'react';
import { ShieldCheck, Navigation, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-info">
          <div className="footer-brand">
            <strong>NISHCHIT</strong> — Live Transport Certainty Platform
          </div>
          <p className="footer-desc">
            Direct Driver-to-Parent visibility for school & junior-college buses. No student phone required.
          </p>
        </div>
        <div className="footer-meta">
          <span className="tech-badge">
            <MapPin size={14} /> Google Maps API
          </span>
          <span className="tech-badge">
            <ShieldCheck size={14} /> Firebase Auth & Realtime DB
          </span>
        </div>
      </div>
    </footer>
  );
}
