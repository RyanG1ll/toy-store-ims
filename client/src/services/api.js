import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5001/api',
  ///api
});

// Auto logout on expired token
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If token expired or invalid it clears session and redirect to login
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      delete api.defaults.headers.common['Authorization'];
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;