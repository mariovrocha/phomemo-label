/**
 * D30 printer protocol
 * Handles raster data rotation and ESC/POS command generation
 */

import { BLETransport } from "./ble-transport";

// D-series commands
const D_CMD = {
  HEADER: (widthBytes: number, rows: number) =>
    new Uint8Array([
      0x1b, 0x40, // ESC @ - Initialize
      0x1d, 0x76, 0x30, 0x00, // GS v 0 - Raster bit image
      widthBytes % 256,
      Math.floor(widthBytes / 256),
      rows % 256,
      Math.floor(rows / 256),
    ]),
  END: new Uint8Array([0x1b, 0x64, 0x00]),
};

// ESC 7 heat settings command
function heatSettingsCmd(
  maxDots: number,
  heatTime: number,
  heatInterval: number
): Uint8Array {
  return new Uint8Array([0x1b, 0x37, maxDots, heatTime, heatInterval]);
}

// Map density 1-8 to heat time
function densityToHeatTime(density: number): number {
  const heatTimes = [40, 60, 80, 100, 120, 140, 160, 200];
  return heatTimes[Math.max(0, Math.min(7, density - 1))];
}

/**
 * Rotate raster data 90 degrees clockwise for D-series printers.
 * D30 prints labels sideways, so we rotate the image.
 */
function rotateRaster90CW(
  data: Uint8Array,
  widthBytes: number,
  heightLines: number
) {
  const srcWidthPx = widthBytes * 8;
  const srcHeightPx = heightLines;

  const dstWidthPx = srcHeightPx;
  const dstHeightPx = srcWidthPx;
  const dstWidthBytes = Math.ceil(dstWidthPx / 8);

  const rotated = new Uint8Array(dstWidthBytes * dstHeightPx);

  for (let srcY = 0; srcY < srcHeightPx; srcY++) {
    for (let srcX = 0; srcX < srcWidthPx; srcX++) {
      const srcByteIdx = srcY * widthBytes + Math.floor(srcX / 8);
      const srcBitIdx = 7 - (srcX % 8);
      const pixel = (data[srcByteIdx] >> srcBitIdx) & 1;

      const dstX = srcHeightPx - 1 - srcY;
      const dstY = srcX;

      const dstByteIdx = dstY * dstWidthBytes + Math.floor(dstX / 8);
      const dstBitIdx = 7 - (dstX % 8);
      if (pixel) {
        rotated[dstByteIdx] |= 1 << dstBitIdx;
      }
    }
  }

  return { data: rotated, widthBytes: dstWidthBytes, heightLines: dstHeightPx };
}

/**
 * Convert canvas ImageData to 1-bit monochrome raster data.
 * Black pixels (dark) become 1, white pixels become 0.
 */
export function canvasToRaster(
  imageData: ImageData,
  widthPx: number,
  heightPx: number
): { data: Uint8Array; widthBytes: number; heightLines: number } {
  const widthBytes = Math.ceil(widthPx / 8);
  const raster = new Uint8Array(widthBytes * heightPx);

  for (let y = 0; y < heightPx; y++) {
    for (let x = 0; x < widthPx; x++) {
      const idx = (y * widthPx + x) * 4;
      const r = imageData.data[idx];
      const g = imageData.data[idx + 1];
      const b = imageData.data[idx + 2];
      // Convert to grayscale and threshold
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      if (gray < 128) {
        // Dark pixel = print (1)
        const byteIdx = y * widthBytes + Math.floor(x / 8);
        const bitIdx = 7 - (x % 8);
        raster[byteIdx] |= 1 << bitIdx;
      }
    }
  }

  return { data: raster, widthBytes, heightLines: heightPx };
}

/**
 * Print raster data to D30 printer via BLE
 */
export async function printD30(
  transport: BLETransport,
  rasterData: { data: Uint8Array; widthBytes: number; heightLines: number },
  options: {
    density?: number;
    onProgress?: (percent: number) => void;
  } = {}
): Promise<void> {
  const { density = 6, onProgress } = options;

  // Rotate for D-series (prints labels sideways)
  const rotated = rotateRaster90CW(
    rasterData.data,
    rasterData.widthBytes,
    rasterData.heightLines
  );

  // Set heat/density
  const heatTime = densityToHeatTime(density);
  await transport.send(heatSettingsCmd(7, heatTime, 2));
  await transport.delay(30);

  // Send D-series header (includes ESC @ init)
  await transport.send(D_CMD.HEADER(rotated.widthBytes, rotated.heightLines));

  // Send raster data in chunks
  await transport.sendChunked(rotated.data, onProgress);

  // D-series end command
  await transport.delay(100);
  await transport.send(D_CMD.END);
}
