import axios from 'axios';
import Swal from 'sweetalert2';

const axiosClient = axios.create({
  baseURL: `${process.env.API_URL}/api`,
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

    // --- QUAN TRỌNG: NẾU ĐANG ĐĂNG NHẬP THÌ BỎ QUA INTERCEPTOR ---
    // Để Login.jsx tự hiện thông báo lỗi, không được reload trang ở đây
    if (originalConfig.url === '/login' || originalConfig.url.includes('login')) {
        return Promise.reject(err);
    }
    // -------------------------------------------------------------

    // Xử lý Rate Limit (429)
    if (err.response && err.response.status === 429) {
       Swal.fire({
         icon: 'warning',
         title: 'Thao tác quá nhanh!',
         text: 'Vui lòng đợi một chút.',
         timer: 5000
       });
       return Promise.reject(err);
    }

    // Xử lý Token hết hạn (403) - CHỈ ÁP DỤNG KHI KHÔNG PHẢI LÀ LOGIN
    if (err.response?.status === 403 && !originalConfig._retry) {
      originalConfig._retry = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        // Nếu không có refresh token thì thôi, không gọi api refresh làm gì
        if (!refreshToken) throw new Error("No refresh token");

        const res = await axios.post(`${process.env.API_URL}/api/refresh`, { refreshToken });
        localStorage.setItem('accessToken', res.data.accessToken);
        originalConfig.headers.Authorization = `Bearer ${res.data.accessToken}`;
        return axiosClient(originalConfig);
      } catch (_error) {
        localStorage.clear();
        window.location.href = '/'; // Đá về trang login
        return Promise.reject(_error);
      }
    }
    
    return Promise.reject(err);
  }
);

export default axiosClient;