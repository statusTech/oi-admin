import React, { useEffect, useState } from 'react';
import { Grid, TextField, CircularProgress, Button, Typography } from '@material-ui/core';
import styled from 'styled-components';
import { useHistory } from 'react-router-dom';

import CardContainer from '../../components/CardContainer';
import InputPassword from '../../components/Input/Password';

import Authentication from '../../service/auth';
import firebase from '../../firebase';
import Api from '../../api';
const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
`;

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [openAlert, setOpenAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const history = useHistory();
  const { authenticate, authUser } = Authentication(firebase);

  const handleLogin = async (e) => {
    e.preventDefault();

    setLoading(true);
    const [, error] = await authenticate(login, password);
    if (error) {
      setOpenAlert(true);
      setAlertMessage('Login Incorreto!');
    }
    
    setLoading(false);
  };
  const getToken = async(user) => {
    
    if(user && (user.uid === 'mIx721WKurVotrfVmggEOqKYCfl1' || authUser.uid === 'mxG5BZs7hUd1qsas4wKH6Lh0fZg1')) {
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
        alert(data?.message ?? statusText);
      }
    }
  }
  useEffect(() => {
    getToken(authUser);
  }, [authUser]);
  return (
    <Container>
      <CardContainer
        alert={{
          severity: 'error',
          openned: openAlert,
          onClose: () => {
            setOpenAlert(false);
          },
          message: alertMessage,
        }}
      >
        <form autoComplete='off' onSubmit={handleLogin}>
          <Grid container direction='column' spacing={2}>
            <Typography variant='h5' align='center' component='div'>
              Admin
            </Typography>
            <Grid item lg={12} md={12} sm={12} xs={12}>
              <TextField
                label='E-mail'
                value={login}
                style={{ backgroundColor: '#fff', borderRadius: 5 }}
                onChange={(e) => setLogin(e.target.value)}
                variant='outlined'
                fullWidth
              />
            </Grid>
            <Grid item lg={12} md={12} sm={12} xs={12}>
              <InputPassword
                label='Senha'
                value={password}
                style={{ backgroundColor: '#fff', borderRadius: 5 }}
                type='password'
                onChange={(e) => setPassword(e.target.value)}
                variant='outlined'
                fullWidth
              />
            </Grid>
            <Grid item lg={12} md={12} sm={12} xs={12}>
              <Button
                type='submit'
                variant='outlined'
                style={{
                  backgroundColor: '#0097FF',
                  borderRadius: 5,
                  color: '#FFF',
                }}
                fullWidth
              >
                {loading && <CircularProgress color='inherit' size={25} />}
                {!loading && 'Entrar'}
              </Button>
            </Grid>
          </Grid>
        </form>
      </CardContainer>
    </Container>
  );
};

export default Login;
