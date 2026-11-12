import { useEffect, useState } from 'react';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged, createUserWithEmailAndPassword, initializeAuth, getAuth, inMemoryPersistence } from 'firebase/auth';
import { initializeApp, getApps } from 'firebase/app';
import Api from '../api';
// App secundário só para criar a conta do cliente novo. O createUser do SDK
// loga como o usuário criado; no app principal isso derrubava a sessão do
// super-admin e as gravações seguintes (Clients/Managers) iam como o cliente —
// recusadas pelas regras do RTDB desde o incidente de 2026-11-12.
let signupAuth = null;
const getSignupAuth = (firebase) => {
  if (signupAuth) return signupAuth;
  const signupApp = getApps().find((a) => a.name === 'org-signup') || initializeApp(firebase.app.options, 'org-signup');
  try {
    signupAuth = initializeAuth(signupApp, { persistence: inMemoryPersistence });
  } catch (e) {
    signupAuth = getAuth(signupApp);
  }
  return signupAuth;
};

const Authentication = (firebase) => {
  const [authUser, setAuthUser] = useState(null);
  useEffect(() => {
    onAuthStateChanged(firebase.auth, (user) => {
      if(user.uid === 'mIx721WKurVotrfVmggEOqKYCfl1' || user.uid === 'mxG5BZs7hUd1qsas4wKH6Lh0fZg1')
        setAuthUser(user);
      else
        setAuthUser(null);
    });
  }, []);
  const authenticate = (email, password) => {
    return signInWithEmailAndPassword(firebase.auth, email, password)
      .then((userCredential) => {
        const user = userCredential.user;
        if(user.uid === 'mIx721WKurVotrfVmggEOqKYCfl1' || user.uid === 'mxG5BZs7hUd1qsas4wKH6Lh0fZg1') {
          setAuthUser(user);
          return [user, false];
        } else {
          signOut();
          setAuthUser(null);
          return [0, true];
        }
      })
      .catch((error) => {
        const errorCode = error.code;
        setAuthUser(null);
        return [errorCode, true];
      });
  };
  const createUser = async (email, password) => {
    const auth = getSignupAuth(firebase);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      await signOut(auth);
      return [user, false];
    } catch (error) {
      return [error.code, true];
    }
  };
  const logout = () => {
    return signOut(firebase.auth)
      .then(() => {
        setAuthUser(null);
        localStorage.removeItem('token');
        return [null, false];
      })
      .catch((error) => {
        return [error.message, true];
      });
  };
  return { authenticate, authUser, logout, createUser };
};

export default Authentication;
