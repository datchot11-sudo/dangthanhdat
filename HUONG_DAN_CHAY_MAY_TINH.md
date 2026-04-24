# Hướng dẫn chạy Dshop trên máy tính cá nhân (VS Code)

Chào bạn! Đây là hướng dẫn chi tiết để bạn có thể chạy và kiểm tra (test) dự án này ngay trên máy tính của mình bằng Visual Studio Code.

## 1. Chuẩn bị công cụ
Trước khi bắt đầu, hãy đảm bảo máy tính của bạn đã cài đặt:
*   **Node.js (Bản LTS):** Tải tại [nodejs.org](https://nodejs.org/). Đây là môi trường để chạy code.
*   **Visual Studio Code (VS Code):** Tải tại [code.visualstudio.com](https://code.visualstudio.com/).

## 2. Các bước thực hiện

### Bước 1: Tải code về máy
1. Trong AI Studio, chọn **Export** hoặc **Settings** > **Download as ZIP**.
2. Giải nén file ZIP vào một thư mục dễ tìm (ví dụ: `Desktop/Dshop`).

### Bước 2: Mở dự án trong VS Code
1. Mở VS Code.
2. Chọn **File** > **Open Folder...**
3. Tìm đến thư mục bạn vừa giải nén và nhấn **Select Folder**.

### Bước 3: Cài đặt thư viện (Dependencies)
1. Mở Terminal trong VS Code bằng cách nhấn tổ hợp phím `` Ctrl + ` `` (phím cạnh số 1) hoặc vào menu **Terminal** > **New Terminal**.
2. Gõ lệnh sau và nhấn Enter:
   ```bash
   npm install
   ```
   *Đợi khoảng 1-2 phút để máy tải các thư viện như React, Firebase, Tailwind về.*

### Bước 4: Chạy ứng dụng
1. Sau khi cài đặt xong, gõ lệnh:
   ```bash
   npm run dev
   ```
2. Terminal sẽ hiện thông báo: `  ➜  Local:   http://localhost:3000/`
3. Bạn nhấn giữ phím **Ctrl** và click vào đường link đó, hoặc copy dán vào trình duyệt (Chrome/Edge).

## 3. Cách kiểm tra (Test) các tính năng

### Kiểm tra giao diện người dùng
*   Thử thêm sản phẩm vào giỏ hàng.
*   Xem chi tiết sản phẩm, chuyển đổi giữa các ảnh và biến thể (variant).
*   Kiểm tra tính năng lọc sản phẩm theo danh mục.

### Kiểm tra quyền Admin
1. Truy cập đường dẫn: `http://localhost:3000/admin`
2. Thử đăng nhập bằng tài khoản Google.
   *   *Lưu ý:* Nếu bạn dùng Firebase riêng, hãy đảm bảo đã thêm `http://localhost:3000` vào danh sách **Authorized domains** trong Firebase Console.
3. Thử thêm mới một sản phẩm, tải ảnh lên và nhấn Lưu. Sau đó quay lại trang chủ xem sản phẩm đã xuất hiện chưa.

## 4. Các lỗi thường gặp
*   **Lỗi "npm not found":** Bạn chưa cài Node.js hoặc chưa khởi động lại máy sau khi cài.
*   **Lỗi "Port 3000 is already in use":** Có một ứng dụng khác đang dùng cổng 3000. Bạn có thể tắt ứng dụng đó hoặc sửa cổng trong file `package.json`.
*   **Lỗi Firebase (Offline):** Kiểm tra lại kết nối mạng hoặc file `firebase-applet-config.json` xem thông tin dự án đã đúng chưa.

Chúc bạn test thành công! Nếu có bất kỳ khó khăn nào, hãy nhắn cho tôi nhé.
