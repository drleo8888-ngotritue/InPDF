/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from 'react';
import { Upload, File, Trash2, ArrowUp, ArrowDown, FileText, ChevronRight, X, Layers, AlertCircle, FileLock } from 'lucide-react';
import { PrintFile } from '../types';
import { formatBytes } from '../utils';

interface FileWorkspaceProps {
  files: PrintFile[];
  onAddFiles: (filesList: FileList | File[]) => void;
  onRemoveFile: (id: string) => void;
  onClearQueue: () => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  isPrinting: boolean;
  /** Chỉ có trong Electron: mở hộp thoại native chọn file PDF (đường dẫn thật). */
  onPickNative?: () => void;
}

export const FileWorkspace: React.FC<FileWorkspaceProps> = ({
  files,
  onAddFiles,
  onRemoveFile,
  onClearQueue,
  onMoveUp,
  onMoveDown,
  isPrinting,
  onPickNative,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      // Validate that these are mostly PDFs (we can do filter in App.tsx but let's send to handler)
      onAddFiles(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onAddFiles(e.target.files);
    }
  };

  const triggerInputClick = () => {
    if (!isPrinting && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const getStatusBadge = (file: PrintFile) => {
    switch (file.status) {
      case 'spooling':
        return (
          <span className="flex items-center gap-1.5 text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-pulse"></span>
            SPOOLING
          </span>
        );
      case 'printing':
        return (
          <span className="flex items-center gap-1.5 text-[10px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-105 px-2 py-0.5 rounded">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
            PRINTING
          </span>
        );
      case 'completed':
        return (
          <span className="flex items-center gap-1.5 text-[10px] font-mono font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded">
            <span>✓ HOÀN THÀNH</span>
          </span>
        );
      case 'error':
        return (
          <span className="flex items-center gap-1.5 text-[10px] font-mono font-bold bg-rose-50 text-rose-700 border border-rose-100 px-2 py-0.5 rounded">
            <span>⚠ LỖI IN</span>
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1.5 text-[10px] font-mono font-medium bg-slate-50 text-slate-500 border border-slate-200 px-2 py-0.5 rounded">
            <span>CHỜ IN</span>
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col gap-4 select-none" id="file-queue-workspace">
      {/* Workspace Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-slate-50 rounded-lg">
            <Layers className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-xs tracking-wider uppercase">DANH SÁCH FILE IN ({files.length})</h3>
            <p className="text-[10px] text-slate-500">Kéo thả tài liệu PDF để tự động hoá dây chuyền in</p>
          </div>
        </div>

        {files.length > 0 && !isPrinting && (
          <button
            onClick={onClearQueue}
            id="clear-all-queue-btn"
            className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 border border-rose-200 px-2.5 py-1.5 rounded-lg transition-all cursor-pointer"
          >
            Xóa danh sách
          </button>
        )}
      </div>

      {/* Drag & Drop zone */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={triggerInputClick}
        className={`border-2 border-dashed rounded-lg p-6 text-center flex flex-col items-center justify-center cursor-pointer transition-all ${
          dragActive
            ? 'border-blue-500 bg-blue-50/20 scale-[0.995]'
            : 'border-slate-205 hover:border-slate-350 hover:bg-slate-50/50'
        } ${isPrinting ? 'opacity-60 cursor-not-allowed pointer-events-none' : ''}`}
        id="drag-drop-viewport"
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,application/pdf"
          onChange={handleFileInputChange}
          className="hidden"
        />
        <div className="p-3 bg-slate-50 rounded-full mb-3 text-slate-450 border border-slate-100">
          <Upload className={`w-5 h-5 ${dragActive ? 'animate-bounce' : ''}`} />
        </div>
        <h4 className="text-xs font-semibold text-slate-800">Kéo tệp PDF vào màn hình này hoặc</h4>
        <p className="text-xs text-blue-600 font-semibold mt-1 hover:underline">nhấp chuột để duyệt file</p>
        <p className="text-[10px] text-slate-400 mt-1 font-mono">Hỗ trợ in cùng lúc số lượng lớn tài liệu .pdf</p>
        {onPickNative && (
          <button
            type="button"
            disabled={isPrinting}
            onClick={(e) => {
              e.stopPropagation();
              onPickNative();
            }}
            className="mt-3 text-[11px] font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 px-3 py-1.5 rounded-lg transition disabled:opacity-50"
          >
            Chọn file từ máy (hộp thoại Windows)
          </button>
        )}
      </div>

      {/* Files Data Table */}
      {files.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center text-slate-400 gap-2 border border-slate-100 rounded-xl bg-slate-50/20">
          <FileText className="w-8 h-8 text-slate-300 stroke-[1.5]" />
          <div>
            <p className="text-xs font-semibold text-slate-500">Hàng đợi in hiện trống</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Nạp dữ liệu vào hàng đợi để chuẩn bị in hàng loạt</p>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto border border-slate-200/80 rounded-lg bg-white" id="queue-data-table-wrapper">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50/80 border-b border-slate-205 text-slate-500 font-mono text-[9px] uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-3 select-none w-14 text-center">STT</th>
                <th className="py-2.5 px-3">Tên tài liệu</th>
                <th className="py-2.5 px-3 w-24">Kích thước</th>
                <th className="py-2.5 px-3 w-20 text-center">Số trang</th>
                <th className="py-2.5 px-3 w-32header">Trạng thái</th>
                <th className="py-2.5 px-3 w-16 text-center">Xóa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {files.map((file, index) => {
                const isItemPrinting = file.status === 'printing' || file.status === 'spooling';
                return (
                  <tr 
                    key={file.id} 
                    className={`hover:bg-slate-50/50 transition duration-100 ${
                      file.status === 'completed' ? 'bg-emerald-50/10' : ''
                    } ${file.status === 'error' ? 'bg-rose-50/10' : ''}`}
                  >
                    {/* Index & Drag Re-order buttons */}
                    <td className="py-2.5 px-2 text-center">
                      <div className="flex items-center justify-center gap-1 select-none">
                        <span className="font-mono text-slate-400 w-4 font-bold text-[10px]">{index + 1}</span>
                        {!isPrinting && (
                          <div className="flex flex-col gap-0.5 shrink-0">
                            <button
                              disabled={index === 0}
                              onClick={() => onMoveUp(index)}
                              className="p-0.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded disabled:opacity-30 disabled:pointer-events-none transition"
                              title="Lên"
                            >
                              <ArrowUp className="w-3 h-3" />
                            </button>
                            <button
                              disabled={index === files.length - 1}
                              onClick={() => onMoveDown(index)}
                              className="p-0.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded disabled:opacity-30 disabled:pointer-events-none transition"
                              title="Xuống"
                            >
                              <ArrowDown className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* PDF Document File Name */}
                    <td className="py-2.5 px-3 max-w-[200px] md:max-w-xs font-semibold">
                      <div className="flex items-center gap-2">
                        {file.name.toLowerCase().includes('pass') || file.name.toLowerCase().includes('lock') || file.name.toLowerCase().includes('encrypt') ? (
                          <FileLock className="w-4 h-4 text-amber-500 shrink-0" />
                        ) : (
                          <File className="w-4 h-4 text-blue-500/85 shrink-0" />
                        )}
                        <span className="truncate text-slate-800 font-normal text-xs" title={file.name}>
                          {file.name}
                        </span>
                      </div>
                    </td>

                    {/* File Size */}
                    <td className="py-2.5 px-3 font-mono text-slate-450 text-[10.5px]">
                      {formatBytes(file.size)}
                    </td>

                    {/* PDF Pages Counter */}
                    <td className="py-2.5 px-3 font-mono text-slate-600 text-[10.5px] font-semibold text-center">
                      {file.pageCount}
                    </td>

                    {/* State badge / progress info */}
                    <td className="py-2.5 px-3">
                      <div className="flex flex-col gap-1 w-full">
                        <div className="flex items-center justify-between">
                          {getStatusBadge(file)}
                          {isItemPrinting && (
                            <span className="text-[10px] font-mono text-blue-600 font-bold">
                              {Math.round(file.progress)}%
                            </span>
                          )}
                        </div>
                        {/* Progressive strip inside row */}
                        {isItemPrinting && (
                          <div className="w-full bg-slate-100 rounded-full h-1 overflow-hidden">
                            <div
                              className="bg-blue-600 h-1 rounded-full transition-all duration-200"
                              style={{ width: `${file.progress}%` }}
                            ></div>
                          </div>
                        )}
                        {file.status === 'error' && (
                          <div className="text-[10px] font-mono text-rose-600 flex items-center gap-1 leading-tight font-medium bg-rose-50 border border-rose-100 rounded p-1">
                            <AlertCircle className="w-3 h-3 shrink-0" />
                            <span>{file.errorMsg || 'In phát sinh lỗi'}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Row delete trigger */}
                    <td className="py-2.5 px-3 text-center">
                      <button
                        disabled={isPrinting}
                        onClick={() => onRemoveFile(file.id)}
                        className={`p-1.5 text-slate-400 rounded-md hover:bg-rose-50 hover:text-rose-600 transition ${
                          isPrinting ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
                        }`}
                        title="Xóa"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
