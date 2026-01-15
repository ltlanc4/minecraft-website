import React, { useState } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard'; // Giả định bạn có component này
import 'admin-lte/dist/css/adminlte.min.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import 'bootstrap/dist/css/bootstrap.min.css';

function App() {
  const [user, setUser] = useState(null);

  const handleLoginSuccess = (userData) => {
    // Lưu vào localStorage để khi F5 trang không bị mất login
    localStorage.setItem('mc_user', JSON.stringify(userData));
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('mc_user');
    setUser(null);
  };

  // Kiểm tra nếu đã có user thì vào Dashboard, chưa thì ở trang Login
  return (
    <div className="wrapper">
      {!user ? (
        <Login onLoginSuccess={handleLoginSuccess} />
      ) : (
        <Dashboard user={user} onLogout={handleLogout} />
      )}
    </div>
  );
}

export default App;
