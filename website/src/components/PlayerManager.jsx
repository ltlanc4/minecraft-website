import React, { useState } from 'react';
import axiosClient from '../api/axiosClient';
import Swal from 'sweetalert2';
import { useData } from '../context/DataContext';
import { motion } from 'framer-motion';

const PlayerManager = () => {
  const [activeTab, setActiveTab] = useState('online');
  const { onlineList, bannedList, refreshData } = useData();

  // Regex kiểm tra tên Minecraft hợp lệ (Chữ, số, gạch dưới, 3-16 ký tự)
  const isValidName = (name) => /^[a-zA-Z0-9_]{3,16}$/.test(name);

  const handleAction = async (player, actionType) => {
    // Validate trước khi hiện Popup
    if (!isValidName(player)) {
        return Swal.fire('Lỗi', 'Tên người chơi không hợp lệ (Chứa ký tự lạ)', 'error');
    }

    const { value: reason, isDismissed } = await Swal.fire({
      title: `${actionType.toUpperCase()} ${player}?`,
      input: 'text',
      inputPlaceholder: 'Nhập lý do (Không bắt buộc)...',
      showCancelButton: true,
      confirmButtonText: 'Xác nhận',
      confirmButtonColor: actionType === 'ban' ? '#d33' : '#ffc107',
    });

    if (isDismissed) return;

    try {
      const res = await axiosClient.post(`/player/${actionType}`, { player, reason: reason || "Admin Action" });
      if (res.data.success) {
        Swal.fire('Thành công', res.data.message, 'success');
        refreshData();
      } else {
        Swal.fire('Lỗi', res.data.message, 'error');
      }
    } catch (err) {
      // AxiosClient đã xử lý lỗi 429, ở đây chỉ catch lỗi khác
      if (err.response?.status !== 429) Swal.fire('Lỗi', 'Lỗi kết nối hoặc Server', 'error');
    }
  };

  const handleUnban = async (player) => {
    const result = await Swal.fire({ title: `Gỡ cấm ${player}?`, icon: 'question', showCancelButton: true, confirmButtonColor: '#28a745' });
    if (!result.isConfirmed) return;
    try {
      const res = await axiosClient.post('/player/unban', { player });
      if (res.data.success) {
        Swal.fire('OK', 'Đã Unban', 'success');
        refreshData();
      } else { Swal.fire('Lỗi', res.data.message, 'error'); }
    } catch { Swal.fire('Lỗi', 'Lỗi API', 'error'); }
  };

  const handleOpAction = async (player, action) => {
      const isOp = action === 'op';
      const { value: inputValue, isDismissed } = await Swal.fire({
          title: isOp ? `CẤP QUYỀN OP?` : `HỦY QUYỀN OP?`,
          html: `Nhập lại tên <b>${player}</b> để xác nhận.`,
          icon: 'warning',
          input: 'text',
          inputPlaceholder: player,
          showCancelButton: true,
          confirmButtonText: isOp ? 'Cấp ngay' : 'Hủy ngay',
          confirmButtonColor: isOp ? '#ffc107' : '#6c757d',
          preConfirm: (input) => {
              if (input !== player) Swal.showValidationMessage(`Tên không khớp!`);
              // Thêm check Regex ở đây nữa cho chắc
              if (!isValidName(input)) Swal.showValidationMessage(`Tên chứa ký tự cấm!`);
          }
      });

      if (isDismissed) return;
      
      try {
        await axiosClient.post(`/player/${action}`, { player });
        Swal.fire('Thành công', `Đã ${isOp?'Trao':'Tước'} quyền OP`, 'success');
      } catch (err) {
        console.error(err);
      }
  };

  return (
    <motion.div 
      className="content-wrapper"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      <section className="content-header"><div className="container-fluid"><h1 className="fw-bold">Quản lý Người chơi</h1></div></section>
      <section className="content">
        <div className="container-fluid">
          <div className="card card-primary card-outline card-outline-tabs border-0 shadow-none bg-transparent">
            <div className="card-header p-0 border-bottom-0 mb-3 bg-white rounded shadow-sm">
              <ul className="nav nav-tabs">
                <li className="nav-item"><a className={`nav-link ${activeTab==='online'?'active fw-bold':''}`} onClick={()=>setActiveTab('online')} href="#"><i className="fas fa-signal me-2 text-success"></i>Online ({onlineList.length})</a></li>
                <li className="nav-item"><a className={`nav-link ${activeTab==='banned'?'active fw-bold':''}`} onClick={()=>setActiveTab('banned')} href="#"><i className="fas fa-ban me-2 text-danger"></i>Banned ({bannedList.length})</a></li>
              </ul>
            </div>
            
            <div className="card-body p-0">
              <div className="d-flex justify-content-end mb-3">
                 <button className="btn btn-sm btn-light shadow-sm text-primary fw-bold" onClick={refreshData}><i className="fas fa-sync-alt me-1"></i> Làm mới danh sách</button>
              </div>

              {activeTab === 'online' && (
                 <div className="list-group bg-transparent"> 
                   {onlineList.length === 0 ? (
                      <div className="text-center py-5 text-muted bg-white rounded shadow-sm"><i className="fas fa-ghost fa-2x mb-2"></i><p>Không có ai online</p></div>
                   ) : (
                      onlineList.map((p, i) => (
                        <div key={i} className="list-group-item border-0 shadow-sm rounded mb-2 py-3">
                          <div className="row align-items-center g-3"> 
                            <div className="col-12 col-md-6 d-flex align-items-center">
                              <div className="position-relative">
                                <img src={`https://minotar.net/helm/${p}/40.png`} className="rounded shadow-sm border" alt="" width="48" height="48"/>
                                <span className="position-absolute bottom-0 end-0 bg-success border border-white rounded-circle" style={{width:14, height:14}}></span>
                              </div>
                              <div className="ms-3">
                                <span className="fw-bold d-block text-dark" style={{fontSize:'1.1rem'}}>{p}</span>
                                <small className="text-muted bg-light px-2 py-1 rounded" style={{fontSize:'0.8rem'}}><i className="fas fa-wifi text-success me-1"></i>Ổn định</small>
                              </div>
                            </div>
                            <div className="col-12 col-md-6">
                              <div className="d-flex flex-wrap justify-content-start justify-content-md-end gap-2">
                                <button onClick={()=>handleAction(p,'kick')} className="btn btn-outline-warning btn-sm fw-bold px-3">Kick</button>
                                <button onClick={()=>handleAction(p,'ban')} className="btn btn-outline-danger btn-sm fw-bold px-3">Ban</button>
                                <div className="vr d-none d-md-block mx-1"></div>
                                <button onClick={()=>handleOpAction(p,'op')} className="btn btn-outline-primary btn-sm fw-bold px-3">OP</button>
                                <button onClick={()=>handleOpAction(p,'deop')} className="btn btn-outline-secondary btn-sm fw-bold px-3">Deop</button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                   )}
                 </div>
              )}

              {activeTab === 'banned' && (
                  <div className="list-group bg-transparent">
                    {bannedList.length === 0 ? (
                        <div className="text-center py-5 text-muted bg-white rounded shadow-sm"><i className="fas fa-check-circle fa-2x mb-2 text-success"></i><p>Danh sách sạch sẽ</p></div>
                    ) : (
                        bannedList.map((p, i) => (
                            <div key={i} className="list-group-item border-0 shadow-sm rounded mb-2 py-3">
                                <div className="d-flex justify-content-between align-items-center">
                                    <div className="d-flex align-items-center">
                                        <div className="bg-danger bg-opacity-10 p-2 rounded me-3 text-danger"><i className="fas fa-user-slash fa-lg"></i></div>
                                        <div><span className="fw-bold text-dark d-block">{p}</span><small className="text-danger">Đang bị cấm</small></div>
                                    </div>
                                    <button onClick={()=>handleUnban(p)} className="btn btn-success btn-sm shadow-sm px-3 fw-bold"><i className="fas fa-unlock-alt me-1"></i> Gỡ</button>
                                </div>
                            </div>
                        ))
                    )}
                  </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </motion.div>
  );
};
export default PlayerManager;
