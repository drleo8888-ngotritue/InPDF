/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Settings, FileText, Copy, Printer as PrinterIcon, Clipboard, HelpCircle, Layers } from 'lucide-react';
import { Printer, PrintSettings } from '../types';

interface PrintConfigProps {
  printers: Printer[];
  settings: PrintSettings;
  onChangeSettings: (newSettings: Partial<PrintSettings>) => void;
  isPrinting: boolean;
}

export const PrintConfig: React.FC<PrintConfigProps> = ({
  printers,
  settings,
  onChangeSettings,
  isPrinting,
}) => {
  const selectedPrinter = printers.find((p) => p.id === settings.printerId) || printers[0];

  const handleCopiesChange = (val: number) => {
    if (val >= 1 && val <= 999) {
      onChangeSettings({ copies: val });
    }
  };

  const getStatusColor = (status: Printer['status']) => {
    switch (status) {
      case 'printing':
        return 'bg-blue-500 text-blue-100';
      case 'offline':
        return 'bg-amber-500 text-amber-950';
      case 'paper_jam':
        return 'bg-rose-500 text-rose-100 animate-pulse';
      default:
        return 'bg-emerald-500 text-emerald-950';
    }
  };

  const getStatusTextVietnamese = (status: Printer['status']) => {
    switch (status) {
      case 'printing':
        return 'Đang in';
      case 'offline':
        return 'Ngoại tuyến';
      case 'paper_jam':
        return 'Kẹt giấy!';
      default:
        return 'Sẵn sàng';
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col gap-5 select-none" id="printer-config-sidebar">
      {/* Sidebar Header */}
      <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
        <div className="p-1.5 bg-slate-50 rounded-lg">
          <Settings className="w-4 h-4 text-slate-500" />
        </div>
        <div>
          <h3 className="font-bold text-slate-800 text-xs tracking-wider uppercase">CẤU HÌNH THÔNG SỐ IN</h3>
          <p className="text-[10px] text-slate-400">Thiết lập tham số cho hàng loạt file</p>
        </div>
      </div>

      {/* Target Printer Selection */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
          <PrinterIcon className="w-3.5 h-3.5 text-slate-400" />
          <span>Máy in đích (Target Printer)</span>
        </label>
        <div className="relative">
          <select
            disabled={isPrinting}
            value={settings.printerId}
            onChange={(e) => onChangeSettings({ printerId: e.target.value })}
            className={`w-full text-xs font-medium border rounded-lg px-3 py-2 bg-slate-50 border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
              isPrinting ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer hover:bg-slate-100/50'
            }`}
          >
            {printers.length === 0 && (
              <option value="">Đang tải danh sách máy in hệ thống...</option>
            )}
            {printers.map((printer) => (
              <option key={printer.id} value={printer.id}>
                {printer.name} {printer.isDefault ? ' (Mặc định OS)' : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Selected Printer Mini Card */}
        {selectedPrinter && (
          <div className="bg-slate-50/70 border border-slate-200/60 rounded-lg p-2.5 flex items-center justify-between">
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-mono text-slate-500">
                Cổng kết nối: {selectedPrinter.connectionType} • {selectedPrinter.location}
              </span>
              <span className="text-[9px] text-slate-400">
                Hỗ trợ 2 mặt: {selectedPrinter.supportedDuplex ? 'Có' : 'Không'} • Khổ hỗ trợ: A4, A5, Letter
              </span>
            </div>
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${getStatusColor(selectedPrinter.status)}`}>
              {getStatusTextVietnamese(selectedPrinter.status)}
            </span>
          </div>
        )}
      </div>

      {/* Copies input */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
            <Copy className="w-3.5 h-3.5 text-slate-400" />
            <span>Số bản sao</span>
          </label>
          <div className="flex items-center">
            <button
              disabled={isPrinting || settings.copies <= 1}
              onClick={() => handleCopiesChange(settings.copies - 1)}
              type="button"
              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 rounded-l-md text-xs font-bold transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              -
            </button>
            <input
              type="number"
              disabled={isPrinting}
              min="1"
              max="999"
              value={settings.copies}
              onChange={(e) => handleCopiesChange(parseInt(e.target.value, 10) || 1)}
              className="w-full text-center text-xs font-bold border-y border-slate-200 py-1.5 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-blue-500/25"
            />
            <button
              disabled={isPrinting || settings.copies >= 999}
              onClick={() => handleCopiesChange(settings.copies + 1)}
              type="button"
              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 rounded-r-md text-xs font-bold transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              +
            </button>
          </div>
        </div>

        {/* Paper Size selector */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
            <Clipboard className="w-3.5 h-3.5 text-slate-400" />
            <span>Khổ giấy</span>
          </label>
          <select
            disabled={isPrinting}
            value={settings.paperSize}
            onChange={(e) => onChangeSettings({ paperSize: e.target.value as PrintSettings['paperSize'] })}
            className="w-full text-xs font-medium border border-slate-200 rounded-lg px-2.5 py-1.5 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
          >
            <option value="A4">A4 (210 x 297 mm)</option>
            <option value="A5">A5 (148 x 210 mm)</option>
            <option value="Letter">Letter (8.5 x 11 in)</option>
          </select>
        </div>
      </div>

      {/* Duplex and orientation settings */}
      <div className="flex flex-col gap-3.5 bg-slate-50/50 p-3 rounded-lg border border-slate-200/60">
        {/* Toggle duplex */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              <span>In 2 mặt (Duplex Printing)</span>
            </span>
            {!selectedPrinter?.supportedDuplex && (
              <span className="text-[8px] text-red-500 font-bold bg-red-100 px-1 py-0.2 rounded">Chỉ 1 mặt</span>
            )}
          </div>
          <select
            disabled={isPrinting || !selectedPrinter?.supportedDuplex}
            value={settings.duplex}
            onChange={(e) => onChangeSettings({ duplex: e.target.value as PrintSettings['duplex'] })}
            className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white disabled:bg-slate-100/70 disabled:opacity-60 focus:outline-none transition leading-tight font-medium"
          >
            <option value="none">Không in 2 mặt (SIM-SIMPLEX)</option>
            <option value="long-edge">Lật mặt theo lề dài (DUPLEX-LONG)</option>
            <option value="short-edge">Lật mặt theo lề ngắn (DUPLEX-SHORT)</option>
          </select>
        </div>

        {/* Orientation selector */}
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-slate-600 flex items-center gap-1">
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            <span>Hướng in (Orientation)</span>
          </span>
          <div className="grid grid-cols-2 gap-2">
            {(['portrait', 'landscape'] as const).map((dir) => (
              <button
                key={dir}
                type="button"
                disabled={isPrinting}
                onClick={() => onChangeSettings({ orientation: dir })}
                className={`py-1.5 text-xs font-semibold rounded-lg border transition ${
                  settings.orientation === dir
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {dir === 'portrait' ? 'Khổ dọc (Portrait)' : 'Khổ ngang (Landscape)'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Pages constraints custom specification */}
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center">
          <span className="text-xs font-semibold text-slate-605 flex items-center gap-1">
            <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
            <span>Phạm vi trang cần in</span>
          </span>
          <span className="text-[10px] text-slate-400 font-mono">Ví dụ: 1,3,5-12</span>
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="flex gap-4">
            <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
              <input
                disabled={isPrinting}
                type="radio"
                checked={settings.pagesOption === 'all'}
                onChange={() => onChangeSettings({ pagesOption: 'all' })}
                className="text-blue-600 focus:ring-blue-500"
              />
              <span>In tất cả các trang</span>
            </label>
            <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
              <input
                disabled={isPrinting}
                type="radio"
                checked={settings.pagesOption === 'custom'}
                onChange={() => onChangeSettings({ pagesOption: 'custom' })}
                className="text-blue-600 focus:ring-blue-500"
              />
              <span>Tùy chỉnh</span>
            </label>
          </div>

          {settings.pagesOption === 'custom' && (
            <input
              type="text"
              disabled={isPrinting}
              placeholder="Nhập phạm vi trang (ví dụ: 1, 2, 4-9)"
              value={settings.customPages}
              onChange={(e) => onChangeSettings({ customPages: e.target.value })}
              className="w-full text-xs font-mono border border-slate-200 rounded-lg px-3 py-1.5 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          )}
        </div>
      </div>
    </div>
  );
};
