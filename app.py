from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import joblib
import pandas as pd
import numpy as np
from datetime import datetime  # ✅ import đúng

app = Flask(__name__, static_folder="static", template_folder="templates")
CORS(app)

# ====== LOAD MODEL ======
model, feature_names = joblib.load("model.pkl")

# ====== DỮ LIỆU CƠ BẢN ======
DISTRICTS = ["TP Thái Nguyên", "TP Phổ Yên", "Huyện Đồng Hỷ"]
WARDS = [
    "Phường Quang Trung", "Phường Tân Lập", "Phường Cam Giá",
    "Phường Phan Đình Phùng", "Phường Thịnh Đán",
    "Xã Hóa Trung", "Xã Hóa Thượng", "Thị trấn Trại Cau",
    "Xã Khe Mo", "Xã Nam Hòa",
    "Phường Ba Hàng", "Phường Bãi Bông", "Phường Tân Phú",
    "Phường Nam Tiến", "Phường Bắc Sơn"
]
DIRECTIONS = ["Đông", "Tây", "Nam", "Bắc", "Đông Nam", "Tây Nam", "Đông Bắc", "Tây Bắc"]
FURNITURES = ["Cơ bản", "Đầy đủ", "Cao cấp"]

# ====== TRANG HTML ======
@app.route("/")
def home():
    return render_template("index.html",
                           districts=DISTRICTS, wards=WARDS,
                           directions=DIRECTIONS, furnitures=FURNITURES)

@app.route("/analysis_page")
def analysis_page():
    return render_template("analysis.html",
                           districts=DISTRICTS, wards=WARDS,
                           directions=DIRECTIONS, furnitures=FURNITURES)

@app.route("/forum")
def forum():
    return render_template("forum.html")

# ====== API DIỄN ĐÀN ======
messages = []  # Danh sách tin nhắn

@app.route("/send_message", methods=["POST"])
def send_message():
    """Nhận tin nhắn mới và lưu vào danh sách (tối đa 20 tin gần nhất)"""
    data = request.get_json()
    name = data.get("name")
    text = data.get("text")

    if name and text:
        timestamp = datetime.now().strftime("%H:%M")  # ✅ tránh lỗi NoneType
        messages.append({"name": name, "text": text, "time": timestamp})

        # Giữ tối đa 20 tin gần nhất
        if len(messages) > 20:
            messages.pop(0)

    return jsonify({"status": "ok"})

@app.route("/get_messages", methods=["GET"])
def get_messages():
    """Trả về 20 tin nhắn gần nhất"""
    return jsonify(messages[-20:])

# ====== API DỰ ĐOÁN ======
@app.route("/predict", methods=["POST"])
def predict():
    data = request.get_json()
    df = pd.DataFrame([data])
    df_encoded = pd.get_dummies(df)

    for col in feature_names:
        if col not in df_encoded.columns:
            df_encoded[col] = 0
    df_encoded = df_encoded[feature_names]

    prediction = model.predict(df_encoded)[0]

    impact_map = {
        "huyen_tp": 15, "xa_phuong": 10, "dien_tich": 25, "phong_ngu": 10,
        "phong_tam": 10, "so_tang": 10, "nam_xay": 10, "huong": 5, "noi_that": 5
    }

    return jsonify({"predicted_price": float(prediction), "impact_map": impact_map})

# ====== API PHÂN TÍCH ======
@app.route("/analysis", methods=["POST"])
def analysis():
    data = request.get_json()
    huyen_tp = data.get("huyen_tp")
    xa_phuong = data.get("xa_phuong")

    np.random.seed(42)
    df = pd.DataFrame({
        "huyen_tp": np.random.choice(DISTRICTS, 200),
        "xa_phuong": np.random.choice(WARDS, 200),
        "dien_tich": np.random.uniform(30, 250, 200).round(1),
        "phong_ngu": np.random.randint(1, 6, 200),
        "so_tang": np.random.randint(1, 4, 200),
        "nam_xay": np.random.randint(1995, 2024, 200),
        "noi_that": np.random.choice(FURNITURES, 200)
    })

    if huyen_tp:
        df = df[df["huyen_tp"] == huyen_tp]
    if xa_phuong:
        df = df[df["xa_phuong"] == xa_phuong]

    bins = [30,60,90,120,150,180,210,240,250]
    labels = [f"{b}-{bins[i+1]}" for i,b in enumerate(bins[:-1])]
    df["bin"] = pd.cut(df["dien_tich"], bins=bins, labels=labels, include_lowest=True)
    areaPrices = [len(df[df["bin"]==lbl]) for lbl in labels]
    roomValues = sorted(df["phong_ngu"].unique())
    roomPrices = [len(df[df["phong_ngu"]==r]) for r in roomValues]

    topFactors = [
        {"factor": "Diện tích", "value": 45},
        {"factor": "Quận/Huyện", "value": 25},
        {"factor": "Nội thất", "value": 30}
    ]

    return jsonify({
        "areaPrices": areaPrices,
        "areaLabels": labels,
        "roomPrices": roomPrices,
        "roomLabels": [f"{r} phòng" for r in roomValues],
        "topFactors": topFactors
    })

# ====== CHẠY SERVER ======
if __name__ == "__main__":
    app.run(debug=True)  # không cần host/port, gunicorn sẽ quản lý
