import axios from 'axios';

const fallbackPort = import.meta.env.VITE_BACKEND_PORT || '5000';
const baseURL = import.meta.env.VITE_API_BASE_URL || `${window.location.protocol}//${window.location.hostname}:${fallbackPort}`;

const api = axios.create({
  baseURL,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default api;
