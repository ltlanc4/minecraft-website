import React, { useState } from 'react';
import axiosClient from '../api/axiosClient';
import Swal from 'sweetalert2';
import { motion } from 'framer-motion';

const MapManager = ({ onNavigate }) => {
  // CẤU HÌNH IP BACKEND ĐỂ CHẠY PROXY
  // Proxy sẽ là: http://localhost:5000/api/map/
  const API_URL = `${process.env.API_URL}`;
  const MAP_PROXY_URL = `${API_URL.replace("undefined", "/")}map`; 

  const [isLoading, setIsLoading] = useState(true); 

  return (
    <motion.div 
      className="content-wrapper p-0"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}
      style={{ height: 'calc(100vh - 107px)', position: 'relative', overflow: 'hidden' }}
    >
      {/* 1. MAP IFRAME (GỌI QUA PROXY) */}
      <iframe 
          src={MAP_PROXY_URL}
          title="Minecraft Map"
          width="100%"
          height="100%"
          style={{ border: 'none', display: 'block', backgroundColor: '#f4f6f9' }}
          onLoad={() => setIsLoading(false)}
      />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="position-absolute top-0 start-0 w-100 h-100 bg-white d-flex flex-column justify-content-center align-items-center" style={{zIndex: 5}}>
            <div className="spinner-border text-primary" role="status"></div>
            <p className="mt-2 text-muted fw-bold">Đang kết nối API Map...</p>
        </div>
      )}
    </motion.div>
  );
};

export default MapManager;
