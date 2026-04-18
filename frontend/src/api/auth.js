import axios from 'axios';

// In production (served from backend), use relative path so requests go to same origin.
// In development, Vite proxy handles /api → backend. Override via VITE_API_URL if needed.
const baseUrl = import.meta.env.VITE_API_URL || '/api';

const API = axios.create({
  baseURL: baseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token to every request automatically
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');

  if (token && token !== "undefined" && token !== "null") {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Handle 401 globally (token expired)
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const signupUser = (data) => API.post('/auth/signup', data);
export const loginUser = (data) => API.post('/auth/login', data);
export const getMe = () => API.get('/auth/me');
export const getAllUsers = () => API.get('/users/all');
export const deleteUser = (userId) => API.delete(`/users/${userId}`);

export default API;
