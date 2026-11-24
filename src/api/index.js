import axios from 'axios';

const Api = axios.create({
    // baseURL: 'http://34.71.33.60:3030/api/v1',
    baseURL: import.meta.env.VITE_ENDPOINT
});

Api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default Api;
