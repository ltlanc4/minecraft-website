import React, { createContext, useState, useEffect, useContext } from 'react';
import axiosClient from '../api/axiosClient';

const DataContext = createContext();

export const DataProvider = ({ children }) => {
  const [stats, setStats] = useState({ cpu: 0, ram: 0, players: 0, maxPlayers: 0, tps: 20 });
  const [onlineList, setOnlineList] = useState([]);
  const [bannedList, setBannedList] = useState([]);
  
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [
      { label: ' CPU Usage       ', data: [], borderColor: '#dc3545', backgroundColor: 'rgba(220, 53, 69, 0.2)', tension: 0.4, fill: true, pointRadius: 0, pointHoverRadius: 6, borderWidth: 2 },
      { label: ' RAM Usage', data: [], borderColor: '#0d6efd', backgroundColor: 'rgba(13, 110, 253, 0.2)', tension: 0.4, fill: true, pointRadius: 0, pointHoverRadius: 6, borderWidth: 2 },
    ],
  });

  const fetchAllData = async () => {
    try {
      const [resDash, resBan] = await Promise.all([
        axiosClient.get('/dashboard'),
        axiosClient.get('/player/banlist')
      ]);

      const data = resDash.data;
      setStats({
        cpu: data.hardware.cpu, ram: data.hardware.ram,
        players: data.minecraft.online, maxPlayers: data.minecraft.max, tps: data.minecraft.tps
      });
      setOnlineList(data.minecraft.list || []);
      setBannedList(resBan.data.list || []);

      const timeNow = new Date().toLocaleTimeString();
      setChartData(prev => {
        const newLabels = [...prev.labels, timeNow];
        const newCpu = [...prev.datasets[0].data, data.hardware.cpu];
        const newRam = [...prev.datasets[1].data, data.hardware.ram];
        if (newLabels.length > 20) { newLabels.shift(); newCpu.shift(); newRam.shift(); }
        return {
          ...prev, labels: newLabels,
          datasets: [{ ...prev.datasets[0], data: newCpu }, { ...prev.datasets[1], data: newRam }]
        };
      });
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetchAllData();
    // Cập nhật mỗi 5 giây, chỉ khi tab đang mở
    const interval = setInterval(() => {
        if (!document.hidden) fetchAllData();
    }, 5000); 
    return () => clearInterval(interval);
  }, []);

  return (
    <DataContext.Provider value={{ stats, onlineList, bannedList, chartData, refreshData: fetchAllData }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => useContext(DataContext);