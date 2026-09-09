import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup,
  GoogleAuthProvider,
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { ref, get, set, update } from 'firebase/database';
import { auth, database } from '../firebase';
import { seedTransportDatabase } from '../utils/transportService';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

const getFriendlyErrorMessage = (error) => {
  if (!error) return "An unexpected authentication error occurred.";
  const code = error.code || error.message || '';
  if (code.includes('auth/invalid-credential') || code.includes('auth/user-not-found') || code.includes('auth/wrong-password')) {
    return "Invalid email address or password. Please check your credentials.";
  }
  if (code.includes('auth/email-already-in-use')) {
    return "An account with this email address already exists. Please login instead.";
  }
  if (code.includes('auth/weak-password')) {
    return "Password is too weak. Please use at least 6 characters.";
  }
  if (code.includes('auth/invalid-email')) {
    return "Please enter a valid email address.";
  }
  if (code.includes('auth/popup-closed-by-user')) {
    return "Google Sign-In was cancelled.";
  }
  if (code.includes('auth/network-request-failed')) {
    return "Network error. Please check your internet connection.";
  }
  return error.message || "Authentication failed. Please check credentials.";
};

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const isLoggingOutRef = useRef(false);

  // Authoritative Seeded Demo Profiles for the Vizag-Vizianagaram Corridor
  const DEMO_DRIVER = {
    uid: 'demo-driver-001',
    name: 'Rajesh Kumar',
    fullName: 'Rajesh Kumar',
    email: 'driver@nishchit.app',
    phone: '+91 98765 43210',
    role: 'driver',
    driverId: 'DRV-901',
    busId: 'BUS-24',
    routeId: 'ROUTE-VZ04',
    verificationStatus: 'APPROVED',
    institutionId: 'INST-MVGR',
    institutionName: 'MVGR College of Engineering (Autonomous), Vizianagaram',
    busRegistrationNumber: 'AP 35 U 2424',
    busNumber: 'Bus 24',
    licenceNumber: 'AP-35-20180004921',
    licenceValidity: '2029-08-15',
    idDocumentType: 'Aadhaar Card',
    idDocumentNumber: '9844 2109 8831',
    idDocValidity: 'Permanent'
  };

  const DEMO_PARENT = {
    uid: 'demo-parent-001',
    name: 'Suresh Varma',
    email: 'parent@nishchit.app',
    phone: '+91 91234 56789',
    role: 'parent',
    studentName: 'Aarav Varma',
    studentRollNo: '22331A0589',
    studentClass: 'B.Tech CSE - 3rd Year',
    institutionId: 'INST-MVGR',
    institutionName: 'MVGR College of Engineering, Vizianagaram',
    busId: 'BUS-24',
    routeId: 'ROUTE-VZ04',
    stopName: 'Mayuri Junction / Balaji Nagar'
  };

  const DEMO_ADMIN = {
    uid: 'demo-admin-001',
    name: 'K. Ramakrishna',
    email: 'admin@nishchit.app',
    phone: '+91 891 2548899',
    role: 'admin',
    title: 'Chief Transport Officer',
    organization: 'Nishchit Corridor Transport Authority (Vizianagaram – Thagarapuvalasa – Vizag Desk)'
  };

  useEffect(() => {
    // Seed default institutions and vehicles
    seedTransportDatabase();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (isLoggingOutRef.current) {
        localStorage.removeItem('nishchit_demo_user');
        setCurrentUser(null);
        isLoggingOutRef.current = false;
        setLoading(false);
        return;
      }

      if (user) {
        localStorage.removeItem('nishchit_demo_user');
        try {
          const userRef = ref(database, `users/${user.uid}`);
          const snapshot = await get(userRef);
          if (snapshot.exists()) {
            setCurrentUser(snapshot.val());
          } else {
            // Default profile fallback
            const role = user.email?.includes('admin') 
              ? 'admin' 
              : (user.email?.includes('driver') ? 'driver' : 'parent');

            const newProfile = {
              uid: user.uid,
              email: user.email,
              name: user.displayName || user.email.split('@')[0],
              role,
              busId: role === 'driver' ? 'BUS-24' : 'BUS-24',
              routeId: role === 'driver' ? 'ROUTE-VZ04' : 'ROUTE-VZ04',
              verificationStatus: role === 'driver' ? 'PENDING' : undefined
            };
            await set(userRef, newProfile);
            setCurrentUser(newProfile);
          }
        } catch (err) {
          console.error("Error fetching user profile:", err);
        }
      } else {
        // Check stored demo session for persistent reload state
        const storedDemo = localStorage.getItem('nishchit_demo_user');
        if (storedDemo) {
          try {
            setCurrentUser(JSON.parse(storedDemo));
          } catch {
            setCurrentUser(null);
          }
        } else {
          setCurrentUser(null);
        }
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const loginWithCredentials = async (email, password, expectedRole) => {
    const formattedEmail = (email || '').trim().toLowerCase();

    // Match demo accounts instantly
    if (formattedEmail === 'driver@nishchit.app' || (formattedEmail === 'driver' && password === 'driver123')) {
      if (expectedRole && expectedRole !== 'driver') {
        throw new Error("Role mismatch: Driver account cannot access " + expectedRole.toUpperCase() + " portal.");
      }
      localStorage.setItem('nishchit_demo_user', JSON.stringify(DEMO_DRIVER));
      setCurrentUser(DEMO_DRIVER);
      return DEMO_DRIVER;
    }
    if (formattedEmail === 'parent@nishchit.app' || (formattedEmail === 'parent' && password === 'parent123')) {
      if (expectedRole && expectedRole !== 'parent') {
        throw new Error("Role mismatch: Parent account cannot access " + expectedRole.toUpperCase() + " portal.");
      }
      localStorage.setItem('nishchit_demo_user', JSON.stringify(DEMO_PARENT));
      setCurrentUser(DEMO_PARENT);
      return DEMO_PARENT;
    }
    if (formattedEmail === 'admin@nishchit.app' || (formattedEmail === 'admin' && password === 'admin123')) {
      if (expectedRole && expectedRole !== 'admin') {
        throw new Error("Role mismatch: Admin account cannot access " + expectedRole.toUpperCase() + " portal.");
      }
      localStorage.setItem('nishchit_demo_user', JSON.stringify(DEMO_ADMIN));
      setCurrentUser(DEMO_ADMIN);
      return DEMO_ADMIN;
    }

    try {
      const res = await signInWithEmailAndPassword(auth, formattedEmail, password);
      const userRef = ref(database, `users/${res.user.uid}`);
      const snapshot = await get(userRef);
      let profile = snapshot.exists() ? snapshot.val() : null;

      if (profile && expectedRole && profile.role !== expectedRole) {
        await signOut(auth);
        throw new Error(`Role mismatch: This account is registered as a ${profile.role.toUpperCase()}. Please use the correct login portal.`);
      }

      if (!profile) {
        profile = {
          uid: res.user.uid,
          email: res.user.email,
          name: res.user.email.split('@')[0],
          role: expectedRole || 'parent',
          busId: expectedRole === 'driver' ? 'BUS-24' : 'BUS-24',
          routeId: expectedRole === 'driver' ? 'ROUTE-VZ04' : 'ROUTE-VZ04',
          verificationStatus: expectedRole === 'driver' ? 'PENDING' : undefined
        };
        await set(userRef, profile);
      }

      localStorage.removeItem('nishchit_demo_user');
      setCurrentUser(profile);
      return profile;
    } catch (err) {
      if (err.message && err.message.startsWith("Role mismatch:")) {
        throw err;
      }
      throw new Error(getFriendlyErrorMessage(err));
    }
  };

  const loginWithGoogle = async (expectedRole) => {
    try {
      const provider = new GoogleAuthProvider();
      const res = await signInWithPopup(auth, provider);
      const userRef = ref(database, `users/${res.user.uid}`);
      const snapshot = await get(userRef);
      let profile = snapshot.exists() ? snapshot.val() : null;

      if (profile && expectedRole && profile.role !== expectedRole) {
        await signOut(auth);
        throw new Error(`Role mismatch: This Google account is already registered as a ${profile.role.toUpperCase()}.`);
      }

      if (!profile) {
        profile = {
          uid: res.user.uid,
          email: res.user.email,
          name: res.user.displayName || res.user.email.split('@')[0],
          photoURL: res.user.photoURL || '',
          role: expectedRole || 'parent',
          busId: expectedRole === 'driver' ? null : 'BUS-24',
          routeId: expectedRole === 'driver' ? null : 'ROUTE-VZ04',
          verificationStatus: expectedRole === 'driver' ? 'PENDING' : undefined
        };
        await set(userRef, profile);
      }

      localStorage.removeItem('nishchit_demo_user');
      setCurrentUser(profile);
      return profile;
    } catch (err) {
      if (err.message && err.message.startsWith("Role mismatch:")) {
        throw err;
      }
      throw new Error(getFriendlyErrorMessage(err));
    }
  };

  const signupWithCredentials = async (email, password, role, extraData = {}) => {
    try {
      const formattedEmail = (email || '').trim().toLowerCase();
      const res = await createUserWithEmailAndPassword(auth, formattedEmail, password);
      const profile = {
        uid: res.user.uid,
        email: res.user.email,
        role,
        name: extraData.name || extraData.fullName || formattedEmail.split('@')[0],
        verificationStatus: role === 'driver' ? 'PENDING' : undefined,
        ...extraData
      };
      await set(ref(database, `users/${res.user.uid}`), profile);
      localStorage.removeItem('nishchit_demo_user');
      setCurrentUser(profile);
      return profile;
    } catch (err) {
      throw new Error(getFriendlyErrorMessage(err));
    }
  };

  const quickDemoLogin = (role) => {
    let demoUser = DEMO_PARENT;
    if (role === 'driver') demoUser = DEMO_DRIVER;
    if (role === 'admin') demoUser = DEMO_ADMIN;

    localStorage.setItem('nishchit_demo_user', JSON.stringify(demoUser));
    setCurrentUser(demoUser);
    return demoUser;
  };

  const updateCurrentUserProfile = async (updates) => {
    if (!currentUser) return;
    const updated = { ...currentUser, ...updates };
    setCurrentUser(updated);

    if (currentUser.uid.startsWith('demo-')) {
      localStorage.setItem('nishchit_demo_user', JSON.stringify(updated));
    } else {
      try {
        await update(ref(database, `users/${currentUser.uid}`), updates);
      } catch (e) {
        console.warn("User profile update error:", e);
      }
    }
  };

  const logout = async () => {
    isLoggingOutRef.current = true;
    localStorage.removeItem('nishchit_demo_user');
    setCurrentUser(null);
    try {
      await signOut(auth);
    } catch (e) {
      console.warn("Sign out exception:", e);
    }
  };

  const value = {
    currentUser,
    loginWithCredentials,
    loginWithGoogle,
    signupWithCredentials,
    quickDemoLogin,
    updateCurrentUserProfile,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
