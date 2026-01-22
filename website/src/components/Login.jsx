import React, { useState } from 'react';
import axiosClient from '../api/axiosClient';
import Swal from 'sweetalert2';
import { motion } from 'framer-motion';

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
        // --- THÀNH CÔNG ---
        localStorage.setItem('accessToken', response.data.accessToken);
        localStorage.setItem('refreshToken', response.data.refreshToken);
        localStorage.setItem('mc_user', JSON.stringify(response.data.user));
        
        const Toast = Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, timerProgressBar: true });
        Toast.fire({ icon: 'success', title: `Xin chào, ${response.data.user.username}!` });
        
        onLoginSuccess(response.data.user);
      }
    } catch (err) {
      // --- THẤT BẠI ---
      console.log("Login failed:", err);

      let msg = "Lỗi kết nối Server!";
      
      if (err.response) {
          if (err.response.data && err.response.data.message) {
              msg = err.response.data.message;
          } else if (err.response.status === 403) {
              msg = "Bạn không có quyền truy cập (Sai Role)!";
          } else if (err.response.status === 401) {
              msg = "Sai tài khoản hoặc mật khẩu!";
          } else {
              msg = `Lỗi máy chủ (${err.response.status})`;
          }
      } else if (err.request) {
          msg = "Không thể kết nối đến Server.";
      } else {
          msg = err.message;
      }

      Swal.fire({
        icon: 'error',
        title: 'Đăng nhập thất bại',
        text: msg,
        confirmButtonColor: '#d33',
        confirmButtonText: 'Thử lại'
      });

      setPassword(''); // Chỉ xóa mật khẩu, không làm gì thêm
      
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <div className="login-page bg-body-secondary d-flex justify-content-center align-items-center vh-100 px-3">
      {/* motion.div này CHỈ CÓ tác dụng hiện dần (Fade In) lúc mới vào trang.
         Tuyệt đối không có logic rung lắc (shake) nào ở đây.
      */}
      <motion.div 
        className="login-box" 
        style={{ width: '100%', maxWidth: '430px' }}
        initial={{ opacity: 0, y: -20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.5 }}
      >
        <div className="card card-outline card-primary shadow-lg border-0">
          <div className="card-header text-center bg-white border-bottom-0 pt-4">
            <h1 className="h1 fw-bold text-primary">Minecraft <span className="text-dark">Panel</span></h1>
          </div>
          <div className="card-body px-4 pb-4">
            <p className="login-box-msg text-muted">Đăng nhập hệ thống</p>
            
            <form onSubmit={handleSubmit}>
              <div className="input-group mb-3">
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Tài khoản" 
                  value={username} 
                  onChange={(e) => setUsername(e.target.value)} 
                  required 
                  autoFocus
                />
                <div className="input-group-text bg-light"><span className="fas fa-user text-secondary"></span></div>
              </div>
              
              <div className="input-group mb-3">
                <input 
                  type="password" 
                  className="form-control" 
                  placeholder="Mật khẩu" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                />
                <div className="input-group-text bg-light"><span className="fas fa-lock text-secondary"></span></div>
              </div>
              
              <div className="row mt-4">
                <div className="col-12">
                  <button type="submit" className="btn btn-primary w-100 fw-bold py-2 shadow-sm" disabled={loading}>
                    {loading ? (
                       <span><i className="fas fa-spinner fa-spin me-2"></i> Đang xử lý...</span>
                    ) : (
                       <span>Đăng nhập <i className="fas fa-arrow-right ms-2"></i></span>
                    )}
                  </button>
                </div>
              </div>
            </form>

          </div>
          <div className="card-footer bg-white border-top-0 text-center pb-3">
             <small className="text-muted">Hệ Thống Quản Lý Server Minecraft 2026 &copy; Bim Bim Bam Bam</small>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
