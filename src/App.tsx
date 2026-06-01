/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Printer as PrinterIcon, 
  Play, 
  XSquare, 
  FileCheck, 
  Download, 
  Plus, 
  AlertTriangle, 
  Info, 
  CheckCircle2, 
  ExternalLink,
  Laptop
} from 'lucide-react';
import { PrintFile, Printer, PrintSettings, IPCLog } from './types';
import { extractPdfPageCount } from './utils';

// Import our custom sub-components
import { PrinterVisualizer } from './components/PrinterVisualizer';
import { SystemLogs } from './components/SystemLogs';
import { PrintConfig } from './components/PrintConfig';
import { FileWorkspace } from './components/FileWorkspace';

// Seed Initial Printers
const INITIAL_PRINTERS: Printer[] = [
  {
    id: 'canon-lbp2900',
    name: 'Canon LBP2900 (Mặc định)',
    isDefault: true,
    isOnline: true,
    status: 'idle',
    paperSizes: ['A4', 'A5'],
    supportedDuplex: false,
    connectionType: 'USB',
    location: 'Bàn kế toán 1',
  },
  {
    id: 'hp-laserjet-m428',
    name: 'HP LaserJet Pro M428dw',
    isDefault: false,
    isOnline: true,
    status: 'idle',
    paperSizes: ['A4', 'Letter'],
    supportedDuplex: true,
    connectionType: 'Wi-Fi',
    location: 'Phòng Kỹ thuật tầng lửng',
  },
  {
    id: 'epson-l3110',
    name: 'Epson L3110 InkTank',
    isDefault: false,
    isOnline: true,
    status: 'idle',
    paperSizes: ['A4', 'A5', 'Letter'],
    supportedDuplex: false,
    connectionType: 'USB',
    location: 'Phòng Hành chính Nhân sự',
  },
  {
    id: 'microsoft-pdf',
    name: 'Microsoft Print to PDF',
    isDefault: false,
    isOnline: true,
    status: 'idle',
    paperSizes: ['A4', 'Letter'],
    supportedDuplex: true,
    connectionType: 'Network',
    location: 'Mô phỏng Ảo hóa',
  }
];

// Seed Initial Queue for immediate interactive testing out-of-the-box
const INITIAL_FILES: PrintFile[] = [
  {
    id: 'f1',
    name: 'Bao_cao_Doanh_thu_Q1_2026.pdf',
    size: 2450000,
    pageCount: 12,
    status: 'waiting',
    progress: 0,
  },
  {
    id: 'f2',
    name: 'Hop_dong_Thue_vessel_signed_02.pdf',
    size: 680000,
    pageCount: 4,
    status: 'waiting',
    progress: 0,
  },
  {
    id: 'f3',
    name: 'invoice_locked_by_bank_secured.pdf', // Triggers password exception testcase automatically!
    size: 1100000,
    pageCount: 3,
    status: 'waiting',
    progress: 0,
  },
  {
    id: 'f4',
    name: 'Tieu_chuan_Xay_dung_Quoc_Gia.pdf',
    size: 3890000,
    pageCount: 45,
    status: 'waiting',
    progress: 0,
  }
];

// Seed Initial Log streams
const INITIAL_LOGS: IPCLog[] = [
  {
    id: 'l1',
    timestamp: '10:29:12',
    source: 'Renderer',
    type: 'info',
    message: 'Kênh truyền IPC kết nối thành công tới Electron Hub.',
  },
  {
    id: 'l2',
    timestamp: '10:29:12',
    source: 'Main',
    type: 'success',
    message: 'Node.js Core khởi động hoàn tất. Đang lắng nghe luồng Windows Spooler...',
  },
  {
    id: 'l3',
    timestamp: '10:29:13',
    source: 'PowerShell',
    type: 'info',
    message: 'Thành công truy vấn danh dách máy in hệ thống (Get-Printer | Select-Object Name, PortName).',
  },
  {
    id: 'l4',
    timestamp: '10:29:13',
    source: 'Main',
    type: 'info',
    message: 'Đã lập danh mục 4 máy in local. Tải kết nối spooler trực tiếp API Windows thành công.',
  },
  {
    id: 'l5',
    timestamp: '10:29:14',
    source: 'Renderer',
    type: 'success',
    message: 'Sẵn sàng quy trình điều phối in ấn PDF hàng loạt.',
  }
];

// Cầu nối Electron (chỉ tồn tại khi chạy trong app desktop, không có khi mở bằng trình duyệt).
const electron = typeof window !== 'undefined' ? window.electronAPI : undefined;
const IS_ELECTRON = !!electron?.isElectron;

// Máy in tạm khi danh sách thật chưa nạp xong (tránh crash các panel con).
const PLACEHOLDER_PRINTER: Printer = {
  id: '__loading__',
  name: 'Đang tải máy in...',
  isDefault: false,
  isOnline: false,
  status: 'offline',
  paperSizes: ['A4'],
  supportedDuplex: false,
  connectionType: 'USB',
  location: '—',
};

export default function App() {
  // Trong Electron: bắt đầu với danh sách rỗng, sẽ nạp máy in thật + file thật.
  // Trong trình duyệt (dev): dùng dữ liệu mô phỏng để xem giao diện.
  const [printers, setPrinters] = useState<Printer[]>(IS_ELECTRON ? [] : INITIAL_PRINTERS);
  const [files, setFiles] = useState<PrintFile[]>(IS_ELECTRON ? [] : INITIAL_FILES);
  const [logs, setLogs] = useState<IPCLog[]>(INITIAL_LOGS);
  // Cờ huỷ cho luồng in thật (SumatraPDF chạy tuần tự, huỷ = dừng nạp file kế tiếp).
  const cancelRef = useRef(false);
  
  // Settings Hook
  const [settings, setSettings] = useState<PrintSettings>({
    printerId: 'canon-lbp2900',
    copies: 1,
    paperSize: 'A4',
    duplex: 'none',
    orientation: 'portrait',
    pagesOption: 'all',
    customPages: '',
  });

  // Printing state machine variables
  const [isPrinting, setIsPrinting] = useState(false);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);

  // Helper: Create log line with correct timestamp
  const addLog = useCallback((source: IPCLog['source'], type: IPCLog['type'], message: string) => {
    const time = new Date().toLocaleTimeString('vi-VN', { hour12: false });
    const newLog: IPCLog = {
      id: `log_${Date.now()}_${Math.random()}`,
      timestamp: time,
      source,
      type,
      message,
    };
    setLogs((prev) => [...prev, newLog]);
  }, []);

  // Nạp danh sách máy in THẬT của hệ thống khi khởi động (chỉ trong Electron).
  useEffect(() => {
    if (!IS_ELECTRON || !electron) return;
    let cancelled = false;

    (async () => {
      addLog('Main', 'info', 'Đang truy vấn máy in hệ thống qua Windows Spooler...');
      try {
        const { printers: native, defaultPrinterName } = await electron.listPrinters();
        if (cancelled) return;

        if (!native.length) {
          addLog('PowerShell', 'warn', 'Không tìm thấy máy in nào được cài trên hệ thống.');
          return;
        }

        const mapped: Printer[] = native.map((np) => ({
          id: np.deviceId || np.name,
          name: np.name,
          isDefault: np.name === defaultPrinterName,
          isOnline: true,
          status: 'idle',
          paperSizes: ['A4', 'A5', 'Letter'],
          supportedDuplex: true,
          connectionType: 'Network',
          location: 'Máy in hệ thống',
        }));

        setPrinters(mapped);
        const def = mapped.find((p) => p.isDefault) || mapped[0];
        setSettings((prev) => ({ ...prev, printerId: def.id }));
        addLog('PowerShell', 'success', `Đã phát hiện ${mapped.length} máy in thật. Máy in mặc định: ${def.name}.`);
      } catch (err) {
        addLog('Main', 'error', `Lỗi truy vấn máy in: ${err instanceof Error ? err.message : String(err)}`);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUpdateSettings = (newSettings: Partial<PrintSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      // Log setting modifications if any
      if (newSettings.printerId) {
        const printerName = printers.find(p => p.id === newSettings.printerId)?.name;
        addLog('Renderer', 'info', `Thay đổi máy in đích sang: ${printerName}`);
      }
      return updated;
    });
  };

  // Toggle Printer hardware online status
  const handleToggleOnline = () => {
    setPrinters((prevPrinters) => {
      return prevPrinters.map((p) => {
        if (p.id === settings.printerId) {
          const nextOnline = !p.isOnline;
          const nextStatus = nextOnline ? 'idle' : 'offline';
          
          addLog(
            'PowerShell',
            nextOnline ? 'success' : 'warn',
            nextOnline 
              ? `Thiết bị '${p.name}' đã trực tuyến trở lại. Đang kích hoạt Port Spooler.`
              : `Máy in '${p.name}' ngắt kết nối vật lý. Trạng thái Windows Spooler: OFFLINE.`
          );

          // Force-pause active print queue if it's currently printing on this model
          if (!nextOnline && isPrinting) {
            setIsPrinting(false);
            addLog('Main', 'error', `Hủy hàng đợi in cưỡng bức do máy in ngắt kết nối.`);
          }

          return { ...p, isOnline: nextOnline, status: nextStatus };
        }
        return p;
      });
    });
  };

  // Trigger Mechanical Paper Jam
  const handleTriggerJam = () => {
    setPrinters((prevPrinters) => {
      return prevPrinters.map((p) => {
        if (p.id === settings.printerId) {
          addLog('PowerShell', 'error', `CẢNH BÁO: Máy in ${p.name} gặp lỗi vật lý kẹt giấy (Hardware Paper Jam)! Windows Spooler dừng khẩn cấp.`);
          
          if (isPrinting) {
            setIsPrinting(false);
            addLog('Main', 'error', `TẠM DỪNG: Dây chuyền in hàng loạt bị tạm dừng tại file số ${currentFileIndex + 1}.`);
          }

          return { ...p, status: 'paper_jam' };
        }
        return p;
      });
    });
  };

  // Resolve Mechanical Paper Jam
  const handleClearJam = () => {
    setPrinters((prevPrinters) => {
      return prevPrinters.map((p) => {
        if (p.id === settings.printerId) {
          addLog('PowerShell', 'success', `Đã dọn sạch khay cuốn giấy của '${p.name}'. Reset trạng thái sẵn sàng.`);
          return { ...p, status: 'idle' };
        }
        return p;
      });
    });
  };

  // Helper updates state of file
  const updateFileStatus = useCallback((id: string, status: PrintFile['status'], progress: number, errorMsg?: string) => {
    setFiles((prevFiles) =>
      prevFiles.map((f) => (f.id === id ? { ...f, status, progress, errorMsg } : f))
    );
  }, []);

  // Drag and Drop adding files
  const handleAddFiles = async (filesList: FileList | File[]) => {
    const array = Array.from(filesList);
    const validPdfFiles = array.filter(
      (file) => file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
    );

    if (validPdfFiles.length === 0) {
      addLog('Renderer', 'error', 'Tải tệp tin thất bại: Các tệp đã chọn không đúng định dạng PDF!');
      return;
    }

    const newPrintFiles: PrintFile[] = [];

    for (const file of validPdfFiles) {
      // Dynamic client-side binary page scanning
      const pageCount = await extractPdfPageCount(file);

      // Trong Electron: lấy đường dẫn thật để in. Nếu không có (vd file ảo),
      // ghi bytes ra file tạm rồi dùng đường dẫn đó.
      let filePath: string | undefined;
      if (IS_ELECTRON && electron) {
        filePath = electron.getPathForFile(file) || undefined;
        if (!filePath) {
          try {
            const bytes = new Uint8Array(await file.arrayBuffer());
            const r = await electron.writeTempFile(file.name, bytes);
            filePath = r.path;
          } catch (err) {
            addLog('Main', 'error', `Không thể chuẩn bị tệp "${file.name}": ${err instanceof Error ? err.message : String(err)}`);
          }
        }
      }

      const newFile: PrintFile = {
        id: `file_${Date.now()}_${Math.random()}`,
        name: file.name,
        size: file.size,
        pageCount,
        status: 'waiting',
        progress: 0,
        filePath,
      };

      newPrintFiles.push(newFile);
      addLog('Renderer', 'success', `Đã nạp tệp: ${file.name} (${pageCount} trang, ${Math.round(file.size / 1024)} KB)`);
    }

    setFiles((prev) => [...prev, ...newPrintFiles]);
  };

  // Chọn file PDF qua hộp thoại native của Windows (trả về đường dẫn thật chắc chắn).
  const handlePickNative = async () => {
    if (!IS_ELECTRON || !electron) return;
    const picked = await electron.pickFiles();
    if (!picked.length) return;

    const newPrintFiles: PrintFile[] = [];
    for (const f of picked) {
      newPrintFiles.push({
        id: `file_${Date.now()}_${Math.random()}`,
        name: f.name,
        size: f.size,
        // Đếm trang chính xác cần đọc lại file; ở đây ước lượng theo dung lượng cho nhanh.
        pageCount: Math.max(1, Math.ceil(f.size / (150 * 1024))),
        status: 'waiting',
        progress: 0,
        filePath: f.path,
      });
      addLog('Renderer', 'success', `Đã chọn tệp: ${f.name} (${Math.round(f.size / 1024)} KB)`);
    }
    setFiles((prev) => [...prev, ...newPrintFiles]);
  };

  const handleRemoveFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
    addLog('Renderer', 'info', `Gỡ tệp tin ID: ${id} khỏi hàng đợi.`);
  };

  const handleClearQueue = () => {
    setFiles([]);
    addLog('Renderer', 'warn', 'Đã xóa trắng danh sách hàng đợi in ấn.');
  };

  // Queue sorting
  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    setFiles((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[index - 1];
      copy[index - 1] = temp;
      return copy;
    });
    addLog('Renderer', 'info', `Thay đổi thứ tự: Chuyển tài liệu số ${index + 1} lên hàng số ${index}`);
  };

  const handleMoveDown = (index: number) => {
    setFiles((prev) => {
      if (index === prev.length - 1) return prev;
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[index + 1];
      copy[index + 1] = temp;
      return copy;
    });
    addLog('Renderer', 'info', `Thay đổi thứ tự: Chuyển tài liệu số ${index + 1} xuống hàng số ${index + 2}`);
  };

  // Ánh xạ cấu hình UI → tùy chọn của pdf-to-printer / SumatraPDF.
  const buildPrintOptions = (printerName: string) => {
    const sideMap: Record<PrintSettings['duplex'], 'simplex' | 'duplexlong' | 'duplexshort'> = {
      none: 'simplex',
      'long-edge': 'duplexlong',
      'short-edge': 'duplexshort',
    };
    const pages =
      settings.pagesOption === 'custom' && settings.customPages.trim()
        ? settings.customPages.trim()
        : undefined;

    return {
      printer: printerName,
      copies: settings.copies,
      paperSize: settings.paperSize,
      orientation: settings.orientation,
      side: sideMap[settings.duplex],
      ...(pages ? { pages } : {}),
    };
  };

  // Luồng IN THẬT (Electron): gửi từng file qua Windows Spooler, chờ kết quả thật.
  const runBatchReal = async (queue: PrintFile[], printer: Printer) => {
    if (!electron) return;
    cancelRef.current = false;
    setIsPrinting(true);
    setCurrentFileIndex(0);
    setPrinters((prev) =>
      prev.map((p) => (p.id === printer.id ? { ...p, status: 'printing' } : p))
    );

    const options = buildPrintOptions(printer.name);
    addLog('Renderer', 'info', `🚀 BẮT ĐẦU IN HÀNG LOẠT: ${queue.length} file PDF → "${printer.name}" | Khổ ${settings.paperSize}, ${settings.copies} bản.`);

    let completed = 0;
    let errored = 0;

    for (let i = 0; i < queue.length; i++) {
      if (cancelRef.current) {
        addLog('Renderer', 'warn', '🛑 Đã dừng theo yêu cầu người dùng.');
        break;
      }

      const f = queue[i];
      setCurrentFileIndex(i);

      if (!f.filePath) {
        updateFileStatus(f.id, 'error', 0, 'Không xác định được đường dẫn tệp trên ổ đĩa.');
        addLog('Spooler', 'error', `Bỏ qua "${f.name}": thiếu đường dẫn vật lý.`);
        errored++;
        continue;
      }

      updateFileStatus(f.id, 'spooling', 30);
      addLog('Spooler', 'info', `Gửi lệnh in: SumatraPDF -print-to "${printer.name}" -print-settings "${settings.copies}x,${settings.paperSize}" "${f.name}"`);
      updateFileStatus(f.id, 'printing', 70);

      const res = await electron.printFile(f.filePath, options);

      if (res.ok) {
        updateFileStatus(f.id, 'completed', 100);
        addLog('Spooler', 'success', `HOÀN THÀNH: Đã đẩy "${f.name}" vào hàng đợi máy in thành công.`);
        completed++;
      } else {
        updateFileStatus(f.id, 'error', 0, res.error || 'Lỗi không xác định khi in.');
        addLog('Spooler', 'error', `LỖI in "${f.name}": ${res.error}`);
        errored++;
      }
    }

    setIsPrinting(false);
    setPrinters((prev) =>
      prev.map((p) => (p.id === printer.id ? { ...p, status: 'idle' } : p))
    );
    addLog('Main', 'success', `🎉 KẾT THÚC: Đã in ${completed}/${queue.length} tệp (Lỗi: ${errored}).`);
  };

  // Control: Start print job sequence
  const handleStartBatchPrint = () => {
    if (files.length === 0) {
      addLog('Renderer', 'error', 'Hàng đợi in trống! Vui lòng kéo thả file PDF trước khi in.');
      return;
    }

    const currentPrinter = printers.find((p) => p.id === settings.printerId);
    if (!currentPrinter) return;

    if (currentPrinter.status === 'offline') {
      addLog('Renderer', 'error', `Lỗi: Máy in ${currentPrinter.name} đang ngoại tuyến! Hãy chuyển máy in sang Trực tuyến.`);
      return;
    }

    if (currentPrinter.status === 'paper_jam') {
      addLog('Renderer', 'error', `Lỗi kẹt giấy tại ${currentPrinter.name}! Hãy tháo tháo giấy và bấm "Gỡ kẹt giấy" trước.`);
      return;
    }

    // Reset progress details of any completed or error states to clean restart
    const resetQueue = files.map((f) => ({
      ...f,
      status: 'waiting' as const,
      progress: 0,
      errorMsg: undefined,
    }));
    setFiles(resetQueue);

    // CHẾ ĐỘ IN THẬT (Electron): gửi tuần tự qua Windows Spooler.
    if (IS_ELECTRON) {
      void runBatchReal(resetQueue, currentPrinter);
      return;
    }

    // CHẾ ĐỘ MÔ PHỎNG (trình duyệt/dev): chạy máy trạng thái giả lập.
    setIsPrinting(true);
    setCurrentFileIndex(0);

    // Set active printer to printing
    setPrinters((prev) =>
      prev.map((p) => (p.id === settings.printerId ? { ...p, status: 'printing' } : p))
    );

    addLog('Renderer', 'info', `🚀 BẮT ĐẦU IN HÀNG LOẠT (MÔ PHỎNG): ${files.length} file PDF | Khổ ${settings.paperSize}, ${settings.copies} bản.`);
  };

  // Request Stop / Cancel Print jobs
  const handleCancelPrint = () => {
    cancelRef.current = true; // dừng luồng in thật trước file kế tiếp
    setIsPrinting(false);

    // Reset printer state
    const currentPrinter = printers.find(p => p.id === settings.printerId);
    const resetStatus = (currentPrinter?.status === 'offline' || currentPrinter?.status === 'paper_jam') 
      ? currentPrinter.status 
      : 'idle';

    setPrinters((prev) =>
      prev.map((p) => (p.id === settings.printerId ? { ...p, status: resetStatus } : p))
    );

    // Cancel all remaining waiting or spooling files
    setFiles((prev) =>
      prev.map((f) => {
        if (f.status === 'spooling' || f.status === 'printing') {
          return { ...f, status: 'waiting', progress: 0 };
        }
        return f;
      })
    );

    addLog('Renderer', 'warn', `🛑 ĐÃ HỦY LỆNH IN HÀNG LOẠT.`);
    addLog('PowerShell', 'warn', `Gửi lệnh PowerShell: Cancel-PrintJob -PrinterName "${currentPrinter?.name}" -ID *`);
    addLog('Main', 'success', 'Flush thành công bộ đệm Windows Print Spooler.');
  };

  // State loop for simulating printer spooler processing timers (CHỈ chế độ mô phỏng).
  useEffect(() => {
    if (IS_ELECTRON) return; // Electron dùng luồng in thật runBatchReal, không mô phỏng.
    if (!isPrinting) return;

    // Boundary check
    if (currentFileIndex >= files.length) {
      setIsPrinting(false);
      
      // Reset active printer back to idle if not faulted
      const currentPrinter = printers.find(p => p.id === settings.printerId);
      const finalStatus = (currentPrinter?.status === 'offline' || currentPrinter?.status === 'paper_jam') 
        ? currentPrinter.status 
        : 'idle';

      setPrinters((prev) =>
        prev.map((p) => (p.id === settings.printerId ? { ...p, status: finalStatus } : p))
      );

      // Print total success log
      const completedCount = files.filter(f => f.status === 'completed').length;
      const errorCount = files.filter(f => f.status === 'error').length;

      addLog('Main', 'success', `🎉 HOÀN TẤT THÀNH CÔNG: Đã in xong ${completedCount}/${files.length} tệp tin (Lỗi: ${errorCount}).`);
      return;
    }

    const activeFile = files[currentFileIndex];
    if (!activeFile) return;

    // Safety check with current printer's real-time state changes
    const currentPrinter = printers.find((p) => p.id === settings.printerId);
    if (!currentPrinter || currentPrinter.status === 'offline' || currentPrinter.status === 'paper_jam') {
      setIsPrinting(false);
      
      // Put file back to waiting or keep as is
      if (activeFile.status === 'printing' || activeFile.status === 'spooling') {
        updateFileStatus(activeFile.id, 'waiting', 0);
      }
      
      addLog('Main', 'error', 'Tạm ngắt hàng đợi do sự cố máy in (Lỗi phần cứng hoặc Offline).');
      return;
    }

    const isEncrypted = activeFile.name.toLowerCase().includes('pass') ||
                        activeFile.name.toLowerCase().includes('lock') ||
                        activeFile.name.toLowerCase().includes('encrypt');

    // 1. Spooling Stage (preparing bytes to driver queue)
    if (activeFile.status === 'waiting') {
      updateFileStatus(activeFile.id, 'spooling', 0);
      addLog('Main', 'info', `[IPC Hub] Đang trung chuyển file "${activeFile.name}" ra đệm ổ đĩa tạm...`);
      return;
    }

    // 2. Transmit to printer CLI
    if (activeFile.status === 'spooling') {
      const spoolerDelay = setTimeout(() => {
        if (isEncrypted) {
          // Failure decryption case
          updateFileStatus(activeFile.id, 'error', 0, 'Lỗi mật mã hóa: File PDF bị cài bảo mật chặn phân rã!');
          addLog('Spooler', 'error', `Không thể nạp tệp: API Spooler -PrintTo "${currentPrinter.name}" "${activeFile.name}" (Error Code: Decryption failed, password needed)`);
          addLog('Main', 'warn', `Bỏ qua tệp tin mã hóa bảo mật, tự động kích hoạt tệp tiếp theo.`);
          
          // Proceed immediately to skip this file
          setCurrentFileIndex((prev) => prev + 1);
        } else {
          // Start actual simulated print flow
          updateFileStatus(activeFile.id, 'printing', 10);
          addLog('Spooler', 'info', `Khởi tạo tiến trình in: Out-Printer "${currentPrinter.name}" -Copies ${settings.copies} -PaperSize "${settings.paperSize}" -Duplex "${settings.duplex}" "${activeFile.name}"`);
          addLog('PowerShell', 'info', `[Windows Spooler] Khởi tạo ID Job #${Math.floor(Math.random() * 900 + 100)}: "${activeFile.name}"`);
        }
      }, 1000); // spooling preparation latency simulation
      return () => clearTimeout(spoolerDelay);
    }

    // 3. Printing progression stage (page by page simulation)
    if (activeFile.status === 'printing') {
      if (activeFile.progress >= 100) {
        updateFileStatus(activeFile.id, 'completed', 100);
        addLog('Spooler', 'success', `HOÀN THÀNH: Đã kết thúc Job in "${activeFile.name}" (${activeFile.pageCount * settings.copies} trang vật lý) qua Spooler.`);
        
        // Move to next file index in queue
        setCurrentFileIndex((prev) => prev + 1);
        return;
      }

      // Progression loop velocity depends on pageCount and settings copies
      const velocityDelayCheck = setTimeout(() => {
        // Larger files or more copies print slower
        const printChunkSpeed = Math.max(12, Math.floor(120 / (activeFile.pageCount * settings.copies)));
        const nextProgress = Math.min(100, activeFile.progress + printChunkSpeed);
        
        updateFileStatus(activeFile.id, 'printing', nextProgress);
      }, 500);

      return () => clearTimeout(velocityDelayCheck);
    }

  }, [isPrinting, currentFileIndex, files, settings, printers, updateFileStatus, addLog]);

  // Combined Progress Calculation
  const getOverallProgress = () => {
    if (files.length === 0) return 0;
    
    // Sum exact contributions
    let totalProgressSum = 0;
    files.forEach((file) => {
      if (file.status === 'completed') {
        totalProgressSum += 100;
      } else if (file.status === 'printing' || file.status === 'spooling') {
        totalProgressSum += file.progress;
      } else if (file.status === 'error') {
        // Errors contribute fully so total percentage finishes nicely or is skipped
        totalProgressSum += 100;
      }
    });

    return totalProgressSum / (files.length * 100) * 100;
  };

  const getCompletedCount = () => files.filter(f => f.status === 'completed').length;
  const getErrorCount = () => files.filter(f => f.status === 'error').length;
  const overallProgress = getOverallProgress();

  // Download Printed report package
  const handleDownloadReport = () => {
    const reportText = `========================================================================
BÁO CÁO TIẾN TRÌNH IN HÀNG LOẠT (BATCH PRINT REPORT)
========================================================================
- Ngày xuất báo cáo : ${new Date().toLocaleString('vi-VN')}
- Tổng số tài liệu  : ${files.length} tệp tin
- Đã in hoàn thành : ${getCompletedCount()} tệp tin
- Gặp lỗi hệ thống  : ${getErrorCount()} tệp tin
- Thiết bị in đích  : ${printers.find(p => p.id === settings.printerId)?.name}
- Cấu hình in       : Khổ ${settings.paperSize} | In 2 mặt: ${settings.duplex} | Hướng: ${settings.orientation}

DANH SÁCH CHI TIẾT CÁC TỆP IN:
------------------------------------------------------------------------
${files.map((f, i) => `${i + 1}. [${f.status.toUpperCase()}] ${f.name}
   - Kích thước: ${Math.round(f.size/1024)} KB | Số trang gốc: ${f.pageCount} | Trang in thực tế: ${f.pageCount * settings.copies}
   ${f.errorMsg ? `- Lý do lỗi: ${f.errorMsg}` : ''}`).join('\n\n')}

CÁC LỆNH CHẠY HỆ THỐNG ĐÃ GHI NHẬN (SPOOLER SHELL COMMANDS):
------------------------------------------------------------------------
${logs.map(l => `[${l.timestamp}] [${l.source}] [${l.type.toUpperCase()}] ${l.message}`).join('\n')}

========================================================================
Thiết kế phát triển bởi Bộ công cụ Batch PDF Printer Desktop Simulation v1.0`;

    const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `BatchPrintResult_${new Date().toISOString().slice(0,10)}.txt`;
    link.click();
    addLog('Renderer', 'success', 'Đã tải xuống file báo cáo kết quả in hàng loạt.');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col font-sans selection:bg-blue-600/10" id="main-application-view">
      {/* Upper Navigation/Header Bar - Clean Minimalism */}
      <header className="bg-white border-b border-slate-200/80 py-4.5 px-6 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-sm select-none">
              P
            </div>
            <div>
              <div className="flex items-baseline gap-1.5">
                <h1 className="font-bold text-slate-900 text-base tracking-tight">Batch PDF Printer</h1>
                <span className="text-slate-400 font-normal text-xs">v1.0</span>
              </div>
              <p className="text-[11px] text-slate-500 font-mono">{IS_ELECTRON ? 'Desktop / In thật qua Windows Spooler' : 'Simulated Platform / Windows Spooler shell'}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-xs font-medium text-slate-600">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/60 px-3 py-1.5 rounded-lg select-none font-mono text-[10px]">
              <Laptop className="w-3.5 h-3.5 text-blue-600" />
              <span>{IS_ELECTRON ? 'LIVE: WINDOWS SPOOLER' : 'SIM: WINDOWS_NT • PORT: 3000'}</span>
            </div>
            <div className="hidden md:block text-right text-[11px] text-slate-500 select-none">
              <span className="font-semibold text-slate-800">{files.length} tệp tin đã chọn</span>
              {files.length > 0 && ` • ${Math.round(files.reduce((sum, f) => sum + f.size, 0) / (1024 * 1024) * 10) / 10} MB`}
            </div>
          </div>
        </div>
      </header>

      {/* Main Grid Workspace Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 pb-28">
        {/* Left column: Configurations & Printer Mechanical Animation (Cols: 5) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Settings options */}
          <PrintConfig
            printers={printers}
            settings={settings}
            onChangeSettings={handleUpdateSettings}
            isPrinting={isPrinting}
          />

          {/* Physical Printer simulation panel */}
          <PrinterVisualizer
            activePrinter={printers.find((p) => p.id === settings.printerId) || printers[0] || PLACEHOLDER_PRINTER}
            activeFileName={files[currentFileIndex]?.name || ''}
            activeFileProgress={files[currentFileIndex]?.progress || 0}
            onToggleOnline={handleToggleOnline}
            onTriggerJam={handleTriggerJam}
            onClearJam={handleClearJam}
          />
        </div>

        {/* Right column: Main files workspace dropzone & data-table (Cols: 7) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Main workspace queue files */}
          <FileWorkspace
            files={files}
            onAddFiles={handleAddFiles}
            onRemoveFile={handleRemoveFile}
            onClearQueue={handleClearQueue}
            onMoveUp={handleMoveUp}
            onMoveDown={handleMoveDown}
            isPrinting={isPrinting}
            onPickNative={IS_ELECTRON ? handlePickNative : undefined}
          />

          {/* PowerShell terminal logs output console */}
          <SystemLogs
            logs={logs}
            onClearLogs={() => setLogs([])}
          />
        </div>
      </main>

      {/* Sticky Bottom Action Progression Bar - Solid Minimalist Shadow */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200/80 shadow-[0_-4px_12px_rgba(0,0,0,0.04)] py-4 px-6 z-40">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-5">
          {/* Batch progression status */}
          <div className="flex-1 flex flex-col gap-1.5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs font-bold text-slate-700 font-mono flex items-center gap-1.5">
                TIẾN ĐỘ TỔNG THỂ: 
                <span className="text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded text-[11px]">
                  {getCompletedCount()} / {files.length} tệp tin
                </span>
                {getErrorCount() > 0 && (
                  <span className="text-rose-600 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded text-[11px] animate-pulse">
                    {getErrorCount()} lỗi
                  </span>
                )}
              </span>
              <span className="text-xs font-bold font-mono text-blue-600">
                {Math.round(overallProgress)}%
              </span>
            </div>

            {/* Overall Continuous progression visual bar */}
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-205/50 flex shadow-inner">
              <div
                className="h-full rounded-full transition-all duration-300 ease-out bg-blue-600"
                style={{ width: `${overallProgress}%` }}
              ></div>
            </div>
            
            {/* Action summary tips */}
            <p className="text-[10px] text-slate-400 font-mono">
              {isPrinting 
                ? `Đang xử lý: ${files[currentFileIndex]?.name || ''} (${currentFileIndex + 1}/${files.length} file)...`
                : 'Mô phỏng Spooler ở trạng thái sẵn sàng khởi chạy.'}
            </p>
          </div>

          {/* Start and Stop actions */}
          <div className="flex items-center gap-3 shrink-0">
            {overallProgress > 0 && !isPrinting && (
              <button
                onClick={handleDownloadReport}
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs px-4 py-2.5 rounded-lg border border-slate-700 transition"
                title="Download report summary"
              >
                <Download className="w-3.5 h-3.5 text-blue-400" />
                <span>Xuất báo cáo</span>
              </button>
            )}

            {isPrinting ? (
              <button
                onClick={handleCancelPrint}
                id="cancel-print-btn"
                className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs px-5 py-2.5 rounded-lg border border-slate-200 transition-all cursor-pointer"
              >
                <XSquare className="w-4 h-4 text-slate-500 animate-pulse" />
                <span>HỦY TIẾN TRÌNH IN</span>
              </button>
            ) : (
              <button
                disabled={files.length === 0}
                onClick={handleStartBatchPrint}
                id="start-print-btn"
                className={`flex items-center gap-2 text-white font-semibold text-xs px-6 py-2.5 rounded-lg group transition-all duration-150 shadow-sm ${
                  files.length === 0
                    ? 'bg-slate-300 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 cursor-pointer'
                }`}
              >
                <Play className="w-4.5 h-4.5 group-hover:scale-105 transition shrink-0" />
                <span>BẮT ĐẦU IN NGAY</span>
              </button>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
