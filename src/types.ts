/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface PrintFile {
  id: string;
  name: string;
  size: number;
  pageCount: number;
  status: 'waiting' | 'spooling' | 'printing' | 'completed' | 'error';
  progress: number;
  errorMsg?: string;
  /** Đường dẫn thật trên ổ đĩa — bắt buộc để in qua Windows Spooler. */
  filePath?: string;
}

export interface Printer {
  id: string;
  name: string;
  isDefault: boolean;
  isOnline: boolean;
  status: 'idle' | 'printing' | 'offline' | 'paper_jam';
  paperSizes: ('A4' | 'A5' | 'Letter')[];
  supportedDuplex: boolean;
  connectionType: 'USB' | 'Network' | 'Wi-Fi';
  location: string;
}

export interface PrintSettings {
  printerId: string;
  copies: number;
  paperSize: 'A4' | 'A5' | 'Letter';
  duplex: 'none' | 'long-edge' | 'short-edge';
  orientation: 'portrait' | 'landscape';
  pagesOption: 'all' | 'custom';
  customPages: string;
}

export interface IPCLog {
  id: string;
  timestamp: string;
  source: 'Renderer' | 'Main' | 'PowerShell' | 'Spooler';
  type: 'info' | 'success' | 'warn' | 'error';
  message: string;
}
