import React, { createContext, useContext, useEffect, useState } from 'react';
import { GoogleAuthProvider, createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signInWithPopup, signOut } from 'firebase/auth';
import { get, ref, set, update } from 'firebase/database';
import { auth, database } from '../firebase';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);
const friendly = error => {
  const code = error?.code || '';
  if (code.includes('invalid-credential') || code.includes('wrong-password') || code.includes('user-not-found')) return 'The email address or password is incorrect.';
  if (code.includes('email-already-in-use')) return 'An account already exists with this email address.';
  if (code.includes('popup-closed')) return 'Google sign-in was cancelled.';
  if (code.includes('network')) return 'We could not reach the service. Please check your connection.';
  return 'We could not complete that request. Please try again.';
};

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => onAuthStateChanged(auth, async user => {
    if (!user) { setCurrentUser(null); setLoading(false); return; }
    try { const snap = await get(ref(database, `users/${user.uid}`)); setCurrentUser(snap.exists() ? snap.val() : null); }
    finally { setLoading(false); }
  }), []);
  const profileFor = async (user, role) => {
    const snap = await get(ref(database, `users/${user.uid}`));
    if (!snap.exists()) throw new Error('Your account has not been linked to a Nishchit profile yet. Please contact your transport administrator.');
    const profile = snap.val();
    if (role && profile.role !== role) { await signOut(auth); throw new Error(`This account is registered for the ${profile.role} portal.`); }
    setCurrentUser(profile); return profile;
  };
  const loginWithCredentials = async (email, password, role) => {
    try { return await profileFor((await signInWithEmailAndPassword(auth, email.trim(), password)).user, role); }
    catch (error) { if (error.message?.includes('registered') || error.message?.includes('linked')) throw error; throw new Error(friendly(error)); }
  };
  const loginWithGoogle = async role => {
    try {
      const user = (await signInWithPopup(auth, new GoogleAuthProvider())).user;
      const existing = await get(ref(database, `users/${user.uid}`));
      if (!existing.exists() && role && role !== 'admin') {
        const profile = { uid: user.uid, email: user.email, name: user.displayName || '', role, verificationStatus: role === 'driver' ? 'pending' : null };
        await set(ref(database, `users/${user.uid}`), profile); setCurrentUser(profile); return profile;
      }
      return await profileFor(user, role);
    } catch (error) { if (error.message?.includes('registered') || error.message?.includes('linked')) throw error; throw new Error(friendly(error)); }
  };
  const signupWithCredentials = async (email, password, role, details = {}) => {
    try { const user = (await createUserWithEmailAndPassword(auth, email.trim(), password)).user; const profile = { uid: user.uid, email: user.email, role, name: details.name || '', verificationStatus: role === 'driver' ? 'PENDING' : undefined, ...details }; await set(ref(database, `users/${user.uid}`), profile); setCurrentUser(profile); return profile; }
    catch (error) { throw new Error(friendly(error)); }
  };
  const updateCurrentUserProfile = async updates => { if (!currentUser) return; await update(ref(database, `users/${currentUser.uid}`), updates); setCurrentUser(prev => ({ ...prev, ...updates })); };
  const logout = async () => { await signOut(auth); setCurrentUser(null); };
  return <AuthContext.Provider value={{ currentUser, loading, loginWithCredentials, loginWithGoogle, signupWithCredentials, updateCurrentUserProfile, logout }}>{!loading && children}</AuthContext.Provider>;
}
