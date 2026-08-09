import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('eps_access');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry && !original.url?.includes('/auth/login')) {
      original._retry = true;
      try {
        const refresh = localStorage.getItem('eps_refresh');
        const { data } = await axios.post('/api/auth/refresh', { refreshToken: refresh }, { withCredentials: true });
        localStorage.setItem('eps_access', data.data.accessToken);
        localStorage.setItem('eps_refresh', data.data.refreshToken);
        original.headers.Authorization = `Bearer ${data.data.accessToken}`;
        return api(original);
      } catch {
        localStorage.removeItem('eps_access');
        localStorage.removeItem('eps_refresh');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
