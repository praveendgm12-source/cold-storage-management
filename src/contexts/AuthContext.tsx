import React, { createContext, useContext, useEffect, useState } from 'react';
import type { FirebaseUser } from '../lib/firebase';
import { auth, createUserProfile, getUserProfile } from '../lib/firebase';
import { UserProfile } from '../lib/supabase';
import { onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut as firebaseSignOut } from 'firebase/auth';

interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  signUp: (email: string, password: string, name: string, role: 'storageOwner' | 'farmer') => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen for Firebase auth state
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setUser(fbUser ?? null);
      if (fbUser) {
        await loadProfile(fbUser.uid);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const loadProfile = async (userId: string) => {
    try {
      let data = await getUserProfile(userId);
      for (let i = 0; !data && i < 4; i++) {
        await new Promise((r) => setTimeout(r, 600));
        data = await getUserProfile(userId);
      }
      setProfile((data as UserProfile) ?? null);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, name: string, role: 'storageOwner' | 'farmer') => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const fbUser = userCredential.user;
    if (!fbUser) throw new Error('Signup failed');
    // Create profile in Firestore and then load it immediately so the app
    // has profile data available and can route to the correct dashboard.
    await createUserProfile(fbUser.uid, name, email, role);
    // Wait for profile to be readable then load it into context
    await loadProfile(fbUser.uid);
  };

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  const value = {
    user,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
