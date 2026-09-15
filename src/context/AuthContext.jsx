import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut
} from 'firebase/auth';
import { auth } from '../firebase';
import {
  getUserProfile,
  saveUserProfile,
  subscribeUserProfile,
  getDriverProfile,
  getParentStudentTransport
} from '../services/transportService';
import { REGISTERED_INSTITUTIONS, INITIAL_VERIFIED_DRIVERS } from '../data/regionData';

const USER_SESSION_STORAGE_KEY = 'nishchit_user_session';
const ADMIN_SESSION_STORAGE_KEY = 'nishchit_admin_session';
const PARENT_SESSION_STORAGE_KEY = 'nishchit_parent_session';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem(USER_SESSION_STORAGE_KEY);
      if (savedUser) {
        return JSON.parse(savedUser);
      }
      const savedAdmin = localStorage.getItem(ADMIN_SESSION_STORAGE_KEY);
      if (savedAdmin) {
        return JSON.parse(savedAdmin);
      }
      const savedParent = localStorage.getItem(PARENT_SESSION_STORAGE_KEY);
      if (savedParent) {
        return JSON.parse(savedParent);
      }
    } catch {
      // Ignore
    }
    return null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubProfile = () => {};

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      // Preserve explicit manual/demo sessions for role evaluation
      try {
        const savedUser = localStorage.getItem(USER_SESSION_STORAGE_KEY);
        if (savedUser) {
          const parsed = JSON.parse(savedUser);
          if (parsed && parsed.role) {
            setCurrentUser(parsed);
            setLoading(false);
            return;
          }
        }
        const savedAdmin = localStorage.getItem(ADMIN_SESSION_STORAGE_KEY);
        if (savedAdmin) {
          const parsed = JSON.parse(savedAdmin);
          if (parsed && (parsed.role === 'admin' || parsed.role === 'institution' || parsed.role === 'platform_admin')) {
            setCurrentUser(parsed);
            setLoading(false);
            return;
          }
        }
        const savedParent = localStorage.getItem(PARENT_SESSION_STORAGE_KEY);
        if (savedParent) {
          const parsed = JSON.parse(savedParent);
          if (parsed && parsed.role === 'parent') {
            setCurrentUser(parsed);
            setLoading(false);
            return;
          }
        }
      } catch {
        // Ignore
      }

      unsubProfile();

      if (!firebaseUser) {
        setCurrentUser((prev) => (prev?.role ? prev : null));
        setLoading(false);
        return;
      }

      try {
        // Real-time synchronization with user document in Firestore
        unsubProfile = subscribeUserProfile(firebaseUser.uid, async (profile) => {
          if (profile) {
            if (profile.role === 'driver') {
              const driverData = await getDriverProfile(firebaseUser.uid);
              setCurrentUser({
                ...profile,
                ...(driverData || {}),
                uid: firebaseUser.uid,
                email: firebaseUser.email || profile.email
              });
            } else if (profile.role === 'parent') {
              const studentData = await getParentStudentTransport(firebaseUser.uid);
              setCurrentUser({
                ...profile,
                ...(studentData || {}),
                uid: firebaseUser.uid,
                email: firebaseUser.email || profile.email
              });
            } else {
              setCurrentUser({
                ...profile,
                uid: firebaseUser.uid,
                email: firebaseUser.email || profile.email
              });
            }
          } else {
            // Check intended role set during sign-in
            let intendedRole = 'parent';
            try {
              intendedRole = sessionStorage.getItem('nishchit_auth_role') || 'parent';
            } catch {}

            if (intendedRole === 'driver') {
              // Unregistered driver state - prompt registration form before creating Firestore document
              setCurrentUser({
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Driver',
                fullName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Driver',
                role: 'driver',
                status: 'unregistered',
                verificationStatus: 'unregistered',
                isNewUser: true,
                needsDriverRegistration: true
              });
            } else {
              const newParentProfile = {
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Parent',
                fullName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Parent',
                role: 'parent',
                status: 'active',
                isNewUser: true,
                needsStudentLink: true,
                createdAt: Date.now(),
                updatedAt: Date.now()
              };
              try {
                await saveUserProfile(firebaseUser.uid, newParentProfile);
              } catch (err) {
                console.warn('Initial parent profile sync note:', err);
              }
              setCurrentUser(newParentProfile);
            }
          }
          setLoading(false);
        });
      } catch (err) {
        console.error('Error synchronizing user profile:', err);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      unsubProfile();
    };
  }, []);

  /**
   * Temporary hackathon admin authentication handler.
   * Credentials: ID = admin123, Password = admin123
   * Not for public registration or production use.
   */
  const loginAsAdminHackathon = async (adminId, adminPassword) => {
    const cleanId = (adminId || '').trim();
    const cleanPassword = (adminPassword || '').trim();

    if (!cleanId || !cleanPassword) {
      throw new Error('Please enter both administrator ID and password.');
    }

    if (cleanId !== 'admin123' || cleanPassword !== 'admin123') {
      throw new Error('Incorrect admin ID or password.');
    }

    // TEMPORARY HACKATHON ADMIN ACCESS - NOT FOR PRODUCTION
    const adminProfile = {
      uid: 'admin-controller-session',
      id: 'admin123',
      email: 'admin@nishchit.app',
      name: 'Transport Controller',
      fullName: 'Transport Administrator',
      role: 'admin',
      status: 'active',
      verificationStatus: 'approved',
      institutionName: 'Andhra Pradesh Educational Corridor Transport Desk',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    try {
      localStorage.setItem(ADMIN_SESSION_STORAGE_KEY, JSON.stringify(adminProfile));
    } catch (e) {
      console.warn('Could not store admin session in localStorage:', e);
    }

    setCurrentUser(adminProfile);
    return adminProfile;
  };

  /**
   * Primary user authentication method for Parent, Driver, and Admin.
   * Real Google Authentication backed by Firestore users/{uid} profile.
   */
  const loginWithGoogle = async (targetPortal = 'parent') => {
    try {
      sessionStorage.setItem('nishchit_auth_role', targetPortal);
    } catch {}

    // Clear any previous demo sessions
    try {
      localStorage.removeItem(ADMIN_SESSION_STORAGE_KEY);
      localStorage.removeItem(USER_SESSION_STORAGE_KEY);
      localStorage.removeItem(PARENT_SESSION_STORAGE_KEY);
    } catch {
      // Ignore
    }

    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const res = await signInWithPopup(auth, provider);
    const user = res.user;
    const now = Date.now();

    // Query Firestore for existing profile
    let profile = await getUserProfile(user.uid);

    if (!profile) {
      // -------------------------------------------------------------
      // 1. BRAND NEW USER (First time Google sign-in)
      // -------------------------------------------------------------
      if (targetPortal === 'parent') {
        profile = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || user.email?.split('@')[0] || 'Parent',
          name: user.displayName || user.email?.split('@')[0] || 'Parent',
          fullName: user.displayName || user.email?.split('@')[0] || 'Parent',
          photoURL: user.photoURL || '',
          role: 'parent',
          status: 'active',
          isNewUser: true,
          needsStudentLink: true,
          createdAt: now,
          updatedAt: now
        };
        try {
          await saveUserProfile(user.uid, profile);
        } catch (e) {
          console.warn('Parent initial profile save note:', e);
        }
        setCurrentUser(profile);
        return profile;
      } else if (targetPortal === 'driver') {
        // New driver must submit registration & verification before receiving active access
        const pendingDriverState = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || user.email?.split('@')[0] || 'Driver',
          name: user.displayName || user.email?.split('@')[0] || 'Driver',
          fullName: user.displayName || user.email?.split('@')[0] || 'Driver',
          photoURL: user.photoURL || '',
          role: 'driver',
          status: 'unregistered',
          verificationStatus: 'unregistered',
          isNewUser: true,
          needsDriverRegistration: true,
          createdAt: now,
          updatedAt: now
        };
        setCurrentUser(pendingDriverState);
        return pendingDriverState;
      } else if (targetPortal === 'admin') {
        const adminAllowlist = ['admin@nishchit.app', 'palos.saiganesh@gmail.com', 'transport@andhrauniversity.edu.in'];
        if (adminAllowlist.includes((user.email || '').toLowerCase())) {
          profile = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || 'Transport Admin',
            name: user.displayName || 'Transport Admin',
            fullName: user.displayName || 'Transport Administrator',
            role: 'admin',
            status: 'active',
            createdAt: now,
            updatedAt: now
          };
          try {
            await saveUserProfile(user.uid, profile);
          } catch (e) {}
          setCurrentUser(profile);
          return profile;
        } else {
          await signOut(auth);
          throw new Error('This Google account is not registered as an authorized Administrator.');
        }
      }
    } else {
      // -------------------------------------------------------------
      // 2. EXISTING USER: ENFORCE ROLE SEPARATION & PREVENT ACCIDENTAL OVERWRITE
      // -------------------------------------------------------------
      const registeredRole = (profile.role || '').toLowerCase();

      // Parent trying to log in via Driver portal
      if (targetPortal === 'driver' && registeredRole === 'parent') {
        await signOut(auth);
        const err = new Error('This account is registered as a Parent account. Please use the Parent portal or sign in with your Driver account.');
        err.code = 'WRONG_PORTAL_PARENT';
        throw err;
      }

      // Driver trying to log in via Parent portal
      if (targetPortal === 'parent' && registeredRole === 'driver') {
        await signOut(auth);
        const err = new Error('This account is registered as a Driver account. Please use the Driver portal or sign in with your Parent account.');
        err.code = 'WRONG_PORTAL_DRIVER';
        throw err;
      }

      // Unauthorized user trying to enter Admin portal
      if (targetPortal === 'admin' && registeredRole !== 'admin' && registeredRole !== 'institution' && registeredRole !== 'platform_admin') {
        await signOut(auth);
        const err = new Error('This account is not authorized as an Administrator.');
        err.code = 'UNAUTHORIZED_ADMIN';
        throw err;
      }

      // Existing verified Driver
      if (registeredRole === 'driver') {
        const driverDoc = await getDriverProfile(user.uid);
        const merged = {
          ...profile,
          ...(driverDoc || {}),
          uid: user.uid,
          email: user.email || profile.email
        };
        setCurrentUser(merged);
        return merged;
      }

      // Existing Parent
      if (registeredRole === 'parent') {
        const studentLink = await getParentStudentTransport(user.uid);
        const merged = {
          ...profile,
          ...(studentLink || {}),
          uid: user.uid,
          email: user.email || profile.email
        };
        setCurrentUser(merged);
        return merged;
      }

      setCurrentUser(profile);
      return profile;
    }
  };

  const updateCurrentUserProfile = async (updates) => {
    if (!currentUser?.uid) return;
    const updated = { ...currentUser, ...updates, updatedAt: Date.now() };
    setCurrentUser(updated);

    // If admin session, update localStorage as well
    if (currentUser.role === 'admin') {
      try {
        localStorage.setItem(ADMIN_SESSION_STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // Ignore
      }
    }

    try {
      await saveUserProfile(currentUser.uid, updates);
    } catch (e) {
      console.warn('Profile update note:', e);
    }
  };

  const logout = async () => {
    try {
      localStorage.removeItem(USER_SESSION_STORAGE_KEY);
      localStorage.removeItem(ADMIN_SESSION_STORAGE_KEY);
      localStorage.removeItem(PARENT_SESSION_STORAGE_KEY);
      sessionStorage.removeItem('nishchit_auth_role');
    } catch {
      // Ignore
    }

    try {
      await signOut(auth);
    } catch (e) {
      console.warn('Sign out note:', e);
    }
    setCurrentUser(null);
  };

  /**
   * Platform Administrator Authentication (Ecosystem Command Center)
   */
  const loginAsPlatformAdmin = async () => {
    try {
      localStorage.removeItem(PARENT_SESSION_STORAGE_KEY);
    } catch {}

    const adminProfile = {
      uid: 'platform-admin-session',
      id: 'platform-operator',
      email: 'admin@nishchit.app',
      name: 'Platform Moderator',
      fullName: 'Platform Operations Administrator',
      role: 'platform_admin',
      status: 'active',
      verificationStatus: 'approved',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    try {
      localStorage.setItem(USER_SESSION_STORAGE_KEY, JSON.stringify(adminProfile));
      localStorage.setItem(ADMIN_SESSION_STORAGE_KEY, JSON.stringify(adminProfile));
    } catch {}

    setCurrentUser(adminProfile);
    return adminProfile;
  };

  /**
   * Institution Administrator Authentication (School / College Transport Desk)
   */
  const loginAsInstitutionDemo = async (instId = 'INST-AU') => {
    try {
      localStorage.removeItem(PARENT_SESSION_STORAGE_KEY);
    } catch {}

    // Ensure Firebase auth session exists to prevent SDK unauthenticated blocks
    try {
      const { signInAnonymously } = await import('firebase/auth');
      if (!auth.currentUser) {
        await signInAnonymously(auth);
      }
    } catch (e) {
      console.warn('Anonymous auth session note:', e);
    }

    const inst = REGISTERED_INSTITUTIONS.find(i => i.id === instId || i.instituteId === instId) || REGISTERED_INSTITUTIONS[0];
    const instProfile = {
      uid: `inst-session-${inst.id}`,
      id: inst.id,
      instituteId: inst.id,
      email: `transport@${inst.id.toLowerCase().replace(/[^a-z0-9]/g, '')}.edu.in`,
      name: `${inst.shortName || inst.name} Desk`,
      fullName: `${inst.name} Transport Controller`,
      role: 'institution',
      institutionId: inst.id,
      institutionName: inst.name,
      city: inst.city,
      state: inst.state,
      status: 'active',
      verificationStatus: 'verified',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    try {
      localStorage.setItem(USER_SESSION_STORAGE_KEY, JSON.stringify(instProfile));
      localStorage.setItem(ADMIN_SESSION_STORAGE_KEY, JSON.stringify(instProfile));
    } catch {}

    setCurrentUser(instProfile);
    return instProfile;
  };

  /**
   * Driver Authentication (Independent Profile & Operational Cockpit)
   */
  const loginAsDriverDemo = async (driverId = 'DRV-SURESH-REDDY') => {
    try {
      localStorage.removeItem(ADMIN_SESSION_STORAGE_KEY);
      localStorage.removeItem(PARENT_SESSION_STORAGE_KEY);
    } catch {}

    // Ensure Firebase auth session exists to prevent SDK unauthenticated blocks
    try {
      const { signInAnonymously } = await import('firebase/auth');
      if (!auth.currentUser) {
        await signInAnonymously(auth);
      }
    } catch (e) {
      console.warn('Anonymous auth session note:', e);
    }

    const drv = INITIAL_VERIFIED_DRIVERS.find(d => d.id === driverId) || INITIAL_VERIFIED_DRIVERS[0] || {
      id: 'DRV-AU-DEMO',
      name: 'Suresh Reddy',
      fullName: 'Suresh Reddy',
      phone: '+91 98480 12345',
      experienceYears: '6',
      assignedBusId: 'BUS-AU01',
      assignedBusNumber: 'Bus AU01',
      assignedRouteId: 'ROUTE-AU01',
      assignedRouteName: 'Route AU01 (Gajuwaka → Andhra University)',
      institutionId: 'INST-AU',
      institutionName: 'Andhra University'
    };

    const driverProfile = {
      ...drv,
      uid: drv.id,
      busId: drv.assignedBusId || drv.busId || 'BUS-AU01',
      busNumber: drv.assignedBusNumber || drv.busNumber || 'Bus AU01',
      assignedBusId: drv.assignedBusId || drv.busId || 'BUS-AU01',
      assignedBusNumber: drv.assignedBusNumber || drv.busNumber || 'Bus AU01',
      routeId: drv.assignedRouteId || drv.routeId || 'ROUTE-AU01',
      routeName: drv.assignedRouteName || drv.routeName || 'Route AU01 (Gajuwaka → Andhra University)',
      assignedRouteId: drv.assignedRouteId || drv.routeId || 'ROUTE-AU01',
      assignedRouteName: drv.assignedRouteName || drv.routeName || 'Route AU01 (Gajuwaka → Andhra University)',
      institutionId: drv.institutionId || 'INST-AU',
      institutionName: drv.institutionName || 'Andhra University',
      role: 'driver',
      status: 'active',
      verificationStatus: 'approved',
      isPlatformVerified: true,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    try {
      localStorage.setItem(USER_SESSION_STORAGE_KEY, JSON.stringify(driverProfile));
    } catch {}

    setCurrentUser(driverProfile);
    return driverProfile;
  };

  /**
   * Demo parent authentication handler for Andhra University -> Siripuram Circle journey.
   */
  const loginAsDemoParent = async () => {
    try {
      localStorage.removeItem(USER_SESSION_STORAGE_KEY);
      localStorage.removeItem(ADMIN_SESSION_STORAGE_KEY);
    } catch {
      // Ignore
    }

    const demoParentProfile = {
      uid: 'parent-demo-session',
      id: 'demo-parent',
      email: 'parent@andhrauniversity.edu.in',
      name: 'Priya Sharma',
      fullName: 'Priya Sharma',
      role: 'parent',
      status: 'active',
      verificationStatus: 'approved',
      institutionId: 'INST-AU',
      institutionName: 'Andhra University, Visakhapatnam',
      stopName: 'Siripuram Circle',
      busId: 'BUS-AU01',
      routeId: 'ROUTE-AU01',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    try {
      localStorage.setItem(USER_SESSION_STORAGE_KEY, JSON.stringify(demoParentProfile));
      localStorage.setItem(PARENT_SESSION_STORAGE_KEY, JSON.stringify(demoParentProfile));
    } catch (e) {
      console.warn('Could not store parent demo session in localStorage:', e);
    }

    setCurrentUser(demoParentProfile);
    return demoParentProfile;
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading,
        loginWithGoogle,
        loginAsAdminHackathon,
        loginAsPlatformAdmin,
        loginAsInstitutionDemo,
        loginAsDriverDemo,
        loginAsDemoParent,
        updateCurrentUserProfile,
        logout
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
}

