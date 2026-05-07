#!/bin/bash
# Di chuyển vào đúng thư mục chứa file này
cd "$(dirname "$0")"

# Mở trình duyệt và chạy server Vite
echo "Đang khởi động ứng dụng Restaurant Pro..."
npm run dev -- --open
