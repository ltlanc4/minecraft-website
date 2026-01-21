import React, { useState } from 'react';
import axiosClient from '../api/axiosClient';
import Swal from 'sweetalert2';
import { motion } from 'framer-motion'; // <--- Import này

const Login = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axiosClient.post('/login', { username, password });
      if (response.data.success) {
        localStorage.setItem('accessToken', response.data.accessToken);
        localStorage.setItem('refreshToken', response.data.refreshToken);
        localStorage.setItem('mc_user', JSON.stringify(response.data.user));
        onLoginSuccess(response.data.user);
        const Toast = Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 3000 });
        Toast.fire({ icon: 'success', title: 'Đăng nhập thành công' });
      }
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Thất bại', text: err.response?.data?.message || 'Lỗi kết nối' });
    } finally { setLoading(false); }
  };

  return (
    <div className="login-page bg-body-secondary d-flex justify-content-center align-items-center vh-100">
      {/* Thêm motion.div bao quanh login-box */}
      <motion.div 
        className="login-box" 
        style={{ width: '360px' }}
        initial={{ opacity: 0, y: -50 }} // Bắt đầu: mờ và ở trên cao
        animate={{ opacity: 1, y: 0 }}    // Kết thúc: rõ và về vị trí chuẩn
        transition={{ duration: 0.5 }}    // Thời gian: 0.5 giây
      >
        <div className="card card-outline card-primary shadow-lg">
          <div className="card-header text-center">
            <h1 className="h1"><b>Minecraft</b> Panel</h1>
          </div>
          <div className="card-body">
            <p className="login-box-msg">Đăng nhập hệ thống quản trị</p>
            <form onSubmit={handleSubmit}>
              <div className="input-group mb-3">
                <input type="text" className="form-control" placeholder="Tài khoản" value={username} onChange={(e) => setUsername(e.target.value)} required />
                <div className="input-group-text"><span className="fas fa-user"></span></div>
              </div>
              <div className="input-group mb-3">
                <input type="password" className="form-control" placeholder="Mật khẩu" value={password} onChange={(e) => setPassword(e.target.value)} required />
                <div className="input-group-text"><span className="fas fa-lock"></span></div>
              </div>
              <div className="row">
                <div className="col-12">
                  <button type="submit" className="btn btn-primary w-100 fw-bold" disabled={loading}>
                    {loading ? <i className="fas fa-spinner fa-spin"></i> : 'Đăng nhập'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
export default Login;