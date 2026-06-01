/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Preload — cầu nối an toàn giữa renderer (React) và main process.
 * Phơi bày window.electronAPI qua contextBridge (contextIsolation = true).
 */

const { contextBridge, ipcRenderer, webUtils } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,

  // Lấy danh sách máy in thật + máy in mặc định của hệ thống
  listPrinters: () => ipcRenderer.invoke('printers:list'),

  // Mở hộp thoại native chọn file PDF (trả về đường dẫn thật)
  pickFiles: () => ipcRenderer.invoke('files:pick'),

  // Lấy đường dẫn ổ đĩa thật từ một File object (kéo-thả / input)
  getPathForFile: (file) => {
    try {
      return webUtils.getPathForFile(file);
    } catch {
      return '';
    }
  },

  // Ghi bytes ra file tạm (dùng khi không lấy được path trực tiếp)
  writeTempFile: (name, bytes) =>
    ipcRenderer.invoke('files:writeTemp', { name, bytes }),

  // Gửi lệnh in một file PDF thật qua Windows Spooler
  printFile: (filePath, options) =>
    ipcRenderer.invoke('print:file', { filePath, options }),
});
