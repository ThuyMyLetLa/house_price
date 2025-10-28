document.addEventListener("DOMContentLoaded", () => {
  const districtSelect = document.getElementById("districtSelect");
  const wardSelect = document.getElementById("wardSelect");
  const form = document.getElementById("analysisForm");

  let areaChart, roomChart;

  // ✅ Khi chọn Quận/Huyện → cập nhật danh sách Phường/Xã
  districtSelect.addEventListener("change", () => {
    const selectedDistrict = districtSelect.value;
    wardSelect.innerHTML = "<option value=''>-- Chọn Phường/Xã --</option>";

    if (selectedDistrict && wardData[selectedDistrict]) {
      wardSelect.disabled = false;
      wardData[selectedDistrict].forEach(ward => {
        const opt = document.createElement("option");
        opt.value = ward;
        opt.textContent = ward;
        wardSelect.appendChild(opt);
      });
    } else {
      wardSelect.disabled = true;
    }
  });

  // ✅ Gửi yêu cầu phân tích
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const payload = {
      huyen_tp: districtSelect.value,
      xa_phuong: wardSelect.value
    };

    fetch("/analysis", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
      .then(res => res.json())
      .then(data => {
        renderCharts(data);
      })
      .catch(() => alert("❌ Lỗi kết nối tới máy chủ"));
  });

  // ✅ Vẽ biểu đồ
  function renderCharts(data) {
    const ctx1 = document.getElementById("areaChart").getContext("2d");
    const ctx2 = document.getElementById("roomChart").getContext("2d");

    // Xóa biểu đồ cũ
    if (areaChart) areaChart.destroy();
    if (roomChart) roomChart.destroy();

    areaChart = new Chart(ctx1, {
      type: "bar",
      data: {
        labels: data.areaLabels,
        datasets: [{
          label: "Số lượng nhà theo diện tích (m²)",
          data: data.areaPrices,
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: { beginAtZero: true }
        }
      }
    });

    roomChart = new Chart(ctx2, {
      type: "bar",
      data: {
        labels: data.roomLabels,
        datasets: [{
          label: "Số lượng nhà theo số phòng ngủ",
          data: data.roomPrices,
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: { beginAtZero: true }
        }
      }
    });
  }
});