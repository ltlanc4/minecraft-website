import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import PlayerManager from './components/PlayerManager';
import MapManager from './components/MapManager';
import Sidebar from './components/Sidebar';
import axiosClient from './api/axiosClient';
import { DataProvider } from './context/DataContext';

import 'admin-lte/dist/css/adminlte.min.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [currentView, setCurrentView] = useState('dashboard');

  useEffect(() => {
    const savedUser = localStorage.getItem('mc_user');
    const token = localStorage.getItem('accessToken');
    if (savedUser && token) setUser(JSON.parse(savedUser));
  }, []);

  const handleLogout = async () => {
    try { await axiosClient.post('/logout', { refreshToken: localStorage.getItem('refreshToken') }); } catch {}
    localStorage.clear(); setUser(null); setCurrentView('dashboard');
  };

  const handleSidebarToggle = (e) => {
    e.preventDefault();
    const body = document.body;
    window.innerWidth >= 992 ? body.classList.toggle('sidebar-collapse') : body.classList.toggle('sidebar-open');
  };

  const closeSidebar = () => {
    if (document.body.classList.contains('sidebar-open')) document.body.classList.remove('sidebar-open');
  };

  if (!user) return <Login onLoginSuccess={setUser} />;

  return (
    <DataProvider>
      <div className="app-wrapper">
        <nav className="app-header navbar navbar-expand bg-body">
          <div className="container-fluid">
            <ul className="navbar-nav">
              <li className="nav-item">
                <a className="nav-link" href="#" role="button" onClick={handleSidebarToggle}><i className="fas fa-bars"></i></a>
              </li>
            </ul>
            <ul className="navbar-nav ms-auto align-items-center me-4">
              <li className="nav-item d-none d-md-block me-3">
                <span className="text-secondary">Xin chào, <b className="text-dark">{user.username}</b></span>
              </li>
              <li className="nav-item">
                <button onClick={handleLogout} className="btn btn-outline-danger btn-sm fw-bold px-3">
                  <i className="fas fa-sign-out-alt me-1"></i> Đăng xuất
                </button>
              </li>
            </ul>
          </div>
        </nav>

        <Sidebar currentView={currentView} onNavigate={setCurrentView} user={user} />

        <main className="app-main">
          <div className="app-content-header"><div className="container-fluid"></div></div>
          <div className="app-content">
            <div className="container-fluid">
               <div key={currentView} className="fade-in-view">
                  {currentView === 'dashboard' && <Dashboard onNavigate={setCurrentView} />}
                  {currentView === 'players' && <PlayerManager />}
                  {currentView === 'map' && <MapManager onNavigate={setCurrentView} />}
               </div>
            </div>
          </div>
        </main>
        <div className="sidebar-overlay" onClick={closeSidebar}></div>
      </div>
    </DataProvider>
  );
}
export default App;