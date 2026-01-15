import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// Đăng ký các thành phần cho Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const Dashboard = () => {
  // --- STATE QUẢN LÝ DỮ LIỆU ---
  const [stats, setStats] = useState({
    cpu: 0,
    ram: 0,
    players: 0,
    maxPlayers: 100,
    tps: 20.0
  });

  // Dữ liệu lịch sử để vẽ biểu đồ (lưu 20 điểm dữ liệu gần nhất)
  const [chartData, setChartData] = useState({
    labels: Array(20).fill(''),
    cpuHistory: Array(20).fill(0),
    ramHistory: Array(20).fill(0)
  });
  
  // Fetch dữ liệu từ Backend
  // useEffect(() => {
  //   const fetchData = async () => {
  //     try {
  //       const response = await fetch('http://localhost:5000/api/dashboard');
  //       const data = await response.json();

  //       // Cập nhật State
  //       setStats({
  //         cpu: data.hardware.cpu,
  //         ram: data.hardware.ram,
  //         players: data.minecraft.online,
  //         maxPlayers: data.minecraft.max,
  //         playerList: data.minecraft.list
  //       });

  //       // Cập nhật Chart
  //       setChartData(prev => ({
  //         ...prev,
  //         cpuHistory: [...prev.cpuHistory.slice(1), data.hardware.cpu],
  //         ramHistory: [...prev.ramHistory.slice(1), data.hardware.ram]
  //       }));

  //     } catch (error) {
  //       console.error("Lỗi kết nối Backend:", error);
  //     }
  //   };

  //   fetchData();
  //   const interval = setInterval(fetchData, 3000); // Tăng lên 3s để đỡ spam RCON
  //   return () => clearInterval(interval);
  // }, []);

  // --- GIẢ LẬP DỮ LIỆU THỜI GIAN THỰC (SIMULATION) ---
  useEffect(() => {
    const interval = setInterval(() => {
      // Giả lập số liệu ngẫu nhiên
      const newCpu = Math.floor(Math.random() * (60 - 20) + 20); // 20% - 60%
      const newRam = Math.floor(Math.random() * (80 - 40) + 40); // 40% - 80%
      const newPlayers = Math.floor(Math.random() * 15) + 5;     // 5 - 20 người
      const newTps = (20 - Math.random() * 0.5).toFixed(1);      // 19.5 - 20.0

      setStats({
        cpu: newCpu,
        ram: newRam,
        players: newPlayers,
        maxPlayers: 100,
        tps: newTps
      });

      // Cập nhật biểu đồ (Đẩy số mới vào, bỏ số cũ đi)
      setChartData(prev => {
        const newCpuHist = [...prev.cpuHistory.slice(1), newCpu];
        const newRamHist = [...prev.ramHistory.slice(1), newRam];
        return {
          ...prev,
          cpuHistory: newCpuHist,
          ramHistory: newRamHist
        };
      });
    }, 2000); // Cập nhật mỗi 2 giây

    return () => clearInterval(interval);
  }, []);

  // --- CẤU HÌNH BIỂU ĐỒ ---
  const data = {
    labels: chartData.labels,
    datasets: [
      {
        label: 'CPU Usage (%)',
        data: chartData.cpuHistory,
        borderColor: '#dc3545', // Màu đỏ (Danger của AdminLTE)
        backgroundColor: 'rgba(220, 53, 69, 0.2)',
        tension: 0.4, // Làm mềm đường cong
        fill: true,
      },
      {
        label: 'RAM Usage (%)',
        data: chartData.ramHistory,
        borderColor: '#007bff', // Màu xanh (Primary của AdminLTE)
        backgroundColor: 'rgba(0, 123, 255, 0.2)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' },
    },
    scales: {
      y: { min: 0, max: 100 }, // Trục Y luôn từ 0 đến 100%
      x: { display: false }    // Ẩn trục X cho gọn
    },
    animation: { duration: 0 } // Tắt animation để đường chạy mượt mà theo thời gian thực
  };

  // --- GIAO DIỆN (JSX) ---
  return (
    <div className="content-wrapper">
      {/* Header */}
      <div className="content-header">
        <div className="container-fluid">
          <div className="row mb-2">
            <div className="col-sm-6">
              <h1 className="m-0">Dashboard</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <section className="content">
        <div className="container-fluid">
          
          {/* 1. INFO BOXES (Các ô thống kê trên cùng) */}
          <div className="row">
            {/* CPU Box */}
            <div className="col-12 col-sm-6 col-md-3">
              <div className="info-box mb-3">
                <span className="info-box-icon bg-danger elevation-1"><i className="fas fa-microchip"></i></span>
                <div className="info-box-content">
                  <span className="info-box-text">CPU Usage</span>
                  <span className="info-box-number">{stats.cpu}%</span>
                </div>
              </div>
            </div>

            {/* RAM Box */}
            <div className="col-12 col-sm-6 col-md-3">
              <div className="info-box mb-3">
                <span className="info-box-icon bg-primary elevation-1"><i className="fas fa-memory"></i></span>
                <div className="info-box-content">
                  <span className="info-box-text">RAM Usage</span>
                  <span className="info-box-number">{stats.ram}%</span>
                </div>
              </div>
            </div>

            {/* Players Box */}
            <div className="col-12 col-sm-6 col-md-3">
              <div className="info-box mb-3">
                <span className="info-box-icon bg-success elevation-1"><i className="fas fa-users"></i></span>
                <div className="info-box-content">
                  <span className="info-box-text">Online Players</span>
                  <span className="info-box-number">{stats.players} / {stats.maxPlayers}</span>
                </div>
              </div>
            </div>

            {/* TPS Box (Quan trọng cho Minecraft) */}
            <div className="col-12 col-sm-6 col-md-3">
              <div className="info-box mb-3">
                <span className="info-box-icon bg-warning elevation-1"><i className="fas fa-tachometer-alt"></i></span>
                <div className="info-box-content">
                  <span className="info-box-text">TPS (Tick/s)</span>
                  <span className={`info-box-number ${stats.tps < 18 ? 'text-danger' : ''}`}>
                    {stats.tps}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 2. MAIN ROW: CHART & QUICK LIST */}
          <div className="row">
            {/* Chart Column */}
            <div className="col-md-8">
              <div className="card">
                <div className="card-header">
                  <h5 className="card-title">Giám sát Tài nguyên (Live)</h5>
                  <div className="card-tools">
                    <button type="button" className="btn btn-tool" data-card-widget="collapse">
                      <i className="fas fa-minus"></i>
                    </button>
                  </div>
                </div>
                <div className="card-body">
                  <div className="chart">
                    {/* Component ChartJS */}
                    <div style={{ height: '300px' }}>
                      <Line data={data} options={options} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Online List Column (Preview nhỏ) */}
            <div className="col-md-4">
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Thành viên mới Online</h3>
                </div>
                <div className="card-body p-0">
                  <ul className="users-list clearfix">
                    {/* Giả lập avatar người chơi từ đầu Steve */}
                    <li>
                      <img src="https://minotar.net/avatar/Steve/128.png" alt="User Image" style={{width: '50px', borderRadius: '50%'}}/>
                      <a className="users-list-name" href="#">Steve</a>
                      <span className="users-list-date">Vừa xong</span>
                    </li>
                    <li>
                      <img src="https://minotar.net/avatar/Alex/128.png" alt="User Image" style={{width: '50px', borderRadius: '50%'}}/>
                      <a className="users-list-name" href="#">Alex</a>
                      <span className="users-list-date">5 phút trước</span>
                    </li>
                     <li>
                      <img src="https://minotar.net/avatar/Notch/128.png" alt="User Image" style={{width: '50px', borderRadius: '50%'}}/>
                      <a className="users-list-name" href="#">Notch</a>
                      <span className="users-list-date">10 phút trước</span>
                    </li>
                  </ul>
                </div>
                <div className="card-footer text-center">
                  <a href="#">Xem tất cả Players</a>
                </div>
              </div>
            </div>
            {/* PLAYER LIST COLUMN - HIỂN THỊ DANH SÁCH THẬT */}
            {/*<div className="col-md-4">
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Người chơi Online ({stats.players})</h3>
                </div>
                <div className="card-body p-0">
                  {stats.playerList.length === 0 ? (
                    <div className="text-center p-3 text-muted">Server đang trống</div>
                  ) : (
                    <ul className="users-list clearfix">
                      {stats.playerList.map((playerName, index) => (
                        <li key={index} style={{width: '33%'}}>
                          <img 
                            src={`https://minotar.net/avatar/${playerName}/128.png`} 
                            alt={playerName} 
                            style={{width: '50px', borderRadius: '5px'}}
                            title={playerName}
                          />
                          <a className="users-list-name" href="#" style={{marginTop: '5px'}}>{playerName}</a>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="card-footer text-center">
                  <a href="#">Quản lý Player (Ban/Kick)</a>
                </div>
              </div>
            </div>*/}
          </div>

        </div>
      </section>
    </div>
  );
};

export default Dashboard;
