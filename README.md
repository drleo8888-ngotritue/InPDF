# Batch PDF Printer (Desktop)

Ứng dụng in PDF hàng loạt chạy trên desktop (Electron) — in **thật** qua Windows Spooler
bằng [pdf-to-printer](https://www.npmjs.com/package/pdf-to-printer) (bọc SumatraPDF).

## Tính năng

- Liệt kê **máy in thật** của hệ thống (kèm máy in mặc định).
- Kéo–thả hoặc chọn file PDF (hộp thoại Windows) → lấy đường dẫn thật trên ổ đĩa.
- In hàng loạt **tuần tự**, áp dụng: máy in đích, số bản, khổ giấy, in 2 mặt (duplex),
  hướng in, phạm vi trang.
- Nhật ký tiến trình + xuất báo cáo `.txt`.

> Mở bằng trình duyệt (`npm run dev`) sẽ chạy ở **chế độ mô phỏng** (không in thật) để xem giao diện.
> Chỉ khi chạy trong Electron mới in thật.

## Yêu cầu

- Node.js 18+
- Windows (SumatraPDF đi kèm trong `pdf-to-printer`, chỉ hỗ trợ Windows).

## Chạy ở chế độ phát triển (in thật)

```bash
npm install
npm run electron:dev      # mở Vite + cửa sổ Electron, in thật qua Spooler
```

## Đóng gói thành app cài đặt (.exe)

```bash
npm run electron:build    # tạo bộ cài NSIS trong thư mục release/
```

## Các script khác

| Script | Mô tả |
|--------|-------|
| `npm run dev` | Chạy bản web mô phỏng trong trình duyệt (không in thật) |
| `npm run build` | Build giao diện (Vite) ra `dist/` |
| `npm run electron` | Chạy Electron với `dist/` đã build |
| `npm run lint` | Kiểm tra kiểu TypeScript |

## Kiến trúc

- `electron/main.cjs` — main process: tạo cửa sổ + IPC (`printers:list`, `files:pick`,
  `files:writeTemp`, `print:file`).
- `electron/preload.cjs` — cầu nối an toàn `window.electronAPI` (contextIsolation).
- `src/` — giao diện React. `App.tsx` phát hiện Electron để chuyển giữa in thật / mô phỏng.
