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
  ensureInitialCorridorData
} from '../services/transportService';

const ADMIN_SESSION_STORAGE_KEY = 'nishchit_admin_session';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const savedAdmin = localStorage.getItem(ADMIN_SESSION_STORAGE_KEY);
      if (savedAdmin) {
        return JSON.parse(savedAdmin);
      }
    } catch {
      // Ignore
    }
    return null;
  });
  const [loading, setLoading] = useState(true);

  // Initialize fleet and routes in Firestore if empty
  useEffect(() => {
    ensureInitialCorridorData();
  }, []);

  useEffect(() => {
    let unsubProfile = () => {};

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      // If hackathon admin is currently active, preserve that session
      try {
        const savedAdmin = localStorage.getItem(ADMIN_SESSION_STORAGE_KEY);
        if (savedAdmin) {
          const parsed = JSON.parse(savedAdmin);
          if (parsed && parsed.role === 'admin') {
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
        setCurrentUser((prev) => (prev?.role === 'admin' ? prev : null));
        setLoading(false);
        return;
      }

      try {
        // Real-time synchronization with user document in Firestore
        unsubProfile = subscribeUserProfile(firebaseUser.uid, async (profile) => {
          if (profile) {
            setCurrentUser({
              ...profile,
              uid: firebaseUser.uid,
              email: firebaseUser.email || profile.email
            });
          } else {
            // Honor the intended role (driver or parent) set during sign-in
            let intendedRole = 'parent';
            try {
              intendedRole = sessionStorage.getItem('nishchit_auth_role') || 'parent';
            } catch {}

            const newProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
              fullName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
              role: intendedRole,
              status: intendedRole === 'driver' ? 'pending' : 'active',
              verificationStatus: intendedRole === 'driver' ? 'pending' : 'approved',
              createdAt: Date.now(),
              updatedAt: Date.now()
            };

            try {
              await saveUserProfile(firebaseUser.uid, newProfile);
            } catch (err) {
              console.warn('Initial profile sync note:', err);
            }
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
   * Primary user authentication method for Parent and Driver.
   */
  const loginWithGoogle = async (preferredRole = 'parent') => {
    try {
      sessionStorage.setItem('nishchit_auth_role', preferredRole);
    } catch {}

    // Clear any previous admin session
    try {
      localStorage.removeItem(ADMIN_SESSION_STORAGE_KEY);
    } catch {
      // Ignore
    }

    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const res = await signInWithPopup(auth, provider);
    const user = res.user;

    let profile = await getUserProfile(user.uid);
    if (!profile) {
      profile = {
        uid: user.uid,
        email: user.email,
        name: user.displayName || user.email.split('@')[0],
        fullName: user.displayName || user.email.split('@')[0],
        role: preferredRole,
        status: preferredRole === 'driver' ? 'pending' : 'active',
        verificationStatus: preferredRole === 'driver' ? 'pending' : 'approved',
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      try {
        await saveUserProfile(user.uid, profile);
      } catch (e) {
        console.warn('Profile save note:', e);
      }
    } else if (preferredRole && profile.role !== preferredRole) {
      // Allow seamless demo switching between driver and parent with the same Google email
      profile.role = preferredRole;
      if (preferredRole === 'driver' && !profile.verificationStatus) {
        profile.status = 'pending';
        profile.verificationStatus = 'pending';
      }
      try {
        await saveUserProfile(user.uid, {
          role: preferredRole,
          ...(preferredRole === 'driver' ? {
            status: profile.status || 'pending',
            verificationStatus: profile.verificationStatus || 'pending'
          } : {})
        });
      } catch (e) {
        console.warn('Role switch note:', e);
      }
    }

    setCurrentUser(profile);
    return profile;
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
      localStorage.removeItem(ADMIN_SESSION_STORAGE_KEY);
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

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading,
        loginWithGoogle,
        loginAsAdminHackathon,
        updateCurrentUserProfile,
        logout
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
}

