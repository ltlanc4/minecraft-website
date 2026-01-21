import axios from 'axios';
import Swal from 'sweetalert2'; // Import thêm Swal để hiện thông báo đẹp

const axiosClient = axios.create({
  baseURL: 'http://localhost:5000/api', // Đảm bảo đúng cổng Backend
  headers: { 'Content-Type': 'application/json' },
});

axiosClient.interceptors.request.use(async (config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

axiosClient.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalConfig = err.config;

    // --- XỬ LÝ LỖI RATE LIMIT (MỚI THÊM) ---
    if (err.response && err.response.status === 429) {
       Swal.fire({
         icon: 'warning',
         title: 'Thao tác quá nhanh!',
         text: 'Bạn đang gửi quá nhiều yêu cầu. Vui lòng đợi một chút.',
         timer: 5000
       });
       return Promise.reject(err);
    }
    // ---------------------------------------

    // XỬ LÝ HẾT HẠN TOKEN (GIỮ NGUYÊN)
    if (err.response?.status === 403 && !originalConfig._retry) {
      originalConfig._retry = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const res = await axios.post('http://localhost:5000/api/refresh', { refreshToken });
        localStorage.setItem('accessToken', res.data.accessToken);
        originalConfig.headers.Authorization = `Bearer ${res.data.accessToken}`;
        return axiosClient(originalConfig);
      } catch (_error) {
        localStorage.clear();
        window.location.href = '/';
        return Promise.reject(_error);
      }
    }
    return Promise.reject(err);
  }
);

export default axiosClient;