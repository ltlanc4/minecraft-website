import React from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { useData } from '../context/DataContext';
import { motion } from 'framer-motion'; // <--- Import

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const Dashboard = ({ onNavigate }) => {
  const { stats, onlineList, chartData } = useData();
  const tpsPercent = Math.min((stats.tps / 20) * 100, 100);
  const playerPercent = stats.maxPlayers > 0 ? (stats.players / stats.maxPlayers) * 100 : 0;

  const chartOptions = {
    responsive: true, maintainAspectRatio: false, animation: { duration: 1000, easing: 'easeOutQuart' },
    scales: { y: { min: 0, max: 100, grid: { color: '#f0f0f0', borderDash: [5, 5] }, ticks: { stepSize: 20 } }, x: { display: false, grid: { display: false } } },
    plugins: { legend: { position: 'top', align: 'center', labels: { usePointStyle: true, boxWidth: 8 } }, tooltip: { mode: 'index', intersect: false, backgroundColor: 'rgba(0,0,0,0.8)', padding: 10 } },
    interaction: { mode: 'nearest', axis: 'x', intersect: false }
  };

  return (
    // Thay div thường bằng motion.div
    <motion.div 
      className="content-wrapper"
      initial={{ opacity: 0, y: 20 }} // Hiện dần từ dưới lên 20px
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="content-header"><div className="container-fluid"><h1 className="m-0 fw-bold">Dashboard</h1></div></div>
      <section className="content">
        <div className="container-fluid">
          
          <div className="row">
            {/* Info Boxes giữ nguyên code cũ */}
            <div className="col-12 col-sm-6 col-md-3">
              <div className="info-box shadow-sm">
                <span className="info-box-icon bg-danger elevation-1"><i className="fas fa-microchip"></i></span>
                <div className="info-box-content"><span className="info-box-text text-muted">CPU Usage</span><span className="info-box-number h5 mb-1">{stats.cpu}%</span><div className="progress" style={{height:'4px'}}><div className="progress-bar bg-danger" style={{width:`${stats.cpu}%`}}></div></div></div>
              </div>
            </div>
            <div className="col-12 col-sm-6 col-md-3">
              <div className="info-box shadow-sm">
                <span className="info-box-icon bg-primary elevation-1"><i className="fas fa-memory"></i></span>
                <div className="info-box-content"><span className="info-box-text text-muted">RAM Usage</span><span className="info-box-number h5 mb-1">{stats.ram}</span><div className="progress" style={{height:'4px'}}><div className="progress-bar bg-primary" style={{width:`${stats.ram}%`}}></div></div></div>
              </div>
            </div>
            <div className="col-12 col-sm-6 col-md-3">
              <div className="info-box shadow-sm">
                <span className="info-box-icon bg-success elevation-1"><i className="fas fa-users"></i></span>
                <div className="info-box-content"><span className="info-box-text text-muted">Online Players</span><span className="info-box-number h5 mb-1">{stats.players} / {stats.maxPlayers}</span><div className="progress" style={{height:'4px'}}><div className="progress-bar bg-success" style={{width:`${playerPercent}%`}}></div></div></div>
              </div>
            </div>
            <div className="col-12 col-sm-6 col-md-3">
              <div className="info-box shadow-sm">
                <span className="info-box-icon bg-warning elevation-1"><i className="fas fa-tachometer-alt text-white"></i></span>
                <div className="info-box-content"><span className="info-box-text text-muted">TPS</span><span className="info-box-number h5 mb-1">{stats.tps}</span><div className="progress" style={{height:'4px'}}><div className="progress-bar bg-warning" style={{width:`${tpsPercent}%`}}></div></div></div>
              </div>
            </div>
          </div>

          <div className="row">
            <div className="col-md-8">
              <div className="card shadow-sm h-100">
                <div className="card-header border-0"><h3 className="card-title text-muted">Giám sát Tài nguyên</h3></div>
                <div className="card-body"><div className="chart" style={{ height: '350px' }}><Line data={chartData} options={chartOptions} /></div></div>
              </div>
            </div>

            <div className="col-md-4">
              <div className="card shadow-sm border-0 h-100">
                <div className="card-header bg-white border-bottom-0 py-3 d-flex justify-content-between align-items-center">
                  <h5 className="m-0 fw-bold text-dark d-flex align-items-center"><i className="fas fa-users me-2 text-primary"></i>Online</h5>
                  <span style={{ width: "65%" }}></span>
                  <span className="badge bg-success rounded-pill px-3 py-2" style={{fontSize: '0.9rem'}}>{onlineList.length} / {stats.maxPlayers}</span>
                </div>
                <div className="card-body p-0" style={{ maxHeight: '380px', overflowY: 'auto' }}>
                  {onlineList.length === 0 ? (
                    <div className="d-flex flex-column justify-content-center align-items-center py-5 text-muted"><div className="bg-light rounded-circle p-3 mb-3"><i className="fas fa-bed fa-2x text-secondary"></i></div><p className="mb-0 fw-bold">Server đang ngủ...</p></div>
                  ) : (
                    <ul className="list-group list-group-flush">
                      {onlineList.map((player, index) => (
                        <li key={index} className="list-group-item d-flex justify-content-between align-items-center px-4 py-3 border-0" onMouseEnter={e=>e.currentTarget.style.background='#f8f9fa'} onMouseLeave={e=>e.currentTarget.style.background='white'} style={{cursor:'pointer', transition:'0.2s'}}>
                          <div className="d-flex align-items-center">
                            <div className="position-relative">
                              <img src={`https://minotar.net/helm/${player}/40.png`} className="rounded-circle shadow-sm" alt="" width="45" height="45"/>
                              <span className="position-absolute bottom-0 end-0 bg-success border border-white rounded-circle" style={{width:12, height:12, right:2, bottom:2}}></span>
                            </div>
                            <div className="ms-3">
                              <span className="d-block fw-bold text-dark" style={{fontSize:'1rem'}}>{player}</span>
                              <small className="text-muted" style={{fontSize:'0.8rem'}}><i className="fas fa-signal text-success me-1" style={{fontSize:'0.7rem'}}></i> Ổn định</small>
                            </div>
                          </div>
                          <button className="btn btn-light btn-sm rounded-circle text-muted" onClick={()=>onNavigate('players')}><i className="fas fa-chevron-right"></i></button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="card-footer bg-white p-3 border-top-0">
                  <button onClick={()=>onNavigate('players')} className="btn btn-primary w-100 fw-bold shadow-sm py-2" style={{borderRadius:8, backgroundColor:'#0d6efd', border:'none'}}><i className="fas fa-cogs me-2"></i> Quản lý Player (Ban/Kick)</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </motion.div>
  );
};
export default Dashboard;