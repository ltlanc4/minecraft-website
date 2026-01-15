import React, { useState, useEffect } from "react"

import Swal from "sweetalert2"

const PlayerManager = () => {
  const [onlinePlayers, setOnlinePlayers] = useState([])

  const [bannedPlayers, setBannedPlayers] = useState([])

  const [loading, setLoading] = useState(false)

  // --- HÀM LOAD DỮ LIỆU ---

  const fetchData = async () => {
    setLoading(true)

    try {
      // 1. Lấy danh sách Online (Tận dụng API dashboard cũ)

      const resOnline = await fetch("http://localhost:5000/api/dashboard")

      const dataOnline = await resOnline.json()

      setOnlinePlayers(dataOnline.minecraft.list || [])

      // 2. Lấy danh sách Banned

      const resBan = await fetch("http://localhost:5000/api/player/banlist")

      const dataBan = await resBan.json()

      setBannedPlayers(dataBan.list || [])
    } catch (error) {
      console.error("Lỗi tải dữ liệu:", error)
    }

    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  // --- HÀM XỬ LÝ KICK / BAN ---

  const handleAction = async (player, actionType) => {
    // 1. Hiện Popup nhập lý do

    const { value: reason, isDismissed } = await Swal.fire({
      title: `${actionType.toUpperCase()} ${player}?`,

      input: "text",

      inputPlaceholder: "Nhập lý do (để trống cũng được)...",

      showCancelButton: true,

      confirmButtonText: "Thực hiện",

      confirmButtonColor: actionType === "ban" ? "#d33" : "#ffc107", // Ban màu đỏ, Kick màu vàng

      cancelButtonText: "Hủy",
    })

    if (isDismissed) return

    // 2. Gửi API

    try {
      const response = await fetch(
        `http://localhost:5000/api/player/${actionType}`,

        {
          method: "POST",

          headers: { "Content-Type": "application/json" },

          body: JSON.stringify({ player, reason: reason || "" }), // Gửi chuỗi rỗng nếu không nhập
        }
      )

      const result = await response.json()

      if (result.success) {
        Swal.fire(
          "Thành công!",

          `Đã ${actionType} người chơi. Server: ${result.message}`,

          "success"
        )

        fetchData() // Load lại danh sách
      } else {
        Swal.fire("Lỗi!", result.error, "error")
      }
    } catch (err) {
      Swal.fire("Lỗi kết nối!", "Không gọi được API", "error")
    }
  }

  // --- HÀM XỬ LÝ UNBAN ---

  const handleUnban = async (player) => {
    const result = await Swal.fire({
      title: `Gỡ Ban cho ${player}?`,

      text: "Người chơi sẽ có thể vào lại server.",

      icon: "question",

      showCancelButton: true,

      confirmButtonColor: "#28a745",

      confirmButtonText: "Unban ngay",
    })

    if (!result.isConfirmed) return

    try {
      const response = await fetch(`http://localhost:5000/api/player/unban`, {
        method: "POST",

        headers: { "Content-Type": "application/json" },

        body: JSON.stringify({ player }),
      })

      const data = await response.json()

      if (data.success) {
        Swal.fire("Đã Unban!", `Người chơi ${player} đã được tha.`, "success")

        fetchData()
      }
    } catch (err) {
      Swal.fire("Lỗi", "Không thể unban", "error")
    }
  }

  // Thêm hàm xử lý OP vào trong component PlayerManager

  const handleOpAction = async (player, action) => {
    // action là 'op' hoặc 'deop'

    const isOp = action === "op"

    // Cấu hình thông báo Popup khác nhau tùy hành động

    const result = await Swal.fire({
      title: isOp
        ? `Trao quyền OP cho ${player}?`
        : `Tước quyền OP của ${player}?`,

      text: isOp
        ? "CẢNH BÁO: Người này sẽ có toàn quyền kiểm soát server!"
        : "Người này sẽ trở thành người chơi thường.",

      icon: isOp ? "warning" : "info", // Cảnh báo vàng nếu cấp OP

      showCancelButton: true,

      confirmButtonColor: isOp ? "#ffc107" : "#6c757d", // Màu vàng hoặc xám

      confirmButtonText: isOp ? "Xác nhận Thăng chức" : "Xác nhận Hạ chức",

      cancelButtonText: "Hủy bỏ",
    })

    if (!result.isConfirmed) return

    // Gọi API

    try {
      const response = await fetch(
        `http://localhost:5000/api/player/${action}`,

        {
          method: "POST",

          headers: { "Content-Type": "application/json" },

          body: JSON.stringify({ player }),
        }
      )

      const data = await response.json()

      if (data.success) {
        Swal.fire(
          "Thành công",

          `Server phản hồi: ${data.message}`,

          "success"
        )
      } else {
        Swal.fire("Lỗi", data.error, "error")
      }
    } catch (err) {
      Swal.fire("Lỗi kết nối", "Không thể gọi tới Server", "error")
    }
  }

  return (
    <div className='content-wrapper'>
      <section className='content-header'>
        <div className='container-fluid'>
          <h1>Quản lý Người chơi</h1>
        </div>
      </section>

      <section className='content'>
        <div className='container-fluid'>
          <div className='card card-primary card-tabs'>
            <div className='card-header p-0 pt-1'>
              <ul
                className='nav nav-tabs'
                id='custom-tabs-one-tab'
                role='tablist'
              >
                <li className='nav-item'>
                  <a
                    className='nav-link active'
                    id='tab-online'
                    data-toggle='pill'
                    href='#content-online'
                    role='tab'
                  >
                    Online Players{" "}
                    <span className='badge badge-success'>
                      {onlinePlayers.length}
                    </span>
                  </a>
                </li>

                <li className='nav-item'>
                  <a
                    className='nav-link'
                    id='tab-banned'
                    data-toggle='pill'
                    href='#content-banned'
                    role='tab'
                  >
                    Banned Players{" "}
                    <span className='badge badge-danger'>
                      {bannedPlayers.length}
                    </span>
                  </a>
                </li>
              </ul>
            </div>

            <div className='card-body'>
              <div className='tab-content'>
                {/* TAB ONLINE: KICK & BAN */}

                <div
                  className='tab-pane fade show active'
                  id='content-online'
                  role='tabpanel'
                >
                  <button
                    className='btn btn-sm btn-secondary mb-3'
                    onClick={fetchData}
                  >
                    <i className='fas fa-sync'></i> Làm mới
                  </button>

                  <table className='table table-hover table-striped'>
                    <thead>
                      <tr>
                        <th style={{ width: "60px" }}>Avatar</th>
                        <th>Tên người chơi</th>
                        <th>Trừng phạt</th> {/* Cột Kick/Ban */}
                        <th>Quyền hạn</th> {/* Cột OP/Deop mới */}
                      </tr>
                    </thead>

                    <tbody>
                      {" "}
                      {onlinePlayers.length === 0 ? (
                        <tr>
                          <td colSpan='4' className='text-center'>
                            Không có ai online
                          </td>
                        </tr>
                      ) : (
                        onlinePlayers.map((p, index) => (
                          <tr key={index}>
                            <td>
                              <img
                                src={`https://minotar.net/avatar/${p}/32.png`}
                                alt={p}
                                className='rounded'
                              />
                            </td>

                            <td className='align-middle font-weight-bold'>
                              {p}
                            </td>

                            {/* CỘT QUẢN LÝ THƯỜNG (KICK/BAN) */}

                            <td>
                              <button
                                onClick={() => handleAction(p, "kick")}
                                className='btn btn-default btn-sm mr-1'
                                title='Kick'
                              >
                                <i className='fas fa-boot text-warning'></i>
                              </button>

                              <button
                                onClick={() => handleAction(p, "ban")}
                                className='btn btn-default btn-sm'
                                title='Ban'
                              >
                                <i className='fas fa-gavel text-danger'></i>
                              </button>
                            </td>

                            {/* CỘT QUẢN LÝ OP (MỚI) */}

                            <td>
                              <div className='btn-group'>
                                <button
                                  onClick={() => handleOpAction(p, "op")}
                                  className='btn btn-outline-warning btn-sm'
                                  title='Cấp quyền OP'
                                >
                                  <i className='fas fa-star'></i> OP
                                </button>

                                <button
                                  onClick={() => handleOpAction(p, "deop")}
                                  className='btn btn-outline-secondary btn-sm'
                                  title='Hủy quyền OP'
                                >
                                  <i className='fas fa-user-slash'></i> Deop
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* TAB BANNED: UNBAN */}

                <div
                  className='tab-pane fade'
                  id='content-banned'
                  role='tabpanel'
                >
                  <button
                    className='btn btn-sm btn-secondary mb-3'
                    onClick={fetchData}
                  >
                    <i className='fas fa-sync'></i> Làm mới
                  </button>

                  <table className='table table-hover'>
                    <thead>
                      <tr>
                        <th>Tên người chơi</th>

                        <th>Hành động</th>
                      </tr>
                    </thead>

                    <tbody>
                      {bannedPlayers.length === 0 ? (
                        <tr>
                          <td colSpan='2' className='text-center'>
                            Danh sách sạch sẽ!
                          </td>
                        </tr>
                      ) : (
                        bannedPlayers.map((p, index) => (
                          <tr key={index}>
                            <td className='text-danger font-weight-bold'>
                              {p}
                            </td>

                            <td>
                              <button
                                onClick={() => handleUnban(p)}
                                className='btn btn-success btn-sm'
                              >
                                <i className='fas fa-unlock'></i> Unban (Pardon)
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* /.card */}
          </div>
        </div>
      </section>
    </div>
  )
}

export default PlayerManager