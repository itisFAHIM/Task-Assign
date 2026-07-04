import axios from 'axios';

const api = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/`,
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});


// Setup response interceptor for token refresh (optional for now, but good practice)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Basic implementation: if 401, redirect to login (or refresh token)
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      // In a full implementation, you'd try to use the refresh token here
      // For simplicity in this timeframe, we just redirect to login if access token expires
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
