# Hướng Dẫn Upload & Đưa Game Cờ Tướng Lên Trực Tuyến Qua Somee.com

Dự án đã được cấu hình thành **gói duy nhất (Single-Bundle)**: Toàn bộ giao diện React.js đã được tích hợp trực tiếp vào thư mục `wwwroot` của Backend .NET 9.0, kèm theo cơ chế **Self-Contained** (đã nhúng sẵn runtime .NET 9 x64), giúp ứng dụng chạy được trên mọi máy chủ Windows của Somee.com mà không lo lỗi thiếu phiên bản .NET.

---

## 📦 Các File Đóng Gói Sẵn

Trong thư mục dự án đã tạo sẵn 2 file nén:
1. ⭐ **`xiangqi_somee_selfcontained.zip`** *(Khuyên dùng)*:
   - Dung lượng: ~48 MB.
   - Chứa sẵn toàn bộ runtime .NET 9 x64 + Giao diện React + Cơ chế tự tạo database SQLite.
   - Chạy độc lập, không sợ Somee chưa cài .NET 9.
2. **`xiangqi_somee_framework.zip`** *(Bản nhẹ)*:
   - Dung lượng: ~17 MB.
   - Dùng khi Somee giới hạn dung lượng upload hoặc đã có sẵn .NET 9 runtime.

> 💡 Nếu sau này bạn có chỉnh sửa code, chỉ cần chạy file **[publish_for_somee.bat](file:///d:/FEPV-IT/OutSource/test/publish_for_somee.bat)** để tự động build và tạo lại file zip mới!

---

## 🚀 Các Bước Đưa Lên Somee.com Chi Tiết

### BƯỚC 1: Đăng Ký / Đăng Nhập Website Trên Somee.com
1. Truy cập [https://somee.com](https://somee.com) và đăng nhập vào tài khoản của bạn.
2. Vào mục **"User area"** -> Chọn **"Websites"** ở thanh menu bên trái.
3. Nhấp chọn **"Create a new website"**:
   - **Site name**: Nhập tên website của bạn (VD: `kyvuong-online` -> domain của bạn sẽ là `http://kyvuong-online.somee.com`).
   - **Package**: Chọn gói **Free** (Miễn phí).
   - Nhấn **"Create"** để tạo website.

---

### BƯỚC 2: Upload Source Lên Somee (Dùng File Manager Hoặc FTP)

#### Cách 1: Dùng File Manager Trên Trình Duyệt (Đơn giản nhất)
1. Trong trang quản lý website của bạn trên Somee, chọn mục **"File Manager"** ở menu bên trái.
2. Nhấp vào thư mục gốc của website (thường là thư mục chính hoặc `public_html`).
3. Nếu có các file mặc định của Somee (như `default.aspx`), bạn hãy chọn và nhấn **"Delete"** để xóa đi.
4. Nhấn nút **"Upload"** (hoặc biểu tượng tải file lên).
5. Chọn file **`xiangqi_somee_selfcontained.zip`** từ máy tính của bạn tại:
   ```
   d:\FEPV-IT\OutSource\test\xiangqi_somee_selfcontained.zip
   ```
6. Sau khi quá trình upload hoàn tất (thanh tiến trình đạt 100%):
   - Nhấp chuột phải (hoặc tích chọn) vào file `xiangqi_somee_selfcontained.zip` vừa tải lên.
   - Nhấn nút **"Unzip"** (Giải nén) ngay trên giao diện của Somee.
   - Đảm bảo các file được giải nén ra ngay thư mục gốc (bạn sẽ thấy các file: `web.config`, `XiangqiBackend.exe`, `XiangqiBackend.dll`, thư mục `wwwroot`, thư mục `logs`).
   - Xóa file `.zip` đi để tiết kiệm bộ nhớ hosting.

#### Cách 2: Dùng Phần Mềm FTP (FileZilla) Nếu File Zip Lớn
- **Host**: `ftp.somee.com`
- **Username**: Tài khoản FTP được cấp trong mục **"FTP accounts"** trên Somee.
- **Password**: Mật khẩu FTP của bạn.
- Bạn có thể giải nén file `somee_publish` trên máy rồi kéo toàn bộ nội dung thả vào thư mục gốc trên FTP.

---

### BƯỚC 3: Cấu Hình ASP.NET Trên Somee.com
1. Ở menu bên trái website trên Somee, nhấp vào mục **"Website settings"** -> chọn thẻ **"ASP.NET"**.
2. **.NET version**: Chọn phiên bản cao nhất có sẵn hoặc chọn **"No Managed Code"** (vì ứng dụng chạy theo cơ chế InProcess/OutofProcess qua IIS HttpPlatformHandler).
3. Nhấn **"Save changes"**.

---

### BƯỚC 4: Cơ Sở Dữ Liệu (Tự Động 100%)
- Ứng dụng đã tích hợp sẵn cơ sở dữ liệu **SQLite** (`xiangqi.db`).
- Ngay khi có người dùng đầu tiên truy cập website, hệ thống sẽ **tự động tạo file database và bảng `Users`** mà bạn không cần phải cấu hình hay chạy lệnh SQL nào!
- *(Nâng cao)*: Nếu bạn muốn dùng MS SQL Server của Somee:
  1. Vào mục **"MS SQL"** trên Somee -> **"Create database"**.
  2. Copy Connection String được cấp.
  3. Mở file `appsettings.json` trong File Manager và dán Connection String vào mục `"DefaultConnection"`.

---

### BƯỚC 5: Mở Trình Duyệt Và Thưởng Thức!
1. Mở trình duyệt và truy cập:
   ```
   http://<ten-website-cua-ban>.somee.com
   ```
2. **Kiểm tra các tính năng**:
   - Nhấn **"Đăng Nhập / Đăng Ký"** để tạo tài khoản kỳ thủ của bạn.
   - Nhấn **"Đấu Trực Tuyến"** -> **"Tạo Phòng"** để lấy mã phòng.
   - Gửi link website và mã phòng cho bạn bè ở bất kỳ máy tính/điện thoại nào để vào phòng so tài thời gian thực!
   - Xem điểm kỳ lực (Elo) tự động cộng/trừ sau mỗi trận đấu và cập nhật trên **Bảng Xếp Hạng Kỳ Thủ**!

---

## 🛠️ Xử Lý Sự Cố Thường Gặp Trên Somee.com

| Lỗi | Nguyên nhân | Cách khắc phục |
| :--- | :--- | :--- |
| **HTTP Error 500.30 - ANCM In-Process Start Failure** | IIS chạy InProcess xung đột với môi trường máy chủ | Mở file `web.config` trên Somee, sửa `hostingModel="inprocess"` thành `hostingModel="outofprocess"`, sau đó lưu lại. |
| **HTTP Error 500.19** | File `web.config` bị lồng sai thẻ hoặc trùng lặp | Đảm bảo file `web.config` nằm ở thư mục gốc của website và nội dung đúng như file mẫu đã tạo. |
| **Không thể tải ván cờ hoặc lỗi kết nối** | Chưa có thư mục ghi log | Tạo một thư mục rỗng tên là `logs` ngang hàng với file `web.config` để IIS ghi nhật ký lỗi nếu có. |
| **WebSocket kết nối chập chờn** | Somee free tier đôi khi giới hạn WebSocket | Hệ thống SignalR trong game đã tích hợp tự động chuyển sang chế độ Long-Polling để người chơi luôn duy trì được trận đấu ổn định. |
