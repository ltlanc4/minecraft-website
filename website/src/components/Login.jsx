import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

const Login = ({ onLoginSuccess }) => {
  // 1. Khởi tạo State cho Form và Dữ liệu
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [accounts, setAccounts] = useState([]);

  // 2. Load file account.json khi trang web khởi động
  useEffect(() => {
    fetch('/data/accounts.json') // Đảm bảo file nằm trong public/data/accounts.json
      .then((res) => res.json())
      .then((data) => setAccounts(data))
      .catch((err) => console.error("Lỗi tải dữ liệu tài khoản:", err));
  }, []);

  // 3. Xử lý logic Đăng nhập
  const handleLogin = (e) => {
    e.preventDefault();

    // Tìm kiếm tài khoản trùng khớp
    const user = accounts.find(
      (acc) => acc.username === username && acc.password === password
    );

    if (user) {
      if (user.permission === 1) {
        Swal.fire({
        icon: 'success',
        title: 'Thành công',
        text: 'Đang chuyển hướng vào bảng điều khiển...',
        timer: 1500,
        showConfirmButton: false
      });
      onLoginSuccess(user); // Gửi dữ liệu user về App.js
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Thất bại',
          text: 'Bạn không có quyền truy cập',
        });
      }
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Thất bại',
        text: 'Sai tên đăng nhập hoặc mật khẩu!',
      });
    }
  };

  return (
    <div className="login-page" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="login-box">
        <div className="login-logo">
          <a href="/"><b>Reicon Minecraft</b></a>
        </div>

        <div className="card">
          <div className="card-body login-card-body">
            <p className="login-box-msg">Đăng nhập</p>

            <form onSubmit={handleLogin}>
              <div className="input-group mb-3">
                <input 
                  type="text"
                  name="username" 
                  className="form-control" 
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>

              <div className="input-group mb-3">
                <input 
                  name="password" 
                  type="password" 
                  className="form-control" 
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div className="row">
                <div className="col-12 d-flex justify-content-center">
                  <button type="submit" className="btn btn-primary px-5">
                    Đăng nhập
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
