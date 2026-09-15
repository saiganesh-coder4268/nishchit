import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import ParentShell from '../components/shells/ParentShell';
import { subscribeParentStudents, saveStudentAssociation } from '../services/transportService';
import { REGISTERED_INSTITUTIONS } from '../data/regionData';
import { User, Users, Plus, Building2, MapPin, CheckCircle2, ShieldCheck, Mail, Phone } from 'lucide-react';

export default function ParentProfilePage() {
  const { currentUser, updateCurrentUserProfile } = useAuth();
  const [students, setStudents] = useState([]);
  const [showAddChildModal, setShowAddChildModal] = useState(false);

  // Form states
  const [childName, setChildName] = useState('');
  const [childRoll, setChildRoll] = useState('');
  const [childClass, setChildClass] = useState('');
  const [institutionId, setInstitutionId] = useState(currentUser?.institutionId || 'INST-GITAM');
  const [stopName, setStopName] = useState(currentUser?.stopName || 'MVP Colony');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (currentUser?.uid || currentUser?.email) {
      const unsub = subscribeParentStudents(currentUser.uid, currentUser.email, setStudents);
      return () => unsub();
    }
  }, [currentUser]);

  const handleAddChild = async (e) => {
    e.preventDefault();
    if (!childName.trim() || !childRoll.trim()) return;

    setSaving(true);
    try {
      const inst = REGISTERED_INSTITUTIONS.find(i => i.id === institutionId) || REGISTERED_INSTITUTIONS[0];
      await saveStudentAssociation({
        parentId: currentUser.uid,
        parentEmail: currentUser.email,
        parentName: currentUser.name || currentUser.fullName || 'Parent',
        name: childName.trim(),
        rollNo: childRoll.trim(),
        studentClass: childClass.trim(),
        institutionId,
        institutionName: inst.name,
        stopName: stopName.trim()
      });

      setChildName('');
      setChildRoll('');
      setChildClass('');
      setShowAddChildModal(false);
    } catch (err) {
      console.error('Add child error:', err);
    } finally {
      setSaving(false);
    }
  };

  const activeInstitutions = REGISTERED_INSTITUTIONS.filter(i => i.status === 'ACTIVE');

  return (
    <ParentShell activeTab="child">
      <div style={{ maxWidth: '840px', margin: '0 auto', padding: '24px 16px 80px' }}>
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <User size={22} color="#2563EB" />
            Parent Account &amp; Registered Students
          </h1>
          <p style={{ fontSize: '0.9rem', color: '#64748B', margin: '4px 0 0' }}>
            Manage guardian contact credentials and enrolled student transit links.
          </p>
        </div>

        {/* Parent Details Card */}
        <div style={{ background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '24px', marginBottom: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.4rem' }}>
              {(currentUser?.name || currentUser?.fullName || 'P').charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  {currentUser?.fullName || currentUser?.name || 'Verified Guardian'}
                </h2>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#DCFCE7', color: '#16A34A', padding: '2px 8px', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 800 }}>
                  <ShieldCheck size={13} /> Active Parent
                </span>
              </div>
              <div style={{ fontSize: '0.85rem', color: '#64748B', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <Mail size={13} /> {currentUser?.email || 'parent@nishchit.app'}
                </span>
                {currentUser?.phone && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <Phone size={13} /> {currentUser.phone}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Registered Children Section */}
        <div style={{ background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={20} color="#2563EB" />
                Linked Children ({students.length})
              </h2>
              <p style={{ fontSize: '0.82rem', color: '#64748B', margin: '2px 0 0' }}>
                Each child is mapped to an authorized institution bus route &amp; stop.
              </p>
            </div>

            <button
              onClick={() => setShowAddChildModal(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: '#2563EB',
                color: '#FFFFFF',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.86rem',
                cursor: 'pointer'
              }}
            >
              <Plus size={16} />
              <span>Add Child</span>
            </button>
          </div>

          {/* Children Cards List */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            {students.length > 0 ? (
              students.map((stu) => (
                <div
                  key={stu.id}
                  style={{
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    borderRadius: '12px',
                    padding: '16px 18px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                      {stu.name}
                    </h3>
                    <span style={{ fontSize: '0.74rem', background: '#FFFFFF', border: '1px solid #CBD5E1', padding: '2px 6px', borderRadius: '4px', fontWeight: 700, color: '#475569' }}>
                      {stu.rollNo}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.84rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Building2 size={14} color="#64748B" />
                      <span>{stu.institutionName || 'Authorized Campus'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <MapPin size={14} color="#2563EB" />
                      <span>Stop: <strong>{stu.stopName || 'Designated Stop'}</strong></span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ padding: '24px', textAlign: 'center', color: '#64748B', background: '#F8FAFC', borderRadius: '12px' }}>
                No additional children linked yet. Click <strong>Add Child</strong> to link another student.
              </div>
            )}
          </div>
        </div>

        {/* Add Child Modal */}
        {showAddChildModal && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(15, 23, 42, 0.6)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
              zIndex: 2000
            }}
          >
            <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '480px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', marginBottom: '16px' }}>
                Link Student Transit Profile
              </h2>

              <form onSubmit={handleAddChild}>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Student Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={childName}
                    onChange={(e) => setChildName(e.target.value)}
                    placeholder="e.g. Aarav Varma"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                      Roll / Student ID
                    </label>
                    <input
                      type="text"
                      required
                      value={childRoll}
                      onChange={(e) => setChildRoll(e.target.value)}
                      placeholder="e.g. 22331A0589"
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                      Class / Branch
                    </label>
                    <input
                      type="text"
                      value={childClass}
                      onChange={(e) => setChildClass(e.target.value)}
                      placeholder="e.g. B.Tech 3rd Yr"
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Registered Institution (Must be ACTIVE)
                  </label>
                  <select
                    value={institutionId}
                    onChange={(e) => setInstitutionId(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
                  >
                    {activeInstitutions.map((i) => (
                      <option key={i.id} value={i.id}>{i.name} ({i.campus || i.district})</option>
                    ))}
                  </select>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Drop-off / Boarding Stop Name
                  </label>
                  <input
                    type="text"
                    required
                    value={stopName}
                    onChange={(e) => setStopName(e.target.value)}
                    placeholder="e.g. MVP Colony / Madhurawada"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setShowAddChildModal(false)}
                    style={{ padding: '8px 16px', borderRadius: '8px', background: '#F1F5F9', border: 'none', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    style={{ padding: '8px 20px', borderRadius: '8px', background: '#2563EB', color: '#FFFFFF', border: 'none', fontWeight: 700, cursor: 'pointer' }}
                  >
                    {saving ? 'Linking...' : 'Link Child'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </ParentShell>
  );
}
