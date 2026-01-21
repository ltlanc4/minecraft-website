import React from 'react';

const Sidebar = ({ currentView, onNavigate, user }) => {
  return (
    <aside className="app-sidebar bg-body-secondary shadow" data-bs-theme="dark">
      
      {/* Sidebar Brand */}
      <div className="sidebar-brand">
        <a href="#" className="brand-link" onClick={() => onNavigate('dashboard')}>
           {/* Giả lập Logo */}
           <span className="brand-text fw-light">MC MANAGER</span>
        </a>
      </div>

      {/* Sidebar Wrapper */}
      <div className="sidebar-wrapper">
        <nav className="mt-2">
          <ul className="nav sidebar-menu flex-column" data-lte-toggle="treeview" role="menu" data-accordion="false">
            
            {/* Header Menu */}
            <li className="nav-header">MENU CHÍNH</li>

            {/* Item: Dashboard */}
            <li className="nav-item">
              <a 
                href="#" 
                className={`nav-link ${currentView === 'dashboard' ? 'active' : ''}`}
                onClick={() => onNavigate('dashboard')}
              >
                <i className="nav-icon fas fa-tachometer-alt"></i>
                <p>Tổng quan</p>
              </a>
            </li>

            {/* Item: Players */}
            <li className="nav-item">
              <a 
                href="#" 
                className={`nav-link ${currentView === 'players' ? 'active' : ''}`}
                onClick={() => onNavigate('players')}
              >
                <i className="nav-icon fas fa-users-cog"></i>
                <p>Quản lý Player</p>
              </a>
            </li>

            {/* Item: Map */}
            <li className="nav-item">
              <a 
                href="#" 
                className={`nav-link ${currentView === 'map' ? 'active' : ''}`}
                onClick={() => onNavigate('map')}
              >
                <i className="nav-icon fas fa-map-marked-alt"></i>
                <p>Bản đồ & Khu vực</p>
              </a>
            </li>

          </ul>
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;