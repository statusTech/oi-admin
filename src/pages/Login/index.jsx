import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

import Authentication from '@/service/auth';
import firebase from '@/firebase';
import Api from '@/api';
import logoBlue from '@/assets/images/logo_blue.png';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const history = useHistory();
  const { authenticate, authUser } = Authentication(firebase);

  const handleLogin = async (e) => {
    e.preventDefault();

    setLoading(true);
    setErrorMessage('');
    const [, error] = await authenticate(login, password);
    if (error) {
      setErrorMessage('Login Incorreto!');
    }

    setLoading(false);
  };

  const getToken = async (user) => {
    if (user && (user.uid === 'mIx721WKurVotrfVmggEOqKYCfl1' || user.uid === 'mxG5BZs7hUd1qsas4wKH6Lh0fZg1')) {
      // ID token = prova do login com senha; o backend não aceita só o uid.
      const idToken = await user.getIdToken();
      const { data, status, statusText } = await Api.post('/authenticateDash', {
        userKey: user.uid,
        idToken,
      });
      if (status === 200 && data.success) {
        localStorage.setItem('token', data.token);
        history.push('/dashboard');
      } else {
        setErrorMessage(data?.message ?? statusText);
      }
    }
  };

  useEffect(() => {
    getToken(authUser);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUser]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-oi-bg p-4">
      <section className="w-full max-w-sm bg-white border border-oi-border rounded-xl p-6 sm:p-8 flex flex-col gap-6 shadow-2xs">
        <div className="flex flex-col items-center gap-3">
          <img src={logoBlue} alt="Oi Tickets" className="h-8 w-auto object-contain" />
          <h1 className="text-lg sm:text-xl font-bold text-oi-text">Admin</h1>
        </div>

        <form autoComplete="off" onSubmit={handleLogin} className="flex flex-col gap-4">
          <FormField label="E-mail" htmlFor="login-email">
            <Input
              id="login-email"
              type="email"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              autoComplete="username"
            />
          </FormField>
          <FormField label="Senha" htmlFor="login-password" error={errorMessage}>
            <Input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </FormField>
          <Button type="submit" disabled={loading} className="w-full bg-oi-blue hover:bg-oi-blue/90 text-white">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Entrar'}
          </Button>
        </form>
      </section>
    </div>
  );
};

export default Login;
