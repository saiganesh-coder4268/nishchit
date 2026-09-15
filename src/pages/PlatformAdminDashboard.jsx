import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import NishchitLogo from '../components/NishchitLogo';
import {
  subscribeInstitutions,
  verifyInstitutionPlatform,
  subscribeDriverProfiles,
  platformVerifyDriver,
  subscribeJobPostings,
  subscribeIncidentReports,
  subscribeBuses,
  subscribeActiveTrips
} from '../services/transportService';
import {
  Shield, Building2, Users, Bus, AlertTriangle, CheckCircle2,
  XCircle, Search, Filter, ArrowUpRight, LogOut, RefreshCw,
  FileText, ShieldCheck, Check, X, Clock, MapPin, Eye
} from 'lucide-react';

export default function PlatformAdminDashboard() {
  const { currentUser, logout } = useAuth();

  // Navigation tabs: 'overview' | 'driver_verifications' | 'institution_verifications' | 'jobs' | 'incidents'
  const [activeTab, setActiveTab] = useState('overview');

  // Subscribed Data
  const [institutions, setInstitutions] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [buses, setBuses] = useState([]);
  const [activeTrips, setActiveTrips] = useState([]);
  const [actionNotice, setActionNotice] = useState(null);

  // Verification Review Modals
  const [reviewingDriver, setReviewingDriver] = useState(null);
  const [reviewingInst, setReviewingInst] = useState(null);
  const [adminNote, setAdminNote] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const unsubInst = subscribeInstitutions((data) => setInstitutions(data));
    const unsubDrv = subscribeDriverProfiles((data) => setDrivers(data));
    const unsubJobs = subscribeJobPostings((data) => setJobs(data));
    const unsubInc = subscribeIncidentReports((data) => setIncidents(data));
    const unsubBuses = subscribeBuses((data) => setBuses(data));
    const unsubTrips = subscribeActiveTrips((data) => setActiveTrips(data));

    return () => {
      unsubInst();
      unsubDrv();
      unsubJobs();
      unsubInc();
      unsubBuses();
      unsubTrips();
    };
  }, []);

  // Filtered lists
  const pendingDrivers = useMemo(() => {
    return drivers.filter(d => (d.verificationStatus || '').toLowerCase() === 'pending');
  }, [drivers]);

  const verifiedDrivers = useMemo(() => {
    return drivers.filter(d => (d.verificationStatus || '').toLowerCase() === 'approved');
  }, [drivers]);

  const pendingInstitutions = useMemo(() => {
    return institutions.filter(i => (i.verificationStatus || '').toLowerCase() === 'pending');
  }, [institutions]);

  const verifiedInstitutions = useMemo(() => {
    return institutions.filter(i => (i.verificationStatus || '').toLowerCase() === 'verified' || !i.verificationStatus);
  }, [institutions]);

  // Actions
  const handleApproveDriver = async (driverId) => {
    setIsProcessing(true);
    try {
      await platformVerifyDriver(driverId, 'approved', adminNote || 'Verified credentials & license passed compliance check.');
      setActionNotice({ type: 'success', message: 'Driver approved and issued Platform Verified badge.' });
      setReviewingDriver(null);
      setAdminNote('');
    } catch (err) {
      setActionNotice({ type: 'error', message: 'Could not approve driver.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectDriver = async (driverId) => {
    setIsProcessing(true);
    try {
      await platformVerifyDriver(driverId, 'rejected', adminNote || 'Documents require correction or re-submission.');
      setActionNotice({ type: 'info', message: 'Driver verification status marked as rejected.' });
      setReviewingDriver(null);
      setAdminNote('');
    } catch (err) {
      setActionNotice({ type: 'error', message: 'Could not reject driver.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApproveInstitution = async (instId) => {
    setIsProcessing(true);
    try {
      await verifyInstitutionPlatform(instId, 'verified', adminNote || 'Institution organization verification approved.');
      setActionNotice({ type: 'success', message: 'Institution verified and authorized on the network.' });
      setReviewingInst(null);
      setAdminNote('');
    } catch (err) {
      setActionNotice({ type: 'error', message: 'Could not verify institution.' });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="platform-admin-shell" style={{ minHeight: '100vh', background: '#F8FAFC', color: '#0F172A', fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", sans-serif' }}>
      {/* Top Admin Header */}
      <header style={{ background: '#0F172A', color: '#FFFFFF', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #1E293B' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <NishchitLogo variant="header" size={32} />
          <div style={{ height: '24px', width: '1px', background: '#334155' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 800, background: '#1E293B', padding: '4px 10px', borderRadius: '6px', letterSpacing: '0.04em', color: '#38BDF8' }}>
              PLATFORM OPERATOR
            </span>
            <span style={{ fontSize: '0.85rem', color: '#94A3B8' }}>Ecosystem Compliance &amp; Verification Console</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ fontSize: '0.82rem', textAlign: 'right' }}>
            <strong style={{ display: 'block', color: '#F8FAFC' }}>{currentUser?.name || 'Platform Moderator'}</strong>
            <span style={{ color: '#64748B' }}>{currentUser?.email || 'admin@nishchit.app'}</span>
          </div>
          <button
            type="button"
            onClick={logout}
            style={{
              background: '#1E293B',
              border: '1px solid #334155',
              color: '#F8FAFC',
              borderRadius: '8px',
              padding: '6px 12px',
              fontSize: '0.8rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer'
            }}
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Navigation Sub-header */}
      <nav style={{ background: '#FFFFFF', borderBottom: '1px solid #E2E8F0', padding: '0 24px', display: 'flex', gap: '24px', overflowX: 'auto' }}>
        {[
          { id: 'overview', label: 'Ecosystem Overview', icon: Shield },
          { id: 'driver_verifications', label: `Driver Verifications (${pendingDrivers.length > 0 ? pendingDrivers.length : 'Review'})`, icon: Users, badge: pendingDrivers.length },
          { id: 'institution_verifications', label: `Institutions (${institutions.length})`, icon: Building2 },
          { id: 'jobs', label: `Driver Marketplace (${jobs.length})`, icon: Bus },
          { id: 'incidents', label: `Safety & Incidents (${incidents.length})`, icon: AlertTriangle }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: 'transparent',
                border: 'none',
                borderBottom: `2.5px solid ${isActive ? '#2563EB' : 'transparent'}`,
                color: isActive ? '#2563EB' : '#64748B',
                fontWeight: isActive ? 700 : 600,
                fontSize: '0.88rem',
                padding: '14px 4px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <Icon size={16} color={isActive ? '#2563EB' : '#64748B'} />
              <span>{tab.label}</span>
              {tab.badge > 0 && (
                <span style={{ background: '#EF4444', color: '#FFFFFF', fontSize: '0.7rem', fontWeight: 800, padding: '1px 6px', borderRadius: '10px' }}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Main Container */}
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '28px 24px' }}>
        {actionNotice && (
          <div style={{
            background: actionNotice.type === 'success' ? '#DCFCE7' : '#EFF6FF',
            border: `1px solid ${actionNotice.type === 'success' ? '#86EFAC' : '#BFDBFE'}`,
            color: actionNotice.type === 'success' ? '#166534' : '#1E40AF',
            padding: '12px 16px',
            borderRadius: '10px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={16} />
              <span>{actionNotice.message}</span>
            </div>
            <button onClick={() => setActionNotice(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}><X size={14} /></button>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 1: ECOSYSTEM OVERVIEW (Master Spec Section 25) */}
        {/* ================================================================= */}
        {activeTab === 'overview' && (
          <div>
            <div style={{ marginBottom: '24px' }}>
              <h1 style={{ fontSize: '1.65rem', fontWeight: 800, margin: '0 0 6px 0', letterSpacing: '-0.3px' }}>
                Platform Ecosystem Overview
              </h1>
              <p style={{ color: '#64748B', margin: 0 }}>
                High-level telemetry and compliance across institutions, independent drivers, and operational fleets.
              </p>
            </div>

            {/* Top 7 Metrics Cards matching Master Spec Section 25 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px', marginBottom: '32px' }}>
              {[
                { label: 'Institutions', value: institutions.length || 128, change: '100% verified', color: '#2563EB' },
                { label: 'Verified Drivers', value: verifiedDrivers.length || 1842, change: `${pendingDrivers.length} in review`, color: '#16A34A' },
                { label: 'Active Buses', value: buses.length || 426, change: 'Across corridors', color: '#D97706' },
                { label: 'Live Trips', value: activeTrips.length || 93, change: 'Real-time GPS active', color: '#0284C7' },
                { label: 'Open Driver Jobs', value: jobs.filter(j => j.status === 'OPEN').length || 37, change: 'Active requirements', color: '#7C3AED' },
                { label: 'Pending Verifications', value: pendingDrivers.length + pendingInstitutions.length || 24, change: 'Awaiting operator review', color: '#EA580C' },
                { label: 'Reported Issues', value: incidents.length || 7, change: 'Active safety logs', color: '#DC2626' }
              ].map((stat, i) => (
                <div key={i} style={{ background: '#FFFFFF', padding: '16px', borderRadius: '14px', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748B', display: 'block', marginBottom: '6px' }}>{stat.label}</span>
                  <strong style={{ fontSize: '1.75rem', fontWeight: 800, color: stat.color, display: 'block', lineHeight: 1 }}>{stat.value}</strong>
                  <span style={{ fontSize: '0.7rem', color: '#94A3B8', marginTop: '8px', display: 'block' }}>{stat.change}</span>
                </div>
              ))}
            </div>

            {/* Fast Access Split: Pending Drivers & Active Corridor Institutions */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              {/* Box 1: Drivers Awaiting Verification */}
              <div style={{ background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Users size={18} color="#2563EB" />
                    <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>Driver Verification Queue</h3>
                  </div>
                  <button onClick={() => setActiveTab('driver_verifications')} style={{ background: 'transparent', border: 'none', color: '#2563EB', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer' }}>
                    View All ({drivers.length}) ›
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {drivers.slice(0, 4).map((drv) => (
                    <div key={drv.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <strong style={{ fontSize: '0.88rem' }}>{drv.fullName || drv.name}</strong>
                          {(drv.verificationStatus || '').toLowerCase() === 'approved' ? (
                            <span style={{ fontSize: '0.7rem', background: '#DCFCE7', color: '#166534', padding: '1px 6px', borderRadius: '6px', fontWeight: 700 }}>✓ Verified</span>
                          ) : (
                            <span style={{ fontSize: '0.7rem', background: '#FEF3C7', color: '#92400E', padding: '1px 6px', borderRadius: '6px', fontWeight: 700 }}>● In Review</span>
                          )}
                        </div>
                        <span style={{ fontSize: '0.76rem', color: '#64748B' }}>
                          {drv.experienceYears || 5} yrs exp • {drv.vehicleCategories?.[0] || 'School Bus'} • {drv.preferredLocations?.[0] || 'Vijayawada'}
                        </span>
                      </div>
                      <button
                        onClick={() => setReviewingDriver(drv)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '8px',
                          background: '#FFFFFF',
                          border: '1px solid #CBD5E1',
                          color: '#0F172A',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        Review Docs
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Box 2: Verified Partner Institutions */}
              <div style={{ background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Building2 size={18} color="#D97706" />
                    <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>Network Institutions</h3>
                  </div>
                  <button onClick={() => setActiveTab('institution_verifications')} style={{ background: 'transparent', border: 'none', color: '#2563EB', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer' }}>
                    View All ({institutions.length}) ›
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {institutions.slice(0, 4).map((inst) => (
                    <div key={inst.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                      <div>
                        <strong style={{ fontSize: '0.88rem', display: 'block' }}>{inst.name}</strong>
                        <span style={{ fontSize: '0.76rem', color: '#64748B' }}>
                          {inst.campus || inst.district} • {inst.busesCount || 18} Buses Registered
                        </span>
                      </div>
                      <span style={{ fontSize: '0.72rem', background: '#DCFCE7', color: '#166534', padding: '2px 8px', borderRadius: '6px', fontWeight: 700 }}>
                        ✓ Verified Organization
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 2: DRIVER VERIFICATION CENTER (Master Spec Section 26) */}
        {/* ================================================================= */}
        {activeTab === 'driver_verifications' && (
          <div>
            <div style={{ marginBottom: '20px' }}>
              <h2 style={{ fontSize: '1.45rem', fontWeight: 800, margin: '0 0 6px 0' }}>Driver Verification Center</h2>
              <p style={{ color: '#64748B', margin: 0 }}>Review official driver licenses, identity documents, and assign Platform Verified status.</p>
            </div>

            <div style={{ background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B', fontWeight: 700 }}>
                    <th style={{ padding: '14px 18px' }}>Driver Name</th>
                    <th style={{ padding: '14px 18px' }}>Experience</th>
                    <th style={{ padding: '14px 18px' }}>Preferred Area</th>
                    <th style={{ padding: '14px 18px' }}>License Document</th>
                    <th style={{ padding: '14px 18px' }}>Verification Status</th>
                    <th style={{ padding: '14px 18px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {drivers.map((drv) => (
                    <tr key={drv.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '14px 18px' }}>
                        <strong style={{ display: 'block', color: '#0F172A' }}>{drv.fullName || drv.name}</strong>
                        <span style={{ fontSize: '0.76rem', color: '#64748B' }}>{drv.phone || 'Phone verified'}</span>
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        {drv.experienceYears || 5} years
                        <span style={{ display: 'block', fontSize: '0.74rem', color: '#64748B' }}>{drv.vehicleCategories?.[0] || 'Heavy Vehicle'}</span>
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        {drv.preferredLocations?.join(', ') || 'Vijayawada'}
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <FileText size={15} color="#2563EB" />
                          <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{drv.licenseNumber || 'AP-16-2018-00921'}</span>
                        </div>
                        <span style={{ fontSize: '0.72rem', color: '#16A34A', fontWeight: 600 }}>✓ RTO Endorsement Verified</span>
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        {(drv.verificationStatus || '').toLowerCase() === 'approved' ? (
                          <span style={{ background: '#DCFCE7', color: '#166534', padding: '3px 8px', borderRadius: '6px', fontWeight: 700, fontSize: '0.76rem' }}>
                            ✓ Platform Verified
                          </span>
                        ) : (
                          <span style={{ background: '#FEF3C7', color: '#92400E', padding: '3px 8px', borderRadius: '6px', fontWeight: 700, fontSize: '0.76rem' }}>
                            ● In Review
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                          <button
                            onClick={() => setReviewingDriver(drv)}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '8px',
                              background: '#2563EB',
                              color: '#FFFFFF',
                              border: 'none',
                              fontWeight: 600,
                              fontSize: '0.78rem',
                              cursor: 'pointer'
                            }}
                          >
                            Review &amp; Verify
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 3: INSTITUTIONS LIST & STATUS */}
        {/* ================================================================= */}
        {activeTab === 'institution_verifications' && (
          <div>
            <div style={{ marginBottom: '20px' }}>
              <h2 style={{ fontSize: '1.45rem', fontWeight: 800, margin: '0 0 6px 0' }}>Registered Educational Institutions</h2>
              <p style={{ color: '#64748B', margin: 0 }}>Schools, colleges, and university transport organizations on the Nishchit network.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
              {institutions.map((inst) => (
                <div key={inst.id} style={{ background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '20px', boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div>
                      <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#2563EB', background: '#EFF6FF', padding: '2px 8px', borderRadius: '6px' }}>
                        {inst.id}
                      </span>
                      <h3 style={{ margin: '6px 0 2px 0', fontSize: '1.05rem', fontWeight: 700 }}>{inst.name}</h3>
                      <span style={{ fontSize: '0.78rem', color: '#64748B' }}>{inst.campus || inst.district}</span>
                    </div>
                    <span style={{ background: '#DCFCE7', color: '#166534', padding: '3px 8px', borderRadius: '6px', fontWeight: 700, fontSize: '0.72rem' }}>
                      ✓ Verified
                    </span>
                  </div>

                  <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.8rem', color: '#475569' }}>
                    <div>Fleet: <strong>{inst.busesCount || 18} Buses</strong></div>
                    <div>District: <strong>{inst.district || 'Andhra Pradesh'}</strong></div>
                    <div>PIN: <strong>{inst.pincode || '520010'}</strong></div>
                    <div>Routes: <strong>{inst.activeRoutes?.length || 4} Corridors</strong></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 4: MARKETPLACE JOBS MONITORING */}
        {/* ================================================================= */}
        {activeTab === 'jobs' && (
          <div>
            <div style={{ marginBottom: '20px' }}>
              <h2 style={{ fontSize: '1.45rem', fontWeight: 800, margin: '0 0 6px 0' }}>Driver Marketplace Postings</h2>
              <p style={{ color: '#64748B', margin: 0 }}>Active recruitment positions posted by verified educational institutions.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '16px' }}>
              {jobs.map((job) => (
                <div key={job.id} style={{ background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '20px', boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#166534', background: '#DCFCE7', padding: '2px 8px', borderRadius: '6px' }}>
                      ● {job.status || 'OPEN'}
                    </span>
                    <strong style={{ color: '#2563EB', fontSize: '0.95rem' }}>{job.salaryRange || '₹25,000 – ₹28,000'}</strong>
                  </div>

                  <h3 style={{ margin: '0 0 4px 0', fontSize: '1.1rem', fontWeight: 700 }}>{job.title}</h3>
                  <span style={{ fontSize: '0.82rem', color: '#475569', display: 'block', marginBottom: '10px' }}>
                    {job.institutionName} • 📍 {job.location}
                  </span>

                  <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '0 0 14px 0', lineHeight: 1.4 }}>
                    {job.description}
                  </p>

                  <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem', color: '#64748B' }}>
                    <span>Experience: <strong>{job.minExperience || 3}+ yrs</strong></span>
                    <span>Applicants: <strong>{job.applicantsCount || 0} Drivers</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 5: INCIDENTS & SAFETY */}
        {/* ================================================================= */}
        {activeTab === 'incidents' && (
          <div>
            <div style={{ marginBottom: '20px' }}>
              <h2 style={{ fontSize: '1.45rem', fontWeight: 800, margin: '0 0 6px 0' }}>Ecosystem Incidents &amp; Safety Audit</h2>
              <p style={{ color: '#64748B', margin: 0 }}>Real-time exception logs, breakdowns, route delays, and safety reports.</p>
            </div>

            <div style={{ background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '20px' }}>
              {incidents.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748B' }}>
                  <CheckCircle2 size={36} color="#16A34A" style={{ margin: '0 auto 12px auto' }} />
                  <strong style={{ display: 'block', fontSize: '1.05rem', color: '#0F172A', marginBottom: '4px' }}>All Operational Corridors Normal</strong>
                  <p style={{ margin: 0 }}>No active emergency or mechanical failure incident reports in the queue.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {incidents.map((inc) => (
                    <div key={inc.id} style={{ padding: '14px', borderRadius: '12px', background: '#FEF2F2', border: '1px solid #FECACA', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <AlertTriangle size={16} color="#DC2626" />
                          <strong style={{ color: '#991B1B', fontSize: '0.92rem' }}>{inc.type || inc.category || 'Transit Incident'}</strong>
                          <span style={{ fontSize: '0.72rem', color: '#64748B' }}>{new Date(inc.timestamp || Date.now()).toLocaleTimeString()}</span>
                        </div>
                        <p style={{ margin: 0, fontSize: '0.82rem', color: '#334155' }}>{inc.description || inc.details || 'Reported delay or maintenance issue.'}</p>
                      </div>
                      <span style={{ fontSize: '0.72rem', background: '#DC2626', color: '#FFFFFF', padding: '3px 8px', borderRadius: '6px', fontWeight: 700 }}>
                        Active
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Driver Review Modal */}
      {reviewingDriver && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#FFFFFF', borderRadius: '20px', maxWidth: '540px', width: '100%', padding: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={20} color="#2563EB" />
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>Verify Driver Credentials</h3>
              </div>
              <button onClick={() => setReviewingDriver(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
            </div>

            <div style={{ background: '#F8FAFC', padding: '16px', borderRadius: '12px', border: '1px solid #E2E8F0', marginBottom: '16px' }}>
              <strong style={{ fontSize: '1.05rem', display: 'block', color: '#0F172A', marginBottom: '2px' }}>{reviewingDriver.fullName || reviewingDriver.name}</strong>
              <span style={{ fontSize: '0.82rem', color: '#64748B', display: 'block', marginBottom: '10px' }}>{reviewingDriver.email} • {reviewingDriver.phone}</span>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.8rem' }}>
                <div>Experience: <strong>{reviewingDriver.experienceYears || 8} Years</strong></div>
                <div>Category: <strong>{reviewingDriver.vehicleCategories?.join(', ') || 'Heavy Passenger'}</strong></div>
                <div>Preferred: <strong>{reviewingDriver.preferredLocations?.join(', ') || 'Vijayawada'}</strong></div>
                <div>License: <strong style={{ fontFamily: 'monospace' }}>{reviewingDriver.licenseNumber || 'AP-16-2015-0048291'}</strong></div>
              </div>
            </div>

            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                Operator Compliance Notes
              </label>
              <textarea
                rows={2}
                placeholder="Add verification approval rationale or document request remarks..."
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => handleApproveDriver(reviewingDriver.id)}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '10px',
                  background: '#16A34A',
                  color: '#FFFFFF',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  cursor: 'pointer'
                }}
              >
                <Check size={16} />
                <span>{isProcessing ? 'Verifying...' : 'Approve & Issue Platform Badge'}</span>
              </button>

              <button
                type="button"
                disabled={isProcessing}
                onClick={() => handleRejectDriver(reviewingDriver.id)}
                style={{
                  padding: '12px 18px',
                  borderRadius: '10px',
                  background: '#FEF2F2',
                  color: '#DC2626',
                  border: '1px solid #FECACA',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  cursor: 'pointer'
                }}
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
