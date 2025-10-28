document.addEventListener("DOMContentLoaded", () => {
  const districtSelect = document.getElementById("district");
  const wardSelect = document.getElementById("ward");
  const form = document.getElementById("predictForm");
  const resultBox = document.getElementById("resultBox");
  const predictedPrice = document.getElementById("predictedPrice");

  // ✅ Khi chọn Quận/Huyện → cập nhật danh sách Phường/Xã
  districtSelect.addEventListener("change", () => {
    const selectedDistrict = districtSelect.value;
    wardSelect.innerHTML = "<option value=''>-- Chọn Phường / Xã --</option>";

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

  // ✅ Gửi dữ liệu dự đoán
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const payload = {
      huyen_tp: districtSelect.value,
      xa_phuong: wardSelect.value,
      huong: document.getElementById("direction").value,
      noi_that: document.getElementById("furniture").value,
      dien_tich: parseFloat(document.getElementById("area").value),
      phong_ngu: parseInt(document.getElementById("bedrooms").value),
      phong_tam: parseInt(document.getElementById("bathrooms").value),
      so_tang: 2,
      nam_xay: 2020
    };

    fetch("/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
      .then(res => res.json())
      .then(data => {
        resultBox.style.display = "block";
        predictedPrice.textContent = `💰 Giá dự đoán: ${data.predicted_price.toFixed(2)} triệu VNĐ`;
      })
      .catch(() => alert("❌ Lỗi kết nối tới máy chủ"));
  });
});