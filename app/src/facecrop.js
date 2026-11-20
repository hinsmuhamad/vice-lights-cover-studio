// Face-aware crop: a skin-tone blob search on a small canvas copy.
// No model, no network, no face landmark library. Skin pixels are warm
// and redder than green and blue; the biggest warm cluster is treated as
// the face region and the crop is centred on it. Manual drag and zoom
// always override the automatic centre.
export function findFace(img) {
  const S = 72;
  const c = document.createElement('canvas');
  c.width = S;
  c.height = Math.max(2, Math.round(S * img.naturalHeight / img.naturalWidth));
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, c.width, c.height);
  let data;
  try { data = ctx.getImageData(0, 0, c.width, c.height).data; }
  catch (e) { return { x: 0.5, y: 0.35 }; }
  let sx = 0, sy = 0, n = 0, top = 1, bottom = 0;
  for (let y = 0; y < c.height; y++) {
    for (let x = 0; x < c.width; x++) {
      const i = (y * c.width + x) * 4;
      const r = data[i], g = data[i + 1], b = data[i + 2];
      const skin = r > 95 && r > g + 12 && r > b + 18 && g > b - 10 && r - g < 90;
      if (!skin) continue;
      sx += x; sy += y; n++;
      if (y / c.height < top) top = y / c.height;
      if (y / c.height > bottom) bottom = y / c.height;
    }
  }
  if (n < 40) return { x: 0.5, y: 0.35 };
  const cx = sx / n / c.width;
  const cy = sy / n / c.height;
  // Faces sit above the skin centroid (neck and hands pull it down), so
  // lift the centre a little and keep it inside a safe band. The band
  // stops the crop from ever parking on the very top or bottom edge.
  return { x: Math.min(0.85, Math.max(0.15, cx)), y: Math.min(0.7, Math.max(0.12, cy - 0.08)) };
}

// Cover-fit source rect for a panel. face is {x, y} in 0 to 1 photo space.
// zoom scales the crop in, dx and dy shift it in panel fractions.
export function coverSource(img, rectW, rectH, zoom, dx, dy, face) {
  const iw = img.naturalWidth, ih = img.naturalHeight;
  const base = Math.max(rectW / iw, rectH / ih);
  const z = Math.max(1, zoom || 1) * base;
  const sw = rectW / z, sh = rectH / z;
  const fx = (face ? face.x : 0.5) * iw;
  const fy = (face ? face.y : 0.35) * ih;
  let sx = fx - sw / 2 + (dx || 0) * sw * 0.5;
  let sy = fy - sh / 2 + (dy || 0) * sh * 0.5;
  sx = Math.min(Math.max(sx, 0), Math.max(0, iw - sw));
  sy = Math.min(Math.max(sy, 0), Math.max(0, ih - sh));
  return { sx, sy, sw, sh };
}
