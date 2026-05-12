import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  User,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  role: 'owner' | 'player';
  createdAt: Date;
}

export const authService = {
  async signup(email: string, name: string, password: string): Promise<User> {
    const { user } = await createUserWithEmailAndPassword(auth, email, password);

    const userProfile: Omit<UserProfile, 'uid'> = {
      email,
      name,
      role: 'owner',
      createdAt: new Date(),
    };

    await setDoc(doc(db, 'users', user.uid), userProfile);
    return user;
  },

  async login(email: string, password: string): Promise<User> {
    const { user } = await signInWithEmailAndPassword(auth, email, password);
    return user;
  },

  async logout(): Promise<void> {
    await firebaseSignOut(auth);
  },

  async getUserProfile(uid: string): Promise<UserProfile | null> {
    const docSnap = await getDoc(doc(db, 'users', uid));
    if (docSnap.exists()) {
      return { uid, ...docSnap.data() } as UserProfile;
    }
    return null;
  },
};
