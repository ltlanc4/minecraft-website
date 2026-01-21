import React from 'react';
import { motion } from 'framer-motion'; // <--- Import

const MapManager = ({ onNavigate }) => {
  return (
    <motion.div 
      className="content-wrapper"
      initial={{ scale: 0.95, opacity: 0 }} // Zoom nhẹ từ nhỏ ra
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <section className="content-header"><div className="container-fluid"><h1 className="fw-bold">Bản đồ & Khu vực</h1></div></section>
      <section className="content">
        <div className="container-fluid">
          <div className="card shadow-sm border-0 rounded-3">
            <div className="card-body text-center py-5">
               <div className="mb-4 position-relative d-inline-block">
                  <i className="fas fa-map-marked-alt fa-5x text-secondary opacity-25" style={{ transform: 'scale(1.2)' }}></i>
                  <i className="fas fa-hard-hat fa-3x text-warning position-absolute bottom-0 end-0 border border-4 border-white rounded-circle bg-white p-1"></i>
               </div>
               <h2 className="fw-bold text-dark mt-3">Sắp ra mắt!</h2>
               <p className="text-muted fs-5 mb-4">Tính năng quản lý WorldGuard và Dynmap đang được xây dựng.</p>
               <div className="progress mx-auto mb-4 shadow-inner" style={{ maxWidth: 300, height: 8 }}>
                  <div className="progress-bar progress-bar-striped progress-bar-animated bg-primary" style={{ width: '65%' }}></div>
               </div>
               {onNavigate && (<button className="btn btn-outline-primary fw-bold px-4 py-2 rounded-pill" onClick={() => onNavigate('dashboard')}><i className="fas fa-arrow-left me-2"></i> Quay về Dashboard</button>)}
            </div>
          </div>
        </div>
      </section>
    </motion.div>
  );
};
export default MapManager;