import axios from 'axios';

// In production, API calls will be relative to the same domain
const baseURL = process.env.NODE_ENV === 'production' 
  ? '/api'
  : process.env.REACT_APP_API_URL;

const uploadsURL = process.env.NODE_ENV === 'production'
  ? '/uploads'
  : process.env.REACT_APP_UPLOADS_URL;

const api = axios.create({
  baseURL: baseURL,
});

// Add uploads URL to api object
api.uploadsURL = uploadsURL;

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
