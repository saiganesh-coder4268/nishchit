import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut
} from 'firebase/auth';
import { auth } from '../firebase';
import {
  getUserProfile,
  saveUserProfile,
  subscribeUserProfile,
  ensureInitialCorridorData
} from '../services/transportService';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize initial fleet and routes once
  useEffect(() => {
    ensureInitialCorridorData();
  }, []);

  useEffect(() => {
    let unsubProfile = () => {};

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      unsubProfile();

      if (!firebaseUser) {
        setCurrentUser(null);
        setLoading(false);
        return;
      }

      try {
        // Realtime subscription to the user's Firestore profile
        unsubProfile = subscribeUserProfile(firebaseUser.uid, async (profile) => {
          if (profile) {
            setCurrentUser({
              ...profile,
              uid: firebaseUser.uid,
              email: firebaseUser.email || profile.email
            });
          } else {
            // New user without a profile document: create one in Firestore
            const initialRole = firebaseUser.email?.includes('admin') ? 'admin' : 'parent';
            const newProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
              role: initialRole,
              status: initialRole === 'driver' ? 'pending' : 'active',
              verificationStatus: initialRole === 'driver' ? 'pending' : 'approved',
              createdAt: Date.now(),
              updatedAt: Date.now()
            };
            await saveUserProfile(firebaseUser.uid, newProfile);
            setCurrentUser(newProfile);
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

  const loginWithCredentials = async (email, password) => {
    const cleanEmail = (email || '').trim();
    const res = await signInWithEmailAndPassword(auth, cleanEmail, password);
    const profile = await getUserProfile(res.user.uid);
    if (profile) {
      setCurrentUser(profile);
      return profile;
    }
    return { uid: res.user.uid, email: res.user.email, role: 'parent' };
  };

  const loginWithGoogle = async (preferredRole = 'parent') => {
    const provider = new GoogleAuthProvider();
    const res = await signInWithPopup(auth, provider);
    const user = res.user;
    let profile = await getUserProfile(user.uid);
    if (!profile) {
      profile = {
        uid: user.uid,
        email: user.email,
        name: user.displayName || user.email.split('@')[0],
        role: preferredRole,
        status: preferredRole === 'driver' ? 'pending' : 'active',
        verificationStatus: preferredRole === 'driver' ? 'pending' : 'approved',
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      await saveUserProfile(user.uid, profile);
    }
    setCurrentUser(profile);
    return profile;
  };

  const signupWithCredentials = async (email, password, role = 'parent', details = {}) => {
    const cleanEmail = (email || '').trim();
    const res = await createUserWithEmailAndPassword(auth, cleanEmail, password);
    const user = res.user;

    const profile = {
      uid: user.uid,
      email: user.email,
      role,
      name: details.name || details.fullName || cleanEmail.split('@')[0],
      fullName: details.fullName || details.name || cleanEmail.split('@')[0],
      phone: details.phone || '',
      status: role === 'driver' ? 'pending' : 'active',
      verificationStatus: role === 'driver' ? 'pending' : 'approved',
      busId: details.busId || null,
      routeId: details.routeId || null,
      childName: details.childName || details.studentName || null,
      studentName: details.studentName || details.childName || null,
      studentRollNo: details.studentRollNo || null,
      institutionId: details.institutionId || 'INST-MVGR',
      institutionName: details.institutionName || 'MVGR College of Engineering',
      stopName: details.stopName || 'Mayuri Junction / Balaji Nagar',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      ...details
    };

    await saveUserProfile(user.uid, profile);
    setCurrentUser(profile);
    return profile;
  };

  const updateCurrentUserProfile = async (updates) => {
    if (!currentUser?.uid) return;
    const updated = { ...currentUser, ...updates, updatedAt: Date.now() };
    setCurrentUser(updated);
    await saveUserProfile(currentUser.uid, updates);
  };

  const logout = async () => {
    await signOut(auth);
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading,
        loginWithCredentials,
        loginWithGoogle,
        signupWithCredentials,
        updateCurrentUserProfile,
        logout
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
}
