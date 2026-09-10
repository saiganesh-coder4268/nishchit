import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Bus, ShieldCheck, MapPin, CheckCircle2, AlertCircle, 
  Upload, FileText, UserCheck, ArrowRight, ArrowLeft, Building2
} from 'lucide-react';
import { resolvePinCode, REGISTERED_INSTITUTIONS } from '../data/regionData';
import { submitDriverApplication } from '../utils/transportService';

export default function DriverOnboarding() {
  const { currentUser, updateCurrentUserProfile, logout } = useAuth();
  const navigate = useNavigate();

  // Wizard Steps:
  // 1 = Location / PIN Check
  // 2 = Institution / Campus Selection
  // 3 = Driver Profile & KYC Documents
  // 4 = Review Information
  // 5 = Application Submitted / Verification Status
  const initialStep = currentUser?.verificationStatus ? 5 : 1;
  const [step, setStep] = useState(initialStep);

  // Form state
  const [pincode, setPincode] = useState(currentUser?.pincode || '');
  const [pinResult, setPinResult] = useState(() => currentUser?.pincode ? resolvePinCode(currentUser.pincode) : null);
  const [selectedInstitution, setSelectedInstitution] = useState(currentUser?.institutionId || 'INST-MVGR');

  // KYC Fields
  const [fullName, setFullName] = useState(currentUser?.fullName || currentUser?.name || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [licenceNumber, setLicenceNumber] = useState(currentUser?.licenceNumber || '');
  const [licenceValidity, setLicenceValidity] = useState(currentUser?.licenceValidity || '');
  const [idDocumentType, setIdDocumentType] = useState(currentUser?.idDocumentType || 'Aadhaar Card');
  const [idDocumentNumber, setIdDocumentNumber] = useState(currentUser?.idDocumentNumber || '');
  const [idDocValidity] = useState(currentUser?.idDocValidity || 'Permanent');
  const [experienceYears, setExperienceYears] = useState(currentUser?.experienceYears || '5+ Years');

  // Document Previews
  const [photoPreview, setPhotoPreview] = useState(currentUser?.photoUrl || '');
  const [dlPreviewName, setDlPreviewName] = useState(currentUser?.licenceDocUrl || '');
  const [idPreviewName, setIdPreviewName] = useState(currentUser?.idDocUrl || '');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCheckPincode = (e) => {
    e.preventDefault();
    setError('');
    const res = resolvePinCode(pincode);
    setPinResult(res);
    if (!res.success) {
      setError(res.error);
    }
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setPhotoPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleDocUpload = (type, e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (type === 'DL') setDlPreviewName(file.name);
      if (type === 'ID') setIdPreviewName(file.name);
    }
  };

  const handleGoToReview = (e) => {
    e.preventDefault();
    setError('');
    if (!fullName.trim() || !phone.trim() || !licenceNumber.trim() || !licenceValidity.trim() || !idDocumentNumber.trim()) {
      setError('Please complete all required fields before reviewing.');
      return;
    }
    setStep(4);
  };

  const handleSubmitApplication = async () => {
    setError('');
    setLoading(true);

    try {
      const instObj = REGISTERED_INSTITUTIONS.find(i => i.id === selectedInstitution) || REGISTERED_INSTITUTIONS[0];
      const payload = {
        uid: currentUser?.uid || 'DRV-' + Date.now(),
        fullName: fullName.trim(),
        name: fullName.trim(),
        phone: phone.trim(),
        email: currentUser?.email || 'driver@nishchit.app',
        pincode,
        locality: pinResult?.locality || 'Vizianagaram City',
        district: pinResult?.district || 'Vizianagaram',
        institutionId: instObj.id,
        institutionName: instObj.name,
        photoUrl: photoPreview,
        licenceNumber: licenceNumber.trim(),
        licenceValidity,
        licenceDocUrl: dlPreviewName,
        idDocumentType,
        idDocumentNumber: idDocumentNumber.trim(),
        idDocValidity,
        idDocUrl: idPreviewName,
        experienceYears,
        verificationStatus: 'pending',
        status: 'pending'
      };

      await submitDriverApplication(payload);
      await updateCurrentUserProfile(payload);
      setStep(5);
    } catch (err) {
      setError(err?.message || 'Failed to submit driver verification application.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="onboarding-page">
      <div className="onboarding-container">
        
        {/* Wizard Progress Bar */}
        <div className="wizard-progress">
          <div className={`step-dot ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
            <span>1</span>
            <label>Territory</label>
          </div>
          <div className="step-connector"></div>
          <div className={`step-dot ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
            <span>2</span>
            <label>Institution</label>
          </div>
          <div className="step-connector"></div>
          <div className={`step-dot ${step >= 3 ? 'active' : ''} ${step > 3 ? 'completed' : ''}`}>
            <span>3</span>
            <label>Credentials</label>
          </div>
          <div className="step-connector"></div>
          <div className={`step-dot ${step >= 4 ? 'active' : ''} ${step > 4 ? 'completed' : ''}`}>
            <span>4</span>
            <label>Review</label>
          </div>
          <div className="step-connector"></div>
          <div className={`step-dot ${step >= 5 ? 'active' : ''}`}>
            <span>5</span>
            <label>Status</label>
          </div>
        </div>

        {error && (
          <div className="auth-error-banner" style={{ marginBottom: '20px' }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* STEP 1: PIN CODE SERVICE AREA CHECK */}
        {step === 1 && (
          <div className="onboarding-card">
            <div className="card-header">
              <div className="icon-badge"><MapPin size={22} color="#2563eb" /></div>
              <div>
                <h2>Driver Operating Territory Check</h2>
                <p>Enter your 6-digit postal PIN code to verify service coverage in the Andhra Pradesh corridor.</p>
              </div>
            </div>

            <form onSubmit={handleCheckPincode} className="pincode-form">
              <div className="form-group">
                <label>Postal PIN Code (Andhra Pradesh)</label>
                <div className="pincode-input-row">
                  <input
                    type="text"
                    maxLength={6}
                    required
                    placeholder="e.g. 535002, 531162, 530016"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                  />
                  <button type="submit" className="btn btn-primary">
                    Verify Area
                  </button>
                </div>
              </div>
            </form>

            {pinResult && pinResult.success && pinResult.available && (
              <div className="pincode-result-box active">
                <div className="result-header">
                  <CheckCircle2 size={20} color="#16a34a" />
                  <strong>Service Available in Your Locality!</strong>
                </div>
                <div className="result-details">
                  <p><strong>Locality:</strong> {pinResult.locality}</p>
                  <p><strong>District:</strong> {pinResult.district}, {pinResult.state}</p>
                  <p><strong>Corridor:</strong> {pinResult.corridorZone}</p>
                </div>
                <div className="action-row">
                  <button 
                    type="button" 
                    onClick={() => setStep(2)}
                    className="btn btn-primary"
                  >
                    Continue to Institution Selection <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {pinResult && pinResult.success && !pinResult.available && (
              <div className="pincode-unavailable-box">
                <div className="unavailable-icon"><Building2 size={36} color="#d97706" /></div>
                <h3>We are not currently active in PIN {pincode}</h3>
                <p>
                  Nishchit is currently active across the <strong>Vizianagaram – Thagarapuvalasa – Visakhapatnam</strong> educational corridor.
                </p>
                <div className="supported-districts-list">
                  <span>Supported Corridor Hubs:</span>
                  <ul>
                    <li>Vizianagaram (535001 - 535280, Chintalavalasa, Cantonment)</li>
                    <li>Thagarapuvalasa / Bheemili / Anandapuram (531162, 531163)</li>
                    <li>Visakhapatnam (530001 - 530052, Madhurawada, Rushikonda, MVP)</li>
                  </ul>
                </div>
                <div className="action-row">
                  <button 
                    type="button" 
                    onClick={() => setPincode('535002')}
                    className="btn btn-outline"
                  >
                    Try Corridor PIN (e.g. 535002 - Vizianagaram)
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: SELECT CAMPUS / INSTITUTION */}
        {step === 2 && (
          <div className="onboarding-card">
            <div className="card-header">
              <div className="icon-badge"><Building2 size={22} color="#2563eb" /></div>
              <div>
                <h2>Select Your School / College / Campus</h2>
                <p>Choose the registered educational institution in the corridor you are driving for.</p>
              </div>
            </div>

            <div className="institution-select-grid">
              {REGISTERED_INSTITUTIONS.map((inst) => (
                <div 
                  key={inst.id}
                  className={`institution-card-choice ${selectedInstitution === inst.id ? 'selected' : ''}`}
                  onClick={() => setSelectedInstitution(inst.id)}
                >
                  <div className="inst-radio">
                    <input 
                      type="radio" 
                      name="institution" 
                      checked={selectedInstitution === inst.id} 
                      onChange={() => setSelectedInstitution(inst.id)} 
                    />
                  </div>
                  <div className="inst-info">
                    <h4>{inst.name}</h4>
                    <p className="inst-campus">{inst.campus}</p>
                    <div className="inst-meta">
                      <span className="badge-chip">{inst.district}</span>
                      <span className="badge-chip-fleet">{inst.busesCount} Authorized Buses</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="wizard-btn-row">
              <button type="button" onClick={() => setStep(1)} className="btn btn-outline">
                <ArrowLeft size={16} /> Back
              </button>
              <button type="button" onClick={() => setStep(3)} className="btn btn-primary">
                Proceed to Driver KYC & Documents <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: OFFICIAL DRIVER PROFILE & KYC */}
        {step === 3 && (
          <div className="onboarding-card">
            <div className="card-header">
              <div className="icon-badge"><ShieldCheck size={22} color="#2563eb" /></div>
              <div>
                <h2>Driver Profile & Government Documents</h2>
                <p>Submit official credentials for institution transport desk verification.</p>
              </div>
            </div>

            <form onSubmit={handleSubmitApplication} className="kyc-form">
              
              {/* Photo Upload Section */}
              <div className="passport-photo-section">
                <div className="photo-preview-box">
                  {photoPreview ? (
                    <img src={photoPreview} alt="Driver Passport Photo" className="passport-img" />
                  ) : (
                    <div className="photo-placeholder">
                      <UserCheck size={32} color="#94a3b8" />
                      <span>Passport Photo</span>
                    </div>
                  )}
                </div>
                <div className="photo-upload-controls">
                  <label className="btn btn-sm btn-outline">
                    <Upload size={14} /> Upload Passport-Size Photo
                    <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display: 'none' }} />
                  </label>
                  <span className="helper-text">Official passport-size portrait (White / plain background).</span>
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label>Full Legal Name (as on Driving Licence)</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Registered Mobile Number</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>

              {/* Driving Licence Box */}
              <div className="document-box">
                <div className="doc-box-header">
                  <FileText size={18} color="#2563eb" />
                  <strong>Driving Licence (Commercial / Transport)</strong>
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label>Driving Licence (DL) Number</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. AP-35-20180004921"
                      value={licenceNumber}
                      onChange={(e) => setLicenceNumber(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>Licence Validity / Expiry Date</label>
                    <input
                      type="date"
                      required
                      value={licenceValidity}
                      onChange={(e) => setLicenceValidity(e.target.value)}
                    />
                  </div>
                </div>

                <div className="doc-upload-row">
                  <label className="btn btn-sm btn-outline">
                    <Upload size={14} /> Upload DL Document
                    <input type="file" onChange={(e) => handleDocUpload('DL', e)} style={{ display: 'none' }} />
                  </label>
                  <span className="file-name-preview">{dlPreviewName}</span>
                </div>
              </div>

              {/* Aadhaar / Passport Document Box */}
              <div className="document-box">
                <div className="doc-box-header">
                  <ShieldCheck size={18} color="#059669" />
                  <strong>National Identity Document (Showcase Verification)</strong>
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label>Identity Proof Type</label>
                    <select value={idDocumentType} onChange={(e) => setIdDocumentType(e.target.value)}>
                      <option value="Aadhaar Card">Aadhaar Card (UIDAI)</option>
                      <option value="Passport">Indian Passport</option>
                      <option value="Voter ID">Voter ID Card</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>{idDocumentType} Number</label>
                    <input
                      type="text"
                      required
                      placeholder={idDocumentType === 'Aadhaar Card' ? 'XXXX XXXX XXXX' : 'Document Number'}
                      value={idDocumentNumber}
                      onChange={(e) => setIdDocumentNumber(e.target.value)}
                    />
                  </div>
                </div>

                <div className="doc-upload-row">
                  <label className="btn btn-sm btn-outline">
                    <Upload size={14} /> Upload {idDocumentType} Document
                    <input type="file" onChange={(e) => handleDocUpload('ID', e)} style={{ display: 'none' }} />
                  </label>
                  <span className="file-name-preview">{idPreviewName}</span>
                </div>
              </div>

              <div className="form-group">
                <label>Commercial Heavy Vehicle Driving Experience</label>
                <input
                  type="text"
                  required
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(e.target.value)}
                />
              </div>

              <div className="wizard-btn-row">
                <button type="button" onClick={() => setStep(2)} className="btn btn-outline">
                  <ArrowLeft size={16} /> Back
                </button>
                <button type="button" onClick={handleGoToReview} className="btn btn-primary">
                  Review Information <ArrowRight size={16} />
                </button>
              </div>
            </form>
          </div>
        )}

        {/* STEP 4: REVIEW INFORMATION BEFORE SUBMISSION */}
        {step === 4 && (
          <div className="onboarding-card">
            <div className="card-header">
              <div className="icon-badge"><FileText size={22} color="#2563eb" /></div>
              <div>
                <h2>Review Your Application Details</h2>
                <p>Please ensure all credentials match your official transport documents before submitting.</p>
              </div>
            </div>

            <div className="review-summary-container" style={{ display: 'flex', flexDirection: 'column', gap: '16px', margin: '20px 0' }}>
              <div style={{ display: 'flex', gap: '20px', alignItems: 'center', padding: '16px', background: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '8px', overflow: 'hidden', background: '#E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {photoPreview ? (
                    <img src={photoPreview} alt="Driver" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <UserCheck size={36} color="#94A3B8" />
                  )}
                </div>
                <div>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: '1.2rem', color: '#0F172A' }}>{fullName}</h3>
                  <p style={{ margin: '0 0 4px 0', color: '#64748B', fontSize: '0.9rem' }}>Phone: <strong>{phone}</strong></p>
                  <p style={{ margin: 0, color: '#64748B', fontSize: '0.9rem' }}>Email: <strong>{currentUser?.email || 'driver@nishchit.app'}</strong></p>
                </div>
              </div>

              <div className="submitted-summary-card" style={{ marginTop: 0 }}>
                <div className="summary-row">
                  <span>Operating Territory:</span>
                  <strong>{pinResult?.locality || 'Vizianagaram Corridor'} (PIN {pincode})</strong>
                </div>
                <div className="summary-row">
                  <span>Institution:</span>
                  <strong>{REGISTERED_INSTITUTIONS.find(i => i.id === selectedInstitution)?.name || 'MVGR College of Engineering'}</strong>
                </div>
                <div className="summary-row">
                  <span>Commercial Licence (DL):</span>
                  <code>{licenceNumber} (Valid till {licenceValidity})</code>
                </div>
                <div className="summary-row">
                  <span>National Identity:</span>
                  <strong>{idDocumentType} — {idDocumentNumber.slice(0, 4)} XXXX {idDocumentNumber.slice(-4) || 'XXXX'}</strong>
                </div>
                <div className="summary-row">
                  <span>Heavy Vehicle Experience:</span>
                  <strong>{experienceYears}</strong>
                </div>
              </div>

              <div style={{ padding: '16px', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '8px', color: '#1E40AF', fontSize: '0.9rem', lineHeight: '1.5' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, marginBottom: '4px' }}>
                  <ShieldCheck size={16} /> Official Verification Notice
                </div>
                Your application will be submitted to the Institution Transport Desk. Your transport administrator must review and approve your account before you can operate a vehicle.
              </div>
            </div>

            <div className="wizard-btn-row">
              <button type="button" onClick={() => setStep(3)} className="btn btn-outline" disabled={loading}>
                <ArrowLeft size={16} /> Edit Details
              </button>
              <button type="button" onClick={handleSubmitApplication} disabled={loading} className="btn btn-primary">
                {loading ? 'Submitting Application...' : 'Submit Verification Application'}
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: VERIFICATION APPLICATION STATUS */}
        {step === 5 && (
          <div className="onboarding-card verification-status-card">
            <div className="status-hero-icon">
              {currentUser?.verificationStatus === 'approved' ? (
                <div className="icon-approved"><CheckCircle2 size={56} color="#16a34a" /></div>
              ) : currentUser?.verificationStatus === 'rejected' ? (
                <div className="icon-rejected"><AlertCircle size={56} color="#dc2626" /></div>
              ) : (
                <div className="icon-pending"><ShieldCheck size={56} color="#2563eb" /></div>
              )}
            </div>

            <h2>
              {currentUser?.verificationStatus === 'approved'
                ? 'Driver Authorization Approved!'
                : currentUser?.verificationStatus === 'rejected'
                ? 'Verification Declined'
                : 'Application Submitted for Verification'}
            </h2>

            <p className="status-desc" style={{ fontSize: '1rem', lineHeight: '1.6' }}>
              {currentUser?.verificationStatus === 'approved'
                ? `Your credentials have been verified by the Transport Administration. Assigned to ${currentUser?.busNumber || currentUser?.busId || 'Fleet Vehicle'} on ${currentUser?.routeName || currentUser?.routeId || 'Route'}.`
                : currentUser?.verificationStatus === 'rejected'
                ? (currentUser?.rejectionReason ? `Decline reason: "${currentUser.rejectionReason}". Please review and update your documents.` : 'Your application was not approved by transport administration.')
                : 'Your application has been submitted for verification. Your transport administrator must approve your account before you can operate a vehicle.'}
            </p>

            <div className="submitted-summary-card">
              <div className="summary-row">
                <span>Driver Name:</span>
                <strong>{fullName || currentUser?.name || 'Driver Applicant'}</strong>
              </div>
              <div className="summary-row">
                <span>Institution:</span>
                <strong>{currentUser?.institutionName || REGISTERED_INSTITUTIONS.find(i => i.id === selectedInstitution)?.name || 'Corridor Institution'}</strong>
              </div>
              <div className="summary-row">
                <span>Licence No:</span>
                <code>{licenceNumber || currentUser?.licenceNumber || 'Commercial DL'} {licenceValidity ? `(Valid till ${licenceValidity})` : ''}</code>
              </div>
              <div className="summary-row">
                <span>Verification Status:</span>
                <strong style={{ 
                  color: currentUser?.verificationStatus === 'approved' ? '#16A34A' : currentUser?.verificationStatus === 'rejected' ? '#DC2626' : '#2563EB',
                  textTransform: 'uppercase'
                }}>
                  {currentUser?.verificationStatus || 'PENDING VERIFICATION'}
                </strong>
              </div>
              <div className="summary-row">
                <span>Assigned Fleet:</span>
                <strong>{currentUser?.busNumber || currentUser?.busId || (currentUser?.verificationStatus === 'approved' ? 'Assigned' : 'Awaiting Admin Approval')}</strong>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="status-action-box">
              {currentUser?.verificationStatus === 'approved' ? (
                <button 
                  type="button" 
                  onClick={() => navigate('/driver/dashboard')} 
                  className="btn btn-primary btn-full btn-hero"
                >
                  <Bus size={18} /> Enter Driver Operational Cockpit
                </button>
              ) : currentUser?.verificationStatus === 'rejected' ? (
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="btn btn-outline btn-full"
                >
                  Review &amp; Resubmit Documents
                </button>
              ) : (
                <div>
                  <div className="verification-awaiting" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                    <ShieldCheck size={24} color="#2563EB" />
                    <div>
                      <strong style={{ display: 'block', color: '#0F172A' }}>Application Status: PENDING VERIFICATION</strong>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748B' }}>Awaiting review by the Transport Controller in Admin Desk. Once approved, vehicle and route will be assigned.</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={async () => {
                      await logout();
                      navigate('/', { replace: true });
                    }}
                    className="btn btn-outline btn-full"
                    style={{ marginTop: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                  >
                    Sign Out &amp; Exit Session
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

