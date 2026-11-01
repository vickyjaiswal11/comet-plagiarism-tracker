import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { UserProfile, DEFAULT_USER_PROFILE } from '../utils/userProfile';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, meta: Partial<UserProfile>) => Promise<boolean>;
  signOutUser: () => Promise<void>;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_USER_KEY = 'vp_local_auth_user';
const LOCAL_PROFILE_KEY = 'vp_local_auth_profile';
const LOCAL_USERS_DB = 'vp_users_db';

function createMockUser(email: string, name?: string, id?: string): User {
  const userId = id || `user-${Math.random().toString(36).slice(2, 10)}`;
  return {
    id: userId,
    app_metadata: { provider: 'demo' },
    user_metadata: { name: name || email.split('@')[0], email },
    aud: 'authenticated',
    confirmation_sent_at: new Date().toISOString(),
    confirmed_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    email,
    phone: '',
    role: 'authenticated',
    updated_at: new Date().toISOString(),
  } as unknown as User;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore stored session on mount
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem(LOCAL_USER_KEY);
      const storedProfile = localStorage.getItem(LOCAL_PROFILE_KEY);
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        if (storedProfile) {
          setUserProfile(JSON.parse(storedProfile));
        } else {
          setUserProfile({
            ...DEFAULT_USER_PROFILE,
            name: parsedUser.user_metadata?.name || parsedUser.email?.split('@')[0] || DEFAULT_USER_PROFILE.name,
            email: parsedUser.email || DEFAULT_USER_PROFILE.email,
          });
        }
      }
    } catch {
      // ignore parse error
    }
    setLoading(false);
  }, []);

  const value: AuthContextType = {
    user,
    userProfile,
    loading,

    signInWithEmail: async (email, pass) => {
      const trimmedEmail = email.trim().toLowerCase();
      if (!trimmedEmail) throw new Error('Please enter your email address.');
      if (!pass) throw new Error('Please enter your password.');

      const usersDb = JSON.parse(localStorage.getItem(LOCAL_USERS_DB) || '{}');
      const existing = usersDb[trimmedEmail];

      if (existing) {
        if (existing.password && existing.password !== pass) {
          throw new Error('Incorrect password. Please verify your credentials.');
        }
        setUser(existing.user);
        setUserProfile(existing.profile);
        localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(existing.user));
        localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(existing.profile));
        return;
      }

      // If logging in for the first time with credentials, create and sign in directly
      const localUser = createMockUser(trimmedEmail, trimmedEmail.split('@')[0]);
      const localProfile: UserProfile = {
        ...DEFAULT_USER_PROFILE,
        name: trimmedEmail.split('@')[0],
        email: trimmedEmail,
      };

      usersDb[trimmedEmail] = { user: localUser, profile: localProfile, password: pass };
      localStorage.setItem(LOCAL_USERS_DB, JSON.stringify(usersDb));

      setUser(localUser);
      setUserProfile(localProfile);
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(localUser));
      localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(localProfile));
    },

    signUpWithEmail: async (email, pass, meta) => {
      const trimmedEmail = email.trim().toLowerCase();
      if (!trimmedEmail) throw new Error('Please enter your email address.');
      if (!pass) throw new Error('Please enter a password.');

      const enteredName = meta.name?.trim() || trimmedEmail.split('@')[0];
      const enteredInstitution = meta.institution?.trim() || 'Academic Institution';
      const enteredDepartment = meta.department?.trim() || 'Research Department';

      const localUser = createMockUser(trimmedEmail, enteredName);
      const localProfile: UserProfile = {
        ...DEFAULT_USER_PROFILE,
        name: enteredName,
        email: trimmedEmail,
        institution: enteredInstitution,
        department: enteredDepartment,
      };

      try {
        const usersDb = JSON.parse(localStorage.getItem(LOCAL_USERS_DB) || '{}');
        usersDb[trimmedEmail] = { user: localUser, profile: localProfile, password: pass };
        localStorage.setItem(LOCAL_USERS_DB, JSON.stringify(usersDb));
      } catch {
        // ignore storage error
      }

      setUser(localUser);
      setUserProfile(localProfile);
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(localUser));
      localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(localProfile));

      return false; // Immediately signed in
    },

    signOutUser: async () => {
      localStorage.removeItem(LOCAL_USER_KEY);
      localStorage.removeItem(LOCAL_PROFILE_KEY);
      setUser(null);
      setUserProfile(null);
    },

    updateUserProfile: async (data) => {
      if (!user) return;
      setUserProfile((prev) => {
        const updated = prev ? { ...prev, ...data } : null;
        if (updated) {
          try {
            localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(updated));
            const usersDb = JSON.parse(localStorage.getItem(LOCAL_USERS_DB) || '{}');
            if (usersDb[updated.email.toLowerCase()]) {
              usersDb[updated.email.toLowerCase()].profile = updated;
              localStorage.setItem(LOCAL_USERS_DB, JSON.stringify(usersDb));
            }
          } catch {
            // ignore
          }
        }
        return updated;
      });
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
