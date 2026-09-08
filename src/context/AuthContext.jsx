import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { ref, get, set } from 'firebase/database';
import { auth, database } from '../firebase';

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
  if (code.includes('auth/too-many-requests')) {
    return "Access temporarily blocked due to repeated failed attempts. Please try again later.";
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

  // Seeded Demo Users
  const DEMO_DRIVER = {
    uid: 'demo-driver-001',
    name: 'Rajesh Kumar',
    email: 'driver@nishchit.app',
    phone: '+91 98765 43210',
    role: 'driver',
    driverId: 'DRV001',
    busId: 'BUS24',
    routeId: 'ROUTE04',
    verificationStatus: 'VERIFIED',
    institution: "St. Mary's High School",
    busRegistrationNumber: 'TS 09 UB 2424',
    licenceNumber: 'DL-1420110012345'
  };

  const DEMO_PARENT = {
    uid: 'demo-parent-001',
    name: 'Demo Parent',
    email: 'parent@nishchit.app',
    phone: '+91 91234 56789',
    role: 'parent',
    studentName: 'Aarav',
    studentClass: 'Class 8-A',
    institution: "St. Mary's High School",
    busId: 'BUS24',
    routeId: 'ROUTE04'
  };

  // Seed bus data in database if missing
  const seedDefaultBus = async () => {
    try {
      const busRef = ref(database, 'buses/BUS24');
      const snapshot = await get(busRef);
      if (!snapshot.exists()) {
        await set(busRef, {
          busNumber: 'Bus 24',
          routeNumber: 'Route 04',
          driverId: 'DRV001',
          driverName: 'Rajesh Kumar',
          driverPhone: '+91 98765 43210',
          status: 'NOT_STARTED',
          latitude: 17.4399,
          longitude: 78.4983,
          accuracy: 10,
          lastUpdated: Date.now(),
          startedAt: null,
          endedAt: null,
          isDemoMode: false
        });
      }
    } catch (err) {
      console.warn("Seeding default bus skipped or offline:", err);
    }
  };

  useEffect(() => {
    seedDefaultBus();
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
        // Fetch user profile from database
        try {
          const userRef = ref(database, `users/${user.uid}`);
          const snapshot = await get(userRef);
          if (snapshot.exists()) {
            setCurrentUser(snapshot.val());
          } else {
            // Default profile fallback
            setCurrentUser({
              uid: user.uid,
              email: user.email,
              name: user.displayName || user.email.split('@')[0],
              role: user.email.includes('driver') ? 'driver' : 'parent',
              busId: 'BUS24',
              routeId: 'ROUTE04',
              verificationStatus: 'VERIFIED'
            });
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

    // Quick match for demo accounts
    if (formattedEmail === 'driver@nishchit.app' || (formattedEmail === 'driver' && password === 'driver123')) {
      if (expectedRole !== 'driver') {
        throw new Error("Role mismatch: Driver account cannot access Parent portal.");
      }
      localStorage.setItem('nishchit_demo_user', JSON.stringify(DEMO_DRIVER));
      setCurrentUser(DEMO_DRIVER);
      return DEMO_DRIVER;
    }
    if (formattedEmail === 'parent@nishchit.app' || (formattedEmail === 'parent' && password === 'parent123')) {
      if (expectedRole !== 'parent') {
        throw new Error("Role mismatch: Parent account cannot access Driver portal.");
      }
      localStorage.setItem('nishchit_demo_user', JSON.stringify(DEMO_PARENT));
      setCurrentUser(DEMO_PARENT);
      return DEMO_PARENT;
    }

    try {
      const res = await signInWithEmailAndPassword(auth, formattedEmail, password);
      const userRef = ref(database, `users/${res.user.uid}`);
      const snapshot = await get(userRef);
      let profile = snapshot.exists() ? snapshot.val() : null;

      if (profile && profile.role !== expectedRole) {
        await signOut(auth);
        throw new Error(`Role mismatch: This account is registered as a ${profile.role.toUpperCase()}.`);
      }

      if (!profile) {
        profile = {
          uid: res.user.uid,
          email: res.user.email,
          name: res.user.email.split('@')[0],
          role: expectedRole,
          busId: 'BUS24',
          routeId: 'ROUTE04',
          verificationStatus: expectedRole === 'driver' ? 'VERIFIED' : undefined
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

  const signupWithCredentials = async (email, password, role, extraData) => {
    try {
      const formattedEmail = (email || '').trim().toLowerCase();
      const res = await createUserWithEmailAndPassword(auth, formattedEmail, password);
      const profile = {
        uid: res.user.uid,
        email: res.user.email,
        role,
        busId: extraData.busId || 'BUS24',
        routeId: extraData.routeId || 'ROUTE04',
        name: extraData.name || formattedEmail.split('@')[0],
        verificationStatus: role === 'driver' ? 'VERIFIED' : undefined,
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
    if (role === 'driver') {
      localStorage.setItem('nishchit_demo_user', JSON.stringify(DEMO_DRIVER));
      setCurrentUser(DEMO_DRIVER);
      return DEMO_DRIVER;
    } else {
      localStorage.setItem('nishchit_demo_user', JSON.stringify(DEMO_PARENT));
      setCurrentUser(DEMO_PARENT);
      return DEMO_PARENT;
    }
  };

  const logout = async () => {
    isLoggingOutRef.current = true;
    localStorage.removeItem('nishchit_demo_user');
    setCurrentUser(null);
    try {
      await signOut(auth);
    } catch (e) {
      console.warn("Sign out exception caught:", e);
    }
  };

  const value = {
    currentUser,
    loginWithCredentials,
    signupWithCredentials,
    quickDemoLogin,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}


