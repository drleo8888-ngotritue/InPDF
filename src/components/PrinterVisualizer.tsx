/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Printer as PrinterIcon, AlertTriangle, CloudOff, Play, RefreshCw, XCircle } from 'lucide-react';
import { Printer } from '../types';

interface PrinterVisualizerProps {
  activePrinter: Printer;
  activeFileName: string;
  activeFileProgress: number;
  onToggleOnline: () => void;
  onTriggerJam: () => void;
  onClearJam: () => void;
}

export const PrinterVisualizer: React.FC<PrinterVisualizerProps> = ({
  activePrinter,
  activeFileName,
  activeFileProgress,
  onToggleOnline,
  onTriggerJam,
  onClearJam,
}) => {
  const isPrinting = activePrinter.status === 'printing';
  const isOffline = activePrinter.status === 'offline';
  const isJammed = activePrinter.status === 'paper_jam';

  return (
    <div className="bg-white text-slate-800 rounded-xl p-5 border border-slate-200 flex flex-col gap-5 select-none" id="printer-sim-view">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-slate-50 rounded-lg">
            <PrinterIcon className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-xs tracking-wider uppercase">MÔ PHỎNG PHẦN CỨNG MÁY IN</h3>
            <p className="text-[10px] text-slate-400 font-mono">Spooler Hardware Simulator</p>
          </div>
        </div>
        <div className="flex gap-2">
          {/* LED Indicators */}
          <div className="flex items-center gap-3 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/80 font-mono text-[9px]">
            <div className="flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${!isOffline && !isJammed ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></span>
              <span className="text-slate-500">READY</span>
            </div>
            <div className="flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${isOffline ? 'bg-amber-400' : 'bg-slate-300'}`}></span>
              <span className="text-slate-500">OFFLINE</span>
            </div>
            <div className="flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${isJammed ? 'bg-rose-500 animate-ping' : 'bg-slate-300'}`}></span>
              <span className="text-rose-600 font-semibold">JAM</span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Printer Assembly */}
      <div className="relative flex flex-col items-center justify-center py-6 bg-[#F8FAFC] rounded-lg border border-slate-200 overflow-hidden h-60">
        {/* Paper animation background */}
        <div className="absolute inset-0 pointer-events-none opacity-5 font-mono text-[8px] text-slate-700 p-4 overflow-hidden select-none whitespace-pre leading-normal">
          {`%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [ 3 0 R ] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R >>\nendobj\nstream\n70 500 Td\n(SUMATRAPDF SPOOLER SHILED)\nET\nendstream`}
        </div>

        {/* Dynamic Physical Paper Flow Component */}
        <div className="relative w-44 h-44 flex items-center justify-center">
          {/* Upper Output Slot Cover */}
          <div className="absolute top-10 w-36 h-2 bg-slate-200 border border-slate-300 rounded z-35 flex items-center justify-center">
            <div className="w-28 h-0.5 bg-slate-400 rounded"></div>
          </div>

          {/* Gliding Paper Output Animation */}
          {isPrinting && (
            <div 
              style={{ 
                transform: `translateY(-${activeFileProgress * 0.35}px)`,
                opacity: activeFileProgress > 5 ? 1 : 0
              }}
              className="absolute w-26 h-32 bg-white rounded border border-slate-200 shadow-[0_2px_8px_rgba(0,0,0,0.05)] p-2.5 flex flex-col justify-between transition-all duration-300 ease-out z-10"
            >
              <div className="space-y-1.5">
                <div className="w-full h-1 bg-blue-100 rounded"></div>
                <div className="w-5/6 h-0.5 bg-slate-200 rounded"></div>
                <div className="w-4/6 h-0.5 bg-slate-200 rounded"></div>
                <div className="w-full h-0.5 bg-slate-200 rounded"></div>
              </div>
              <div className="flex items-center justify-between mt-auto">
                <div className="text-[7.5px] text-slate-450 font-mono max-w-[80%] truncate">
                  {activeFileName || "document.pdf"}
                </div>
                <div className="text-[7.5px] text-blue-600 font-bold font-mono">
                  {Math.round(activeFileProgress)}%
                </div>
              </div>
            </div>
          )}

          {/* Jammed Paper Visual */}
          {isJammed && (
            <div className="absolute top-8 w-26 h-18 bg-rose-50 rounded border border-rose-350 shadow-sm p-2 flex flex-col justify-center items-center text-center rotate-3 animate-bounce z-10">
              <AlertTriangle className="w-4 h-4 text-rose-600 mb-0.5" />
              <p className="text-[7.5px] font-bold text-rose-700 leading-tight">KẸT GIẤY</p>
              <p className="text-[6px] text-slate-400 font-mono mt-0.5 leading-none">Vui lòng bấm gỡ lỗi</p>
            </div>
          )}

          {/* Main Printer Chassis */}
          <div className="absolute bottom-4 w-32 h-20 bg-slate-100 rounded-lg border border-slate-250 shadow-md flex flex-col justify-between p-2.5 z-30">
            {/* Front panel details */}
            <div className="flex justify-between items-start">
              <div className="flex gap-0.5">
                {/* Status dot lights */}
                <span className={`w-1 h-1 rounded-full ${isPrinting ? 'bg-blue-500 animate-ping' : 'bg-slate-300'}`}></span>
                <span className={`w-1 h-1 rounded-full ${isJammed ? 'bg-rose-500 animate-pulse' : 'bg-slate-300'}`}></span>
              </div>
              <div className="w-8 h-1 bg-slate-300 rounded"></div>
            </div>

            {/* Simulated mechanical roller display */}
            <div className="flex justify-center">
              <div className="flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-slate-200">
                <RefreshCw className={`w-2.5 h-2.5 text-slate-400 ${isPrinting ? 'animate-spin' : ''}`} style={{ animationDuration: '1.5s' }} />
                <span className="text-[7.5px] font-mono text-slate-500 tracking-wider">ROLLERS</span>
              </div>
            </div>

            {/* Output shelf logo */}
            <div className="flex justify-between items-center text-slate-400 text-[7px] font-mono">
              <span>PDF-9600i</span>
              <div className="flex items-center gap-0.5">
                <span className="w-1 h-1 bg-emerald-400 rounded-full"></span>
                <span className="text-[6px] text-slate-500">READY</span>
              </div>
            </div>
          </div>

          {/* Lower Input Tray Cover */}
          <div className="absolute bottom-1 w-28 h-3 bg-slate-200 border-t border-slate-300 rounded-b z-20 flex justify-center">
            <div className="w-20 h-0.5 bg-slate-300 rounded-b"></div>
          </div>
        </div>

        {/* Connection Mode Tag */}
        <div className="absolute bottom-2 font-mono text-[8px] text-slate-400 bg-white px-2 py-0.5 rounded border border-slate-200 flex items-center gap-1 shadow-sm">
          <span className="w-1 h-1 rounded-full bg-blue-500"></span>
          <span>SPOOLER PORT: USB001</span>
        </div>
      </div>

      {/* Simulator Error Injection Dashboard */}
      <div className="bg-slate-50/60 p-4 rounded-lg border border-slate-200">
        <div className="text-slate-700 font-bold font-mono text-xs mb-3 flex items-center gap-1.5 justify-between">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            THỬ NGHIỆM GIẢ LẬP LỖI PHẦN CỨNG
          </span>
          <span className="text-[9px] text-slate-450 font-normal">Diagnostic Fault Panel</span>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {/* Online Toggle */}
          <button
            onClick={onToggleOnline}
            id="toggle-online-btn"
            className={`flex items-center justify-between text-xs font-semibold px-3 py-2 rounded-lg border text-left transition-all duration-100 cursor-pointer ${
              isOffline
                ? 'bg-amber-50 border-amber-200 hover:bg-amber-100 text-amber-700'
                : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'
            }`}
          >
            <div className="flex flex-col">
              <span className="text-[9px] text-slate-405 font-mono">Trạng thái</span>
              <span>{isOffline ? 'Kết nối Lại' : 'Mất kết nối'}</span>
            </div>
            <CloudOff className="w-4 h-4 text-slate-400" />
          </button>

          {/* Jam Toggle / Clear */}
          {isJammed ? (
            <button
              onClick={onClearJam}
              id="clear-jam-btn"
              className="flex items-center justify-between text-xs font-semibold px-3 py-2 rounded-lg border bg-emerald-50 border-emerald-200 hover:bg-emerald-100 text-emerald-700 text-left transition-all duration-100 cursor-pointer animate-pulse"
            >
              <div className="flex flex-col">
                <span className="text-[9px] text-emerald-600 font-mono">Hành động</span>
                <span>Gỡ kẹt giấy</span>
              </div>
              <Play className="w-4 h-4 text-emerald-500" />
            </button>
          ) : (
            <button
              disabled={isOffline}
              onClick={onTriggerJam}
              id="trigger-jam-btn"
              className={`flex items-center justify-between text-xs font-semibold px-3 py-2 rounded-lg border text-left transition-all duration-100 ${
                isOffline 
                  ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-white border-slate-250 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-650 text-slate-605 cursor-pointer'
              }`}
            >
              <div className="flex flex-col">
                <span className="text-[9px] text-slate-460 font-mono">Sự cố</span>
                <span>Kẹt giấy in</span>
              </div>
              <AlertTriangle className="w-4 h-4 text-slate-400" />
            </button>
          )}
        </div>

        <div className="mt-3 text-[9.5px] text-slate-500 font-mono bg-white p-2.5 rounded border border-slate-200 leading-snug">
          💡 <strong className="text-slate-700">Thao tác mô phỏng:</strong> Chuyển máy in sang <strong className="text-amber-500">Mất kết nối</strong> hoặc <strong className="text-red-500">Kẹt giấy</strong> khi đang chạy hàng loạt để theo dõi cơ chế tạm dừng của spooler.
        </div>
      </div>
    </div>
  );
};
