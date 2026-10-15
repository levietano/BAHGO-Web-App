import { signInWithEmailAndPassword, signOut, onAuthStateChanged, setPersistence, browserSessionPersistence } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

// Signs a user in with session-only persistence (cleared when the tab closes).
// Throws on failure so callers can show their own error UI.
export async function login(email, password) {
    await setPersistence(auth, browserSessionPersistence);
    const userCredential = await signInWithEmailAndPassword(auth, email, password);

    if (userCredential?.user?.uid) {
        try {
            await setDoc(doc(db, 'users', userCredential.user.uid), {
                lastLogin: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }, { merge: true });
        } catch (error) {
            console.warn('Failed to update user last login:', error);
        }
    }

    return userCredential;
}

export async function logout() {
    await signOut(auth);
}

// Subscribes to auth state changes. Returns the unsubscribe function.
export function watchAuthState(callback) {
    return onAuthStateChanged(auth, callback);
}
