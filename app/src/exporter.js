// Export: renders the cover off screen at each post size and downloads
// a PNG. Three sizes: square 1080 by 1080, portrait 1080 by 1350 and
// wide 1920 by 1080. No server, the PNG is made in the browser.
import { drawCover } from './renderer.js';

export const EXPORT_SIZES = [
  { id: 'square', name: '1080 x 1080', w: 1080, h: 1080 },
  { id: 'portrait', name: '1080 x 1350', w: 1080, h: 1350 },
  { id: 'wide', name: '1920 x 1080', w: 1920, h: 1080 },
];

export function renderAtSize(state, images, size) {
  const canvas = document.createElement('canvas');
  canvas.width = size.w;
  canvas.height = size.h;
  drawCover(canvas, state, images);
  return canvas;
}

function download(canvas, filename) {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) { resolve(false); return; }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      resolve(true);
    }, 'image/png');
  });
}

export async function exportOne(state, images, sizeId) {
  const size = EXPORT_SIZES.find((s) => s.id === sizeId) || EXPORT_SIZES[0];
  const canvas = renderAtSize(state, images, size);
  const ok = await download(canvas, `vice-lights-${size.w}x${size.h}.png`);
  return ok ? `Saved vice-lights-${size.w}x${size.h}.png` : 'Export failed in this browser';
}

export async function exportAll(state, images) {
  const names = [];
  for (const size of EXPORT_SIZES) {
    const canvas = renderAtSize(state, images, size);
    const ok = await download(canvas, `vice-lights-${size.w}x${size.h}.png`);
    if (ok) names.push(`${size.w}x${size.h}`);
    // A short pause between downloads so the browser keeps each one.
    await new Promise((r) => setTimeout(r, 250));
  }
  return names.length === 3
    ? `Saved all 3 sizes: ${names.join(', ')}`
    : `Saved ${names.join(', ') || 'none'}, one export failed`;
}
