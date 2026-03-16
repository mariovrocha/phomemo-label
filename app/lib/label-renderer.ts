/**
 * Label renderer for 40x12mm labels at 203 DPI
 * Renders a QR code + two text lines onto an offscreen canvas
 */

import QRCode from "qrcode";

// 40x12mm at 203 DPI (8 dots/mm)
const LABEL_WIDTH_MM = 40;
const LABEL_HEIGHT_MM = 12;
const DPI = 203;
const DOTS_PER_MM = DPI / 25.4; // ~8 dots/mm

export const LABEL_WIDTH_PX = Math.round(LABEL_WIDTH_MM * DOTS_PER_MM); // ~320
export const LABEL_HEIGHT_PX = Math.round(LABEL_HEIGHT_MM * DOTS_PER_MM); // ~96

/**
 * Render a label with QR code and two text lines to a canvas.
 * Returns the canvas for preview and the ImageData for printing.
 */
export async function renderLabel(
  text1: string,
  text2: string
): Promise<{ canvas: HTMLCanvasElement; imageData: ImageData }> {
  const canvas = document.createElement("canvas");
  canvas.width = LABEL_WIDTH_PX;
  canvas.height = LABEL_HEIGHT_PX;

  const ctx = canvas.getContext("2d")!;

  // White background
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, LABEL_WIDTH_PX, LABEL_HEIGHT_PX);

  // Padding
  const padding = 4;
  const qrSize = LABEL_HEIGHT_PX - padding * 2; // Square QR, fits height

  // Draw QR code on the left (QR encodes text1)
  if (text1) {
    const qrCanvas = document.createElement("canvas");
    await QRCode.toCanvas(qrCanvas, text1, {
      width: qrSize,
      margin: 0,
      errorCorrectionLevel: "M",
      color: { dark: "#000000", light: "#ffffff" },
    });
    ctx.drawImage(qrCanvas, padding, padding, qrSize, qrSize);
  }

  // Text area to the right of QR code
  const textX = padding + qrSize + 8;
  const textAreaWidth = LABEL_WIDTH_PX - textX - padding;
  const textAreaHeight = LABEL_HEIGHT_PX - padding * 2;
  const textCenterY = padding + textAreaHeight / 2;

  ctx.fillStyle = "black";

  // Auto-size fonts to fit
  const line1FontSize = fitFontSize(ctx, text1, textAreaWidth, textAreaHeight * 0.38, "bold");
  const line2FontSize = fitFontSize(ctx, text2, textAreaWidth, textAreaHeight * 0.20, "normal");

  // Measure actual text heights
  ctx.font = `bold ${line1FontSize}px Arial, sans-serif`;
  const m1 = ctx.measureText(text1);
  const h1 = text1 ? m1.actualBoundingBoxAscent + m1.actualBoundingBoxDescent : 0;

  ctx.font = `${line2FontSize}px Arial, sans-serif`;
  const m2 = ctx.measureText(text2);
  const h2 = text2 ? m2.actualBoundingBoxAscent + m2.actualBoundingBoxDescent : 0;

  const gap = text1 && text2 ? 3 : 0;
  const totalHeight = h1 + gap + h2;

  // Center the text block vertically, and each line horizontally
  const blockTop = textCenterY - totalHeight / 2;

  // Draw text1 (top, bold, centered)
  if (text1) {
    ctx.font = `bold ${line1FontSize}px Arial, sans-serif`;
    ctx.textBaseline = "top";
    const w1 = ctx.measureText(text1).width;
    const x1 = textX + (textAreaWidth - Math.min(w1, textAreaWidth)) / 2;
    ctx.fillText(text1, x1, blockTop, textAreaWidth);
  }

  // Draw text2 (below text1, normal, centered)
  if (text2) {
    ctx.font = `${line2FontSize}px Arial, sans-serif`;
    ctx.textBaseline = "top";
    const w2 = ctx.measureText(text2).width;
    const x2 = textX + (textAreaWidth - Math.min(w2, textAreaWidth)) / 2;
    ctx.fillText(text2, x2, blockTop + h1 + gap, textAreaWidth);
  }

  const imageData = ctx.getImageData(0, 0, LABEL_WIDTH_PX, LABEL_HEIGHT_PX);

  return { canvas, imageData };
}

/**
 * Find the largest font size that fits the text within maxWidth x maxHeight.
 */
function fitFontSize(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxHeight: number,
  weight: string
): number {
  let fontSize = Math.floor(maxHeight);

  for (; fontSize > 6; fontSize--) {
    ctx.font = `${weight} ${fontSize}px Arial, sans-serif`;
    const metrics = ctx.measureText(text);
    const textHeight =
      metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
    if (metrics.width <= maxWidth && textHeight <= maxHeight) {
      return fontSize;
    }
  }

  return 6;
}
