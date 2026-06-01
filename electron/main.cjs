/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Electron main process — Batch PDF Printer (Hướng A: in PDF thật qua Windows Spooler).
 * Dùng pdf-to-printer (bọc SumatraPDF) để liệt kê máy in và gửi lệnh in im lặng.
 */

const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const ptp = require('pdf-to-printer');

const isDev = !app.isPackaged;

// Đường dẫn SumatraPDF: trong bản đóng gói exe nằm ngoài asar (asarUnpack).
function getSumatraPath() {
  if (isDev) return undefined; // dev: pdf-to-printer tự tìm trong node_modules
  return path.join(
    process.resourcesPath,
    'app.asar.unpacked',
    'node_modules',
    'pdf-to-printer',
    'dist',
    'SumatraPDF-3.4.6-32.exe'
  );
}

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1320,
    height: 900,
    minWidth: 1024,
    minHeight: 680,
    title: 'Batch PDF Printer',
    backgroundColor: '#F8FAFC',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.removeMenu();

  // Truy vết lỗi tải trang renderer (hữu ích khi gỡ lỗi đóng gói).
  mainWindow.webContents.on('did-fail-load', (_e, code, desc) =>
    console.log(`[main] renderer did-fail-load: ${code} ${desc}`)
  );

  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ─── IPC: Liệt kê máy in thật của hệ thống ──────────────────────────────────
ipcMain.handle('printers:list', async () => {
  const [printers, def] = await Promise.all([
    ptp.getPrinters().catch(() => []),
    ptp.getDefaultPrinter().catch(() => null),
  ]);
  console.log(`[main] printers:list → ${printers.length} máy in (mặc định: ${def ? def.name : 'none'})`);
  return {
    printers: printers.map((p) => ({
      deviceId: p.deviceId,
      name: p.name,
      paperSizes: Array.isArray(p.paperSizes) ? p.paperSizes : [],
    })),
    defaultPrinterName: def ? def.name : null,
  };
});

// ─── IPC: Mở hộp thoại chọn file PDF (trả về đường dẫn thật) ─────────────────
ipcMain.handle('files:pick', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Chọn tệp PDF để in',
    properties: ['openFile', 'multiSelections'],
    filters: [{ name: 'PDF', extensions: ['pdf'] }],
  });
  if (result.canceled) return [];
  return result.filePaths.map((fp) => ({
    path: fp,
    name: path.basename(fp),
    size: safeSize(fp),
  }));
});

function safeSize(fp) {
  try {
    return fs.statSync(fp).size;
  } catch {
    return 0;
  }
}

// ─── IPC: Ghi bytes (file kéo-thả) ra file tạm, trả về đường dẫn ─────────────
ipcMain.handle('files:writeTemp', async (_evt, { name, bytes }) => {
  const dir = path.join(os.tmpdir(), 'batch-pdf-printer');
  fs.mkdirSync(dir, { recursive: true });
  const safeName = String(name || 'document.pdf').replace(/[^\w.\-]+/g, '_');
  const target = path.join(dir, `${Date.now()}_${safeName}`);
  fs.writeFileSync(target, Buffer.from(bytes));
  return { path: target, size: safeSize(target) };
});

// ─── IPC: In một file PDF thật qua Windows Spooler ──────────────────────────
ipcMain.handle('print:file', async (_evt, { filePath, options }) => {
  if (!filePath || !fs.existsSync(filePath)) {
    return { ok: false, error: 'Không tìm thấy tệp PDF trên ổ đĩa: ' + filePath };
  }

  const opts = { ...options };
  const sumatra = getSumatraPath();
  if (sumatra) opts.sumatraPdfPath = sumatra;

  console.log(`[main] print:file → "${filePath}" tới "${opts.printer}" (${JSON.stringify(opts)})`);
  try {
    await ptp.print(filePath, opts);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err && err.message ? err.message : String(err) };
  }
});

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
