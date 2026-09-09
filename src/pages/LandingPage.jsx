import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Bus, MapPin, ShieldCheck, Building2 } from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();
  return <div className="landing-page premium-landing">
    <section className="landing-hero">
      <div className="eyebrow"><MapPin size={15}/> Vizianagaram · Thagarapuvalasa · Visakhapatnam</div>
      <h1>NISHCHIT</h1>
      <p className="landing-kicker">School &amp; college transportation</p>
      <h2>Certainty for every parent.</h2>
      <p className="landing-copy">A calm, accountable connection between the people who manage transport, the drivers who operate it, and the families who depend on it.</p>
      <div className="landing-actions"><button className="btn btn-primary" onClick={() => navigate('/parent/login')}>Parent sign in <ArrowRight size={17}/></button><button className="btn btn-outline" onClick={() => navigate('/driver/login')}>Driver sign in</button></div>
    </section>
    <section className="certainty-flow" aria-label="How Nishchit works">
      <div><Building2 size={22}/><strong>Institution</strong><span>sets routes, schedules and assignments</span></div><ArrowRight className="flow-arrow"/><div><Bus size={22}/><strong>Driver</strong><span>shares only authorized, real device location</span></div><ArrowRight className="flow-arrow"/><div><MapPin size={22}/><strong>Parent</strong><span>sees an honest trip status and latest update</span></div>
    </section>
    <section className="landing-detail"><div><span className="section-label">Built for the daily run</span><h3>Operational clarity, without the noise.</h3></div><p>Drivers see their next assignment. Transport teams manage approvals and schedules. Parents get the information they need, when it is available—never a simulated location or invented ETA.</p><button className="text-action" onClick={() => navigate('/admin/login')}><ShieldCheck size={17}/> Transport administration <ArrowRight size={16}/></button></section>
  </div>;
}
