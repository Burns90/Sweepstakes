import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { auth } from '../services/firebase';
import { authService, UserProfile } from '../services/auth';

interface AuthContextType {
  user: FirebaseUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signup: (email: string, name: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        const profile = await authService.getUserProfile(firebaseUser.uid);
        setUserProfile(profile);
      } else {
        setUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signup = async (email: string, name: string, password: string) => {
    await authService.signup(email, name, password);
  };

  const login = async (email: string, password: string) => {
    await authService.login(email, password);
  };

  const logout = async () => {
    await authService.logout();
  };

  const resetPassword = async (email: string) => {
    await authService.resetPassword(email);
  };

  return (
    <AuthContext.Provider value={{ user, userProfile, loading, signup, login, logout, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
