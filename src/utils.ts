/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Extracts the actual page count of a PDF file using client-side binary parsing.
 * Scans for /Type /Pages /Count directives and falls back gracefully.
 */
export async function extractPdfPageCount(file: File): Promise<number> {
  if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
    return 1;
  }

  try {
    // Read up to 1MB of the file (usually contains most of the cross-reference or page count objects)
    const limit = Math.min(file.size, 1024 * 1024);
    const buffer = await file.slice(0, limit).arrayBuffer();
    const text = new TextDecoder('utf-8', { fatal: false }).decode(buffer);

    // Search for: /Type /Pages /Count X or similar
    const countMatches = Array.from(text.matchAll(/\/Count\s+(\d+)/g));
    if (countMatches.length > 0) {
      let maxCount = 1;
      for (const match of countMatches) {
        const val = parseInt(match[1], 10);
        if (val > maxCount && val < 10000) {
          maxCount = val;
        }
      }
      return maxCount;
    }

    // Try counting /Type /Page objects
    const pageMatches = text.match(/\/Type\s*\/Page\b/g);
    if (pageMatches && pageMatches.length > 0) {
      return pageMatches.length;
    }

    // fallback mapping: assume roughly 150KB per page
    const estimated = Math.ceil(file.size / (150 * 1024));
    return Math.max(1, estimated);
  } catch (error) {
    console.error('Failed parsing PDF pages, using estimation', error);
    return Math.max(1, Math.ceil(file.size / (150 * 1024)));
  }
}

/**
 * Formats bytes to standard human-readable format.
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[Math.min(i, sizes.length - 1)];
}
