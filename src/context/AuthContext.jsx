import React, { createContext, useContext, useState, useEffect } from 'react';
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

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

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
      if (user) {
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
        // Maintain local demo state if logged in via demo button
        setCurrentUser(prev => (prev?.uid?.startsWith('demo-') ? prev : null));
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const loginWithCredentials = async (email, password, expectedRole) => {
    // Quick match for demo accounts
    if (email === 'driver@nishchit.app' || (email === 'driver' && password === 'driver123')) {
      if (expectedRole !== 'driver') {
        throw new Error("Role mismatch: Driver account cannot access Parent portal.");
      }
      setCurrentUser(DEMO_DRIVER);
      return DEMO_DRIVER;
    }
    if (email === 'parent@nishchit.app' || (email === 'parent' && password === 'parent123')) {
      if (expectedRole !== 'parent') {
        throw new Error("Role mismatch: Parent account cannot access Driver portal.");
      }
      setCurrentUser(DEMO_PARENT);
      return DEMO_PARENT;
    }

    try {
      const res = await signInWithEmailAndPassword(auth, email, password);
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

      setCurrentUser(profile);
      return profile;
    } catch (err) {
      throw err;
    }
  };

  const signupWithCredentials = async (email, password, role, extraData) => {
    const res = await createUserWithEmailAndPassword(auth, email, password);
    const profile = {
      uid: res.user.uid,
      email: res.user.email,
      role,
      busId: extraData.busId || 'BUS24',
      routeId: extraData.routeId || 'ROUTE04',
      name: extraData.name || email.split('@')[0],
      verificationStatus: role === 'driver' ? 'VERIFIED' : undefined,
      ...extraData
    };
    await set(ref(database, `users/${res.user.uid}`), profile);
    setCurrentUser(profile);
    return profile;
  };

  const quickDemoLogin = (role) => {
    if (role === 'driver') {
      setCurrentUser(DEMO_DRIVER);
      return DEMO_DRIVER;
    } else {
      setCurrentUser(DEMO_PARENT);
      return DEMO_PARENT;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      // Ignore
    }
    setCurrentUser(null);
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
