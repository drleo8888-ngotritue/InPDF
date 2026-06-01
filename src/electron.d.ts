/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Khai báo kiểu cho cầu nối window.electronAPI (xem electron/preload.cjs).
 */

export interface NativePrinter {
  deviceId: string;
  name: string;
  paperSizes: string[];
}

export interface ListPrintersResult {
  printers: NativePrinter[];
  defaultPrinterName: string | null;
}

export interface PickedFile {
  path: string;
  name: string;
  size: number;
}

export interface PrintNativeOptions {
  printer?: string;
  copies?: number;
  paperSize?: string;
  orientation?: 'portrait' | 'landscape';
  side?: 'simplex' | 'duplex' | 'duplexshort' | 'duplexlong';
  pages?: string;
}

export interface PrintResult {
  ok: boolean;
  error?: string;
}

export interface ElectronAPI {
  isElectron: true;
  listPrinters: () => Promise<ListPrintersResult>;
  pickFiles: () => Promise<PickedFile[]>;
  getPathForFile: (file: File) => string;
  writeTempFile: (
    name: string,
    bytes: Uint8Array,
  ) => Promise<{ path: string; size: number }>;
  printFile: (
    filePath: string,
    options: PrintNativeOptions,
  ) => Promise<PrintResult>;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};
