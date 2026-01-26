import React, { useState } from 'react';
import axiosClient from '../api/axiosClient';
import Swal from 'sweetalert2';
import { motion } from 'framer-motion';

const MapManager = ({ onNavigate }) => {
  // CẤU HÌNH IP BACKEND ĐỂ CHẠY PROXY
  // Proxy sẽ là: http://localhost:5000/api/map/
  const MAP_PROXY_URL = `${process.env.API_URL}/api/map/`; 

  const [isLoading, setIsLoading] = useState(true);
  const [consoleOutput, setConsoleOutput] = useState(""); 
  const [targetPlayer, setTargetPlayer] = useState("");
  const [customCmd, setCustomCmd] = useState("");
  const [showTools, setShowTools] = useState(true); 

  // Hàm gửi lệnh vào API backend mới (/api/rcon/execute)
  const sendCommand = async (cmd) => {
    if (!cmd) return;
    
    // Hiển thị log đang gửi
    setConsoleOutput(prev => `> ${cmd}\nĐang gửi...\n` + prev);

    try {
      // Gọi API execute (Lưu ý: axiosClient đã có base URL là /api rồi)
      // Nên ta gọi endpoint là /rcon/execute
      const res = await axiosClient.post('/rcon/execute', { command: cmd });
      
      if (res.data.success) {
        setConsoleOutput(prev => `[Server]: ${res.data.message}\n` + prev);
      } else {
        setConsoleOutput(prev => `[Lỗi]: ${res.data.message}\n` + prev);
      }
    } catch (err) {
      setConsoleOutput(prev => `[Lỗi Kết Nối]: ${err.message}\n` + prev);
    }
  };

  const handleFlanAction = (action) => {
    switch (action) {
      case 'adminMode':
        sendCommand('flan adminMode');
        break;
      case 'listClaims':
        if (!targetPlayer) return Swal.fire('Thiếu tên', 'Vui lòng nhập tên người chơi!', 'warning');
        sendCommand(`flan list ${targetPlayer}`); 
        break;
      case 'deleteClaims':
        if (!targetPlayer) return Swal.fire('Nguy hiểm', 'Vui lòng nhập tên người chơi!', 'warning');
        Swal.fire({
            title: `Xóa đất của ${targetPlayer}?`,
            text: "Hành động này không thể hoàn tác!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Xóa ngay'
        }).then((result) => {
            if (result.isConfirmed) {
                sendCommand(`flan delete all ${targetPlayer}`);
            }
        });
        break;
      case 'reload':
        sendCommand('flan reload');
        break;
      default:
        break;
    }
  };

  return (
    <motion.div 
      className="content-wrapper p-0"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}
      style={{ height: 'calc(100vh - 57px)', position: 'relative', overflow: 'hidden' }}
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

      {/* 2. NÚT BẬT/TẮT TOOLBOX */}
      <button 
        className="btn btn-primary position-absolute shadow" 
        style={{ top: 20, right: 20, zIndex: 10 }}
        onClick={() => setShowTools(!showTools)}
      >
        <i className={`fas ${showTools ? 'fa-times' : 'fa-tools'}`}></i>
      </button>

      {/* 3. FLAN TOOLBOX (Floating Sidebar) */}
      {showTools && (
        <motion.div 
          initial={{ x: 300 }} animate={{ x: 0 }}
          className="position-absolute bg-white shadow-lg rounded-start"
          style={{ 
            top: 70, right: 0, bottom: 20, width: '320px', zIndex: 9,
            display: 'flex', flexDirection: 'column'
          }}
        >
          <div className="p-3 bg-primary text-white rounded-top-start d-flex justify-content-between align-items-center">
            <h5 className="m-0 fw-bold"><i className="fas fa-shield-alt me-2"></i>Quản lý FLAN</h5>
          </div>

          <div className="p-3 overflow-auto flex-grow-1">
            {/* Quick Actions */}
            <div className="mb-3">
                <label className="form-label fw-bold text-muted small text-uppercase">Hệ thống</label>
                <div className="d-flex gap-2">
                    <button className="btn btn-outline-warning flex-grow-1 btn-sm fw-bold" onClick={() => handleFlanAction('adminMode')}>
                        <i className="fas fa-user-shield me-1"></i> Admin Mode
                    </button>
                    <button className="btn btn-outline-secondary flex-grow-1 btn-sm fw-bold" onClick={() => handleFlanAction('reload')}>
                        <i className="fas fa-sync me-1"></i> Reload
                    </button>
                </div>
            </div>

            <hr className="my-3 opacity-25"/>

            {/* Player Manager */}
            <div className="mb-3">
                <label className="form-label fw-bold text-muted small text-uppercase">Người chơi & Đất</label>
                <input 
                    type="text" 
                    className="form-control mb-2" 
                    placeholder="Nhập tên người chơi..." 
                    value={targetPlayer}
                    onChange={(e) => setTargetPlayer(e.target.value)}
                />
                <div className="d-grid gap-2">
                    <button className="btn btn-info text-white btn-sm fw-bold" onClick={() => handleFlanAction('listClaims')}>
                        <i className="fas fa-list me-1"></i> Liệt kê đất
                    </button>
                    <button className="btn btn-danger btn-sm fw-bold" onClick={() => handleFlanAction('deleteClaims')}>
                        <i className="fas fa-trash-alt me-1"></i> Xóa TOÀN BỘ đất
                    </button>
                </div>
            </div>

            <hr className="my-3 opacity-25"/>

            {/* Custom Command */}
            <div className="mb-3">
                <label className="form-label fw-bold text-muted small text-uppercase">Gửi lệnh tùy chỉnh</label>
                <div className="input-group">
                    <input 
                        type="text" 
                        className="form-control" 
                        placeholder="VD: flan info..."
                        value={customCmd}
                        onChange={(e) => setCustomCmd(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && sendCommand(customCmd)}
                    />
                    <button className="btn btn-dark" onClick={() => sendCommand(customCmd)}>
                        <i className="fas fa-paper-plane"></i>
                    </button>
                </div>
            </div>
          </div>

          {/* Console Output Mini */}
          <div className="bg-dark text-light p-2 font-monospace" style={{ height: '150px', fontSize: '0.8rem', overflowY: 'auto' }}>
            <div className="fw-bold border-bottom border-secondary mb-1 pb-1 text-warning">
                <i className="fas fa-terminal me-2"></i>Console Log
            </div>
            <pre className="m-0 text-break" style={{whiteSpace: 'pre-wrap'}}>{consoleOutput || "Sẵn sàng..."}</pre>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default MapManager;
