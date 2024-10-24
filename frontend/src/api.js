import axios from 'axios';

// In production, API calls will be relative to the same domain
const baseURL = process.env.NODE_ENV === 'production' 
  ? '/api'  // In production, use relative path
  : 'http://localhost:5000/api';  // In development, use full URL

const uploadsURL = process.env.NODE_ENV === 'production'
  ? '/uploads'
  : process.env.REACT_APP_UPLOADS_URL;

const api = axios.create({
  baseURL: baseURL,
});

// Add uploads URL to api object
api.uploadsURL = uploadsURL;

// Add request interceptor for auth token
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
