import axios from 'axios';

const baseURL = process.env.NODE_ENV === 'production' 
  ? '/api'
  : process.env.REACT_APP_API_URL;

const api = axios.create({
  baseURL: baseURL,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
