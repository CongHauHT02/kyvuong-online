# Kỳ Vương - Game Cờ Tướng (Xiangqi)

Dự án Game Cờ Tướng hoàn chỉnh với **Frontend bằng React.js (Vite)** và **Backend bằng .NET Core 9.0 (ASP.NET Core Web API & SignalR)**.

---

## 🌟 Tính Năng Nổi Bật

### 1. Luật Cờ Tướng Chuẩn Xác 100%
- **Đầy đủ 7 loại quân cờ**: Tướng (Soái), Sĩ, Tượng, Mã, Xe, Pháo, Tốt (Binh).
- **Quy tắc di chuyển & cản đường chuẩn**:
  - Tướng & Sĩ di chuyển trong Cửu Cung.
  - Tượng đi chéo chữ điền, không qua sông, kiểm tra **cản mắt tượng**.
  - Mã đi chữ nhật, kiểm tra **cản chân mã** (mã quỳ, mã ngáng).
  - Pháo đi thẳng, ăn quân phải nhảy qua đúng **1 ngòi**.
  - Tốt chưa qua sông chỉ tiến 1 ô; sau khi qua sông được tiến và đi ngang.
  - Luật **Lộ mặt tướng (Flying General)**: Hai tướng không được đối mặt trực tiếp trên cùng một cột mà không có quân cản.
  - Kiểm tra **Chiếu tướng (Check)**, **Chiếu bí (Checkmate)** và **Hết nước đi (Vây bí / Stalemate - xử thua)** theo đúng luật cờ tướng truyền thống.
- **Biên bản ván cờ tự động**: Ghi chép nước đi theo ký hiệu truyền thống của Việt Nam (VD: `P8-5`, `M8.7`, `B7.1`, `X1.1`).

### 2. Ba Chế Độ Chơi Đa Dạng
1. **Đấu với Máy (PvE - AI)**:
   - Thuật toán **Minimax kết hợp Alpha-Beta Pruning**.
   - Bảng điểm vị trí chuẩn (Piece-Square Tables) cho Mã, Pháo, Tốt.
   - Sắp xếp nước đi ưu tiên ăn quân (MVV-LVA) giúp tăng tốc độ tìm kiếm.
   - 3 cấp độ thông minh: **Dễ**, **Trung Bình**, **Khó**.
2. **2 Người Chơi Trên Cùng Máy (Pass & Play)**:
   - Dễ dàng giao đấu trực tiếp, đổi chiều bàn cờ linh hoạt.
3. **Đấu Trực Tuyến Thời Gian Thực (Online PvP)**:
   - Sử dụng **SignalR** kết nối real-time giữa 2 người chơi.
   - Tạo phòng với mã phòng 6 ký tự ngẫu nhiên hoặc duyệt danh sách phòng đang mở.
   - Hỗ trợ đổi lượt, đồng bộ nước đi tức thì, chat trong phòng thi đấu, xin thua, xin hòa và đấu lại (Rematch).

### 3. Giao Diện & Trải Nghiệm Hoàng Gia (Imperial Oriental Aesthetics)
- Bàn cờ gỗ cẩm lai cao cấp với đường viền vàng ánh kim, chỉ dẫn sông **"楚河 • 漢界"** (Sở Hà - Hán Giới).
- Quân cờ chạm khắc 3D bóng bẩy, chữ thư pháp Hán tự cổ điển kèm chú thích chữ Việt tùy chọn.
- Hiệu ứng âm thanh sinh động bằng **Web Audio API** (không phụ thuộc asset ngoài):
  - Tiếng cạch gõ quân gỗ giòn tan.
  - Tiếng ăn quân uy lực.
  - Tiếng cảnh báo chiếu tướng hồi hộp.
  - Nhạc chiến thắng ngũ cung rực rỡ kèm pháo hoa (Confetti).
- Nghĩa địa quân bị ăn (Captured Pieces) kèm thước đo so sánh tương quan lực lượng hai bên.

---

## 🏗️ Cấu Trúc Dự Án

```
test/
├── backend/                        # Backend .NET Core 9.0
│   ├── Controllers/
│   │   └── GameController.cs       # REST API: tạo ván mới, tính nước hợp lệ, nước đi AI, quản lý phòng
│   ├── Hubs/
│   │   └── GameHub.cs              # SignalR Hub: phòng chơi thời gian thực, chat, rematch
│   ├── Models/
│   │   ├── Enums.cs                # PieceType, PieceColor, GameStatus
│   │   ├── Position.cs             # Tọa độ (Row, Col), Cửu Cung, qua sông
│   │   ├── Piece.cs                # Quân cờ, chữ Hán, tên Việt
│   │   ├── Move.cs                 # Nước đi & ký hiệu cờ
│   │   ├── GameState.cs            # Trạng thái bàn cờ 10x9, lịch sử, quân bị ăn
│   │   └── GameRoom.cs             # Phòng thi đấu online
│   ├── Services/
│   │   ├── XiangqiRulesService.cs  # Động cơ luật cờ tướng chuẩn xác
│   │   ├── XiangqiAiService.cs     # Thuật toán AI Alpha-Beta Pruning
│   │   └── RoomManagerService.cs   # Quản lý vòng đời phòng đấu
│   ├── Program.cs                  # Cấu hình DI, CORS, SignalR, JSON
│   └── XiangqiBackend.csproj       # Target net9.0
│
├── frontend/                       # Frontend React.js (Vite)
│   ├── src/
│   │   ├── components/
│   │   │   ├── Board.jsx           # Bàn cờ SVG sắc nét & các quân cờ
│   │   │   ├── Piece.jsx           # Quân cờ 3D chạm khắc nổi
│   │   │   ├── GameControls.jsx    # Bảng điều khiển: chế độ, độ khó, lật bàn cờ
│   │   │   ├── GameInfo.jsx        # Lượt đi, chiếu tướng, so sánh lực lượng, quân bị ăn
│   │   │   ├── MoveHistory.jsx     # Bảng biên bản nước đi
│   │   │   ├── OnlineRoomModal.jsx # Tạo / vào phòng online
│   │   │   └── GameOverModal.jsx   # Thông báo thắng / thua / hòa & pháo hoa
│   │   ├── services/
│   │   │   ├── audioService.js     # Tổng hợp âm thanh cờ gỗ & nhạc hiệu
│   │   │   ├── apiService.js       # Gọi REST API .NET 9
│   │   │   └── signalrService.js   # Kết nối SignalR real-time
│   │   ├── utils/
│   │   │   └── xiangqiLogic.js     # Động cơ kiểm tra nước đi tức thì phía client
│   │   ├── App.jsx                 # Logic điều phối chính
│   │   └── index.css               # Hệ thống giao diện hoàng gia
│   ├── vite.config.js              # Proxy WebSocket & API về backend
│   └── package.json
│
├── run_backend.bat                 # Script chạy Backend .NET 9
├── run_frontend.bat                # Script chạy Frontend React
├── start_all.bat                   # Script 1-click chạy cả 2 và mở trình duyệt
└── README.md
```

---

## 🚀 Hướng Dẫn Khởi Động

### Cách 1: Khởi động 1-Click (Khuyên dùng trên Windows)
Chỉ cần nhấp đúp chuột vào file:
```cmd
start_all.bat
```
File script sẽ tự động mở 2 cửa sổ chạy Backend .NET 9 (`http://localhost:5235`) và Frontend React (`http://localhost:5173`), đồng thời mở trình duyệt web.

---

### Cách 2: Khởi động thủ công qua dòng lệnh

#### 1. Chạy Backend (.NET 9.0)
```powershell
cd backend
dotnet run --launch-profile http
```
Backend sẽ khởi chạy tại: `http://localhost:5235`

#### 2. Chạy Frontend (React.js)
```powershell
cd frontend
npm run dev
```
Frontend sẽ khởi chạy tại: `http://localhost:5173` (tự động proxy API và WebSocket sang `http://localhost:5235`).

---

## 🎮 Cách Chơi

1. **Chọn Chế Độ**:
   - **Đấu với Máy**: Chọn cấp độ *Dễ*, *Trung Bình*, hoặc *Khó*. Bạn cầm quân Đỏ đi trước, máy cầm quân Đen sẽ tự động tính toán và đáp trả.
   - **2 Người Chơi**: Hai người chơi thay phiên nhau đi trên cùng bàn cờ.
   - **Đấu Online**: Nhấn "Đấu Trực Tuyến" để Tạo phòng mới và gửi mã phòng 6 ký tự cho bạn bè, hoặc nhập mã để tham gia phòng đối thủ đã tạo.
2. **Đi Quân**: Nhấp chuột vào quân cờ của bạn (Đỏ hoặc Đen theo lượt). Các chấm màu xanh ngọc bích sẽ xuất hiện tại các ô hợp lệ. Nhấp vào chấm xanh để di chuyển hoặc nhấp vào vòng tròn nhắm đỏ trên quân đối phương để ăn quân.
3. **Các Chức Năng Bổ Trợ**:
   - **Đổi Chiều Bàn**: Lật ngược góc nhìn bàn cờ 180 độ.
   - **Hiện Chữ Việt / Hán**: Chuyển đổi giữa chế độ chỉ hiển thị Hán tự truyền thống hoặc kèm chữ Việt phía dưới.
   - **Bật / Tắt Âm**: Bật tắt tiếng gõ cờ gỗ và âm thanh ván đấu.
   - **Xin Thua / Xin Hòa**: Kết thúc ván cờ theo tinh thần kỳ nghệ.
