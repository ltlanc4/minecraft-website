import React, { useState } from 'react';
import Swal from 'sweetalert2';

const MapManager = () => {
  const [regionName, setRegionName] = useState('');

  // Hàm gửi lệnh Flag đến WorldGuard
  const setFlag = async (flag, value) => {
    if (!regionName) {
      Swal.fire('Lỗi', 'Vui lòng nhập ID vùng (Region ID) trước!', 'error');
      return;
    }

    // Lệnh mẫu: /rg flag <region> <flag> <value>
    // Ví dụ: /rg flag spawn pvp deny
    const command = `rg flag ${regionName} ${flag} ${value}`;
    
    try {
      const response = await fetch('http://localhost:5000/api/player/command', { // Sử dụng API gửi lệnh chung
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command })
      });
      const data = await response.json();
      
      if (data.success) {
        Swal.fire('Thành công', `Đã đặt ${flag} thành ${value} cho vùng ${regionName}`, 'success');
      }
    } catch (err) {
      Swal.fire('Lỗi', 'Không thể kết nối Backend', 'error');
    }
  };

  return (
    <div className="content-wrapper">
      <section className="content-header">
        <h1>Bản đồ & Quản lý Khu vực</h1>
      </section>

      <section className="content">
        <div className="container-fluid">
          <div className="row">
            
            {/* CỘT 1: HIỂN THỊ MAP (Dùng Iframe) */}
            <div className="col-md-8">
              <div className="card card-dark">
                <div className="card-header">
                  <h3 className="card-title">Live Satellite Map</h3>
                </div>
                <div className="card-body p-0" style={{ height: '600px', overflow: 'hidden' }}>
                  {/* Thay địa chỉ bên dưới bằng IP server của bạn và port Dynmap */}
                  <iframe 
                    src="http://your-server-ip:8123" 
                    width="100%" 
                    height="100%" 
                    style={{ border: 'none' }}
                    title="Minecraft Map"
                  ></iframe>
                </div>
              </div>
            </div>

            {/* CỘT 2: ĐIỀU KHIỂN WORLDGUARD */}
            <div className="col-md-4">
              <div className="card card-primary">
                <div className="card-header">
                  <h3 className="card-title">Thiết lập Vùng (WorldGuard)</h3>
                </div>
                <div className="card-body">
                  <div className="form-group">
                    <label>Tên Vùng (Region ID)</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="Ví dụ: spawn, khipvp, thitran"
                      value={regionName}
                      onChange={(e) => setRegionName(e.target.value)}
                    />
                    <small className="text-muted">Bạn cần dùng Rìu gỗ tạo vùng trước trong Game.</small>
                  </div>

                  <hr />

                  <h5>Cấu hình nhanh (Flags)</h5>
                  
                  {/* PVP Group */}
                  <div className="mb-3">
                    <label className="d-block">Chế độ PVP:</label>
                    <button onClick={() => setFlag('pvp', 'allow')} className="btn btn-outline-danger btn-sm mr-2">Bật PVP</button>
                    <button onClick={() => setFlag('pvp', 'deny')} className="btn btn-outline-success btn-sm">Tắt PVP (Non-PVP)</button>
                  </div>

                  {/* Safe Zone Group */}
                  <div className="mb-3">
                    <label className="d-block">An toàn (Quái vật):</label>
                    <button onClick={() => setFlag('mob-spawning', 'deny')} className="btn btn-success btn-block">
                      <i className="fas fa-shield-alt"></i> Biến thành Khu Safe (No Mobs)
                    </button>
                    <button onClick={() => setFlag('mob-spawning', 'allow')} className="btn btn-default btn-sm btn-block mt-2">
                      Cho phép Quái xuất hiện lại
                    </button>
                  </div>

                  {/* Build Group */}
                  <div className="mb-3">
                    <label className="d-block">Xây dựng:</label>
                    <button onClick={() => setFlag('build', 'deny')} className="btn btn-warning btn-sm mr-2">Cấm xây dựng</button>
                    <button onClick={() => setFlag('build', 'allow')} className="btn btn-outline-secondary btn-sm">Cho phép xây</button>
                  </div>
                </div>
                <div className="card-footer">
                   <p className="text-xs text-danger uppercase">Lưu ý: Bạn phải cài plugin WorldGuard để tính năng này hoạt động.</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
};

export default MapManager;
