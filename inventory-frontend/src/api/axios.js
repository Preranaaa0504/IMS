import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:8000',
});

const getAccessToken = () => localStorage.getItem('token');
const getRefreshToken = () => localStorage.getItem('refresh');

API.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry &&
      getRefreshToken()
    ) {
      originalRequest._retry = true;

      try {
        const response = await axios.post('http://localhost:8000/api/token/refresh/', {
          refresh: getRefreshToken(),
        });

        const newAccessToken = response.data.access;
        localStorage.setItem('token', newAccessToken);

        originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
        return API.request(originalRequest);
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        localStorage.removeItem('token');
        localStorage.removeItem('refresh');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Order API methods
export const createOrder = (orderData) => API.post('/orders/', orderData);
export const getOrders = () => API.get('/orders/');
export const getOrderDetails = (id) => API.get(`/orders/${id}/`);

export default API;