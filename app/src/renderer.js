// Renderer: draws the whole poster cover onto any canvas at any size.
// Inputs are a plain state object and a map of panel index to loaded image
// (or null). Nothing here touches the network or the page.
import { gradeById, gradedPhoto, paintSky } from './grades.js';
import { panelRects, titleBand } from './layouts.js';
import { coverSource } from './facecrop.js';

function roundRect(ctx, x, y, w, h, r) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

function fitFont(ctx, text, maxW, start, family, weight) {
  let size = start;
  ctx.font = `${weight} ${size}px ${family}`;
  while (size > 10 && ctx.measureText(text).width > maxW) {
    size -= 2;
    ctx.font = `${weight} ${size}px ${family}`;
  }
  return size;
}

function drawPanel(ctx, img, rect, panel, grade, W, H) {
  ctx.save();
  ctx.translate(rect.x + rect.w / 2, rect.y + rect.h / 2);
  ctx.rotate((rect.tilt || 0) * Math.PI / 180);
  ctx.translate(-rect.w / 2, -rect.h / 2);
  const pad = panel.hero ? 5 : 3;
  roundRect(ctx, 0, 0, rect.w, rect.h, 10);
  ctx.clip();
  if (img) {
    const src = coverSource(img, rect.w, rect.h, panel.zoom, panel.dx, panel.dy, panel.face);
    const gw = Math.max(2, Math.round(rect.w));
    const gh = Math.max(2, Math.round(rect.h));
    const full = gradedPhoto(img, gw, gh, grade);
    // The graded copy is full frame, so map the cover-fit source rect
    // onto it before drawing it into the panel.
    const fx = src.sx / img.naturalWidth * gw;
    const fy = src.sy / img.naturalHeight * gh;
    const fw = src.sw / img.naturalWidth * gw;
    const fh = src.sh / img.naturalHeight * gh;
    ctx.drawImage(full, fx, fy, fw, fh, 0, 0, rect.w, rect.h);
  } else {
    paintSky(ctx, 0, 0, rect.w, rect.h, grade);
  }
  // Warm sunset wash across the foot of every panel.
  const wash = ctx.createLinearGradient(0, rect.h * 0.55, 0, rect.h);
  wash.addColorStop(0, 'rgba(255,120,60,0)');
  wash.addColorStop(1, 'rgba(120,20,80,0.35)');
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, rect.w, rect.h);
  ctx.restore();
  // White frame and shadow around the panel, drawn after the clip.
  ctx.save();
  ctx.translate(rect.x + rect.w / 2, rect.y + rect.h / 2);
  ctx.rotate((rect.tilt || 0) * Math.PI / 180);
  ctx.translate(-rect.w / 2, -rect.h / 2);
  ctx.shadowColor = 'rgba(0,0,0,0.45)';
  ctx.shadowBlur = panel.hero ? 18 : 8;
  ctx.shadowOffsetY = panel.hero ? 6 : 3;
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = panel.hero ? 5 : 3;
  roundRect(ctx, 0, 0, rect.w, rect.h, 10);
  ctx.stroke();
  ctx.restore();
  drawRoleTag(ctx, rect, panel, W, H);
}

function drawRoleTag(ctx, rect, panel, W, H) {
  if (!panel.role) return;
  const scale = Math.min(rect.w, rect.h);
  const tagH = Math.max(26, scale * 0.22);
  const tx = rect.x + 8;
  const ty = rect.y + rect.h - tagH - 8;
  // Text must stay inside the tag box, and the box inside the panel:
  // shrink each line, then ellipsis-clip the subline, never overflow.
  const maxTextW = Math.max(20, rect.w - 16 - 18);
  const role = panel.role.toUpperCase();
  let sub = [panel.place, panel.time, panel.note].filter(Boolean).join('  |  ');
  let roleSize = Math.max(11, tagH * 0.42);
  ctx.font = `700 ${roleSize}px system-ui, sans-serif`;
  while (roleSize > 9 && ctx.measureText(role).width > maxTextW) {
    roleSize -= 1;
    ctx.font = `700 ${roleSize}px system-ui, sans-serif`;
  }
  let subSize = Math.max(9, tagH * 0.28);
  ctx.font = `600 ${subSize}px system-ui, sans-serif`;
  while (subSize > 8 && sub && ctx.measureText(sub).width > maxTextW) {
    subSize -= 1;
    ctx.font = `600 ${subSize}px system-ui, sans-serif`;
  }
  if (sub && ctx.measureText(sub).width > maxTextW) {
    while (sub.length > 1 && ctx.measureText(sub + '…').width > maxTextW) sub = sub.slice(0, -1);
    sub += '…';
  }
  ctx.font = `700 ${roleSize}px system-ui, sans-serif`;
  const w1 = ctx.measureText(role).width;
  ctx.font = `600 ${subSize}px system-ui, sans-serif`;
  const w2 = sub ? ctx.measureText(sub).width : 0;
  const tw = Math.min(rect.w - 16, Math.max(w1, w2) + 18);
  ctx.save();
  ctx.fillStyle = 'rgba(10,8,18,0.88)';
  roundRect(ctx, tx, ty, tw, tagH, 5);
  ctx.fill();
  ctx.fillStyle = '#ffd166';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.font = `700 ${roleSize}px system-ui, sans-serif`;
  ctx.fillText(role, tx + 9, ty + tagH * (sub ? 0.32 : 0.52));
  if (sub) {
    ctx.fillStyle = '#fff';
    ctx.font = `600 ${subSize}px system-ui, sans-serif`;
    ctx.fillText(sub, tx + 9, ty + tagH * 0.74);
  }
  ctx.restore();
}

function drawChromeTitle(ctx, text, band, W, H) {
  const label = (text || 'VICE LIGHTS').toUpperCase();
  const size = fitFont(ctx, label, band.w, band.h * 0.72, "'Anton', sans-serif", '400');
  // Draw the letters on an offscreen layer first. The old code used
  // source-atop on the main canvas, but the sky already covers the whole
  // canvas, so the stripes painted across the entire band instead of
  // cutting through the letters. On a blank layer source-atop only
  // touches the letters themselves.
  const pad = Math.ceil(size * 0.35);
  const off = document.createElement('canvas');
  off.width = Math.max(2, Math.ceil(band.w + pad * 2));
  off.height = Math.max(2, Math.ceil(band.h + pad * 2));
  const o = off.getContext('2d');
  const cx = off.width / 2;
  const cy = pad + band.h * 0.42;
  o.textAlign = 'center';
  o.textBaseline = 'middle';
  o.font = `400 ${size}px 'Anton', sans-serif`;
  o.shadowColor = 'rgba(255,94,138,0.75)';
  o.shadowBlur = size * 0.28;
  o.shadowOffsetY = size * 0.05;
  const grad = o.createLinearGradient(0, cy - size * 0.5, 0, cy + size * 0.5);
  grad.addColorStop(0, '#fff7d6');
  grad.addColorStop(0.35, '#ffd166');
  grad.addColorStop(0.6, '#ff7a3d');
  grad.addColorStop(0.8, '#ff5e8a');
  grad.addColorStop(1, '#c026d3');
  o.fillStyle = grad;
  o.fillText(label, cx, cy);
  // Horizontal bands cut through the letters: thin dark stripes clipped
  // to the text itself, which makes the striped chrome look.
  o.globalCompositeOperation = 'source-atop';
  o.shadowBlur = 0;
  o.shadowOffsetY = 0;
  o.fillStyle = 'rgba(40,10,40,0.55)';
  const stripeH = Math.max(2, size * 0.045);
  for (let y = cy - size * 0.5; y < cy + size * 0.5; y += stripeH * 4) {
    o.fillRect(0, y, off.width, stripeH);
  }
  o.fillStyle = 'rgba(255,255,255,0.28)';
  for (let y = cy - size * 0.5 + stripeH * 2; y < cy + size * 0.5; y += stripeH * 4) {
    o.fillRect(0, y, off.width, stripeH * 0.6);
  }
  o.globalCompositeOperation = 'source-over';
  ctx.save();
  ctx.drawImage(off, band.x - pad, band.y - pad);
  ctx.restore();
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `400 ${size}px 'Anton', sans-serif`;
  ctx.lineWidth = Math.max(2, size * 0.045);
  ctx.strokeStyle = '#1a0b2e';
  ctx.lineJoin = 'round';
  ctx.strokeText(label, band.x + band.w / 2, band.y + band.h * 0.42);
  ctx.restore();
}

function drawSeal(ctx, text, x, y, r) {
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  const points = 16;
  for (let i = 0; i <= points * 2; i++) {
    const ang = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
    const rad = i % 2 === 0 ? r : r * 0.78;
    const px = Math.cos(ang) * rad, py = Math.sin(ang) * rad;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath();
  const g = ctx.createRadialGradient(0, 0, r * 0.1, 0, 0, r);
  g.addColorStop(0, '#fff3b0');
  g.addColorStop(0.6, '#f5b301');
  g.addColorStop(1, '#b45309');
  ctx.fillStyle = g;
  ctx.shadowColor = 'rgba(0,0,0,0.4)';
  ctx.shadowBlur = 8;
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = '#7c2d12';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#3f1d04';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const words = (text || 'BEST CAST').toUpperCase().split(' ');
  const fs = fitFont(ctx, words.join(' '), r * 1.25, r * 0.34, "'Anton', sans-serif", '400');
  ctx.font = `400 ${fs}px 'Anton', sans-serif`;
  if (words.length > 1) {
    ctx.fillText(words.slice(0, Math.ceil(words.length / 2)).join(' '), 0, -fs * 0.55);
    ctx.fillText(words.slice(Math.ceil(words.length / 2)).join(' '), 0, fs * 0.55);
  } else {
    ctx.fillText(words[0], 0, 0);
  }
  ctx.restore();
}

function drawBarcode(ctx, x, y, w, h, seedText) {
  ctx.save();
  ctx.fillStyle = '#fff';
  ctx.fillRect(x - 4, y - 4, w + 8, h + 8);
  ctx.fillStyle = '#111';
  let seed = 7;
  for (const ch of (seedText || 'VICE')) seed = (seed * 31 + ch.charCodeAt(0)) % 997;
  let px = x;
  while (px < x + w) {
    seed = (seed * 73 + 41) % 997;
    const bw = 1 + (seed % 4);
    if (seed % 3 !== 0) ctx.fillRect(px, y, bw, h);
    px += bw + 1 + (seed % 3);
  }
  ctx.restore();
}

function drawGrain(ctx, W, H) {
  ctx.save();
  ctx.globalAlpha = 0.07;
  for (let i = 0; i < 900; i++) {
    const x = Math.random() * W, y = Math.random() * H;
    ctx.fillStyle = Math.random() > 0.5 ? '#fff' : '#000';
    ctx.fillRect(x, y, 1.5, 1.5);
  }
  ctx.restore();
}

function drawHalftone(ctx, W, H) {
  ctx.save();
  ctx.globalAlpha = 0.10;
  ctx.fillStyle = '#000';
  const step = Math.max(14, W / 90);
  for (let y = step / 2; y < H; y += step) {
    for (let x = step / 2; x < W; x += step) {
      ctx.beginPath();
      ctx.arc(x, y, step * 0.12, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

// Main entry: draw the full cover. state holds every editable word, the
// layout id, the grade id, toggles and one panel object per layout panel.
// images is a Map or plain object from panel index to an Image or null.
export function drawCover(canvas, state, images) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const grade = gradeById(state.grade);
  const layoutId = state.layout || 'hero-grid';
  ctx.clearRect(0, 0, W, H);
  paintSky(ctx, 0, 0, W, H, grade);
  const rects = panelRects(layoutId, W, H);
  const panels = state.panels || [];
  const isPopout = layoutId === 'popout';
  rects.forEach((rect, i) => {
    if (isPopout && rect.hero) return;
    const panel = panels[i] || { role: '', place: '', time: '', note: '', zoom: 1.15, dx: 0, dy: 0, face: null };
    const img = images ? (images.get ? images.get(i) : images[i]) : null;
    drawPanel(ctx, img, rect, panel, grade, W, H);
  });
  // Top bar: five stars, press quote and source, VOL badge. Every item
  // is placed from measured text widths, so nothing overlaps at any
  // cover width: stars left, quote centred in the space between the
  // stars and the source, source and VOL badge pinned to the right.
  ctx.save();
  ctx.fillStyle = 'rgba(10,8,18,0.72)';
  ctx.fillRect(0, 0, W, H * 0.085);
  ctx.textBaseline = 'middle';
  const margin = W * 0.02;
  ctx.fillStyle = '#ffd166';
  ctx.font = `${Math.round(H * 0.032)}px system-ui, sans-serif`;
  ctx.textAlign = 'left';
  const starsW = ctx.measureText('★★★★★').width;
  ctx.fillText('★★★★★', margin, H * 0.045);
  const vol = (state.vol || 'VOL. 01').toUpperCase();
  const volSize = Math.round(H * 0.024);
  ctx.font = `700 ${volSize}px system-ui, sans-serif`;
  const volW = ctx.measureText(vol).width + 18;
  const volX = W - margin - volW;
  ctx.strokeStyle = '#ffd166';
  ctx.lineWidth = 2;
  ctx.strokeRect(volX, H * 0.018, volW, H * 0.05);
  ctx.fillStyle = '#ffd166';
  ctx.fillText(vol, volX + 9, H * 0.045);
  const srcText = (state.quoteSource || '').toUpperCase();
  let srcMaxW = W * 0.22;
  let srcSize = fitFont(ctx, srcText, srcMaxW, Math.round(H * 0.02), 'system-ui, sans-serif', '600');
  ctx.font = `600 ${srcSize}px system-ui, sans-serif`;
  let srcW = ctx.measureText(srcText).width;
  let qX0 = margin + starsW + 12;
  let qX1 = volX - 12 - srcW - 12;
  if (qX1 - qX0 < W * 0.18) {
    srcMaxW = W * 0.12;
    srcSize = fitFont(ctx, srcText, srcMaxW, Math.round(H * 0.02), 'system-ui, sans-serif', '600');
    ctx.font = `600 ${srcSize}px system-ui, sans-serif`;
    srcW = ctx.measureText(srcText).width;
    qX1 = volX - 12 - srcW - 12;
  }
  ctx.fillStyle = '#ffb3c8';
  ctx.textAlign = 'right';
  ctx.fillText(srcText, volX - 12, H * 0.042);
  const qSize = fitFont(ctx, `"${state.quote || ''}"`, Math.max(40, qX1 - qX0), H * 0.032, 'system-ui, sans-serif', '700');
  ctx.fillStyle = '#fff';
  ctx.font = `700 ${qSize}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText(`"${(state.quote || '').toUpperCase()}"`, (qX0 + qX1) / 2, H * 0.042);
  ctx.restore();
  // Title, script subtitle and tagline strip.
  const band = titleBand(layoutId, W, H);
  const isMagazine = layoutId === 'magazine';
  if (!isMagazine) {
    // A dark ribbon behind the title keeps it readable over busy photos.
    ctx.save();
    ctx.fillStyle = 'rgba(10,8,18,0.35)';
    roundRect(ctx, band.x - 10, band.y - 6, band.w + 20, band.h + 12, 8);
    ctx.fill();
    ctx.restore();
  }
  drawChromeTitle(ctx, state.title, band, W, H);
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const subY = band.y + band.h * 0.82;
  const subSize = fitFont(ctx, state.subtitle || '', band.w * 0.8, H * 0.055, "'Pacifico', cursive", '400');
  ctx.font = `400 ${subSize}px 'Pacifico', cursive`;
  ctx.fillStyle = '#ff8fb0';
  ctx.shadowColor = 'rgba(255,46,136,0.9)';
  ctx.shadowBlur = 14;
  ctx.fillText(state.subtitle || '', band.x + band.w / 2, subY);
  ctx.restore();
  const phrases = (state.tagline || []).filter(Boolean);
  if (phrases.length) {
    ctx.save();
    const tagText = phrases.map((p) => p.toUpperCase()).join('   •   ');
    // Keep the strip above the foot strip, and end it before the seal
    // (centre 0.90W, radius 0.075 of the short side), which used to sit
    // on top of the strip and cover the last words.
    let tagY = band.y + band.h + H * 0.045;
    if (tagY + H * 0.022 > H * 0.885) tagY = H * 0.885 - H * 0.022;
    const sealLeft = W * 0.90 - Math.min(W, H) * 0.075;
    const stripMaxRight = sealLeft - 12;
    const maxTextW = Math.min(W * 0.86, stripMaxRight - margin - 36);
    const tSize = fitFont(ctx, tagText, Math.max(40, maxTextW), H * 0.03, 'system-ui, sans-serif', '800');
    ctx.font = `800 ${tSize}px system-ui, sans-serif`;
    const tw = ctx.measureText(tagText).width + 36;
    let tagCX = W / 2;
    if (tagCX + tw / 2 > stripMaxRight) tagCX = stripMaxRight - tw / 2;
    if (tagCX - tw / 2 < margin) tagCX = margin + tw / 2;
    ctx.fillStyle = 'rgba(255,94,138,0.92)';
    roundRect(ctx, tagCX - tw / 2, tagY - H * 0.022, tw, H * 0.044, H * 0.022);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(tagText, tagCX, tagY);
    ctx.restore();
  }
  // Pop-out hero last, so its shaped frame overlaps the title band.
  if (isPopout) {
    const heroRect = rects.find((r) => r.hero);
    const heroIndex = rects.indexOf(heroRect);
    const panel = panels[heroIndex] || { role: '', place: '', time: '', note: '', zoom: 1.15, dx: 0, dy: 0, face: null };
    const img = images ? (images.get ? images.get(heroIndex) : images[heroIndex]) : null;
    drawPanel(ctx, img, heroRect, panel, grade, W, H);
  }
  // Callouts: location and time tag, HEAT star meter, WANTED tag.
  if (state.showCallouts) {
    ctx.save();
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    const call = `${(state.calloutPlace || '').toUpperCase()}  ${state.calloutTime || ''}`;
    ctx.font = `800 ${Math.round(H * 0.026)}px system-ui, sans-serif`;
    const cw = ctx.measureText(call).width + 24;
    ctx.fillStyle = '#0f766e';
    roundRect(ctx, W * 0.02, H * 0.11, cw, H * 0.045, 5);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.fillText(call, W * 0.02 + 12, H * 0.133);
    // HEAT star meter: a dark pill pinned to the right edge, fully
    // inside the cover and inside the top-right panel, with its width
    // measured from the text so no star is ever clipped off the edge.
    const heat = Math.max(1, Math.min(5, state.heat || 4));
    const heatText = 'HEAT ' + '★'.repeat(heat) + '☆'.repeat(5 - heat);
    const heatSize = fitFont(ctx, heatText, W * 0.30, Math.round(H * 0.026), 'system-ui, sans-serif', '700');
    ctx.font = `700 ${heatSize}px system-ui, sans-serif`;
    const hw = ctx.measureText(heatText).width + 24;
    const hx = W - W * 0.02 - hw;
    const hy = H * 0.11;
    ctx.fillStyle = 'rgba(10,8,18,0.85)';
    roundRect(ctx, hx, hy, hw, H * 0.045, 5);
    ctx.fill();
    ctx.fillStyle = '#ffd166';
    ctx.fillText(heatText, hx + 12, hy + H * 0.0225);
    ctx.fillStyle = '#dc2626';
    ctx.font = `800 ${Math.round(H * 0.024)}px system-ui, sans-serif`;
    const wText = '★ ' + (state.wanted || 'WANTED').toUpperCase() + ' ★';
    const ww = ctx.measureText(wText).width + 20;
    roundRect(ctx, W * 0.02, H * 0.17, ww, H * 0.04, 5);
    ctx.fillStyle = '#dc2626';
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.fillText(wText, W * 0.02 + 10, H * 0.19);
    ctx.restore();
  }
  // Gold starburst seal, bottom right.
  drawSeal(ctx, state.seal, W * 0.90, H * 0.80, Math.min(W, H) * 0.075);
  // Foot strip: COMING SOON, billing block naming the user, barcode.
  ctx.save();
  ctx.fillStyle = 'rgba(10,8,18,0.78)';
  ctx.fillRect(0, H * 0.89, W, H * 0.11);
  ctx.fillStyle = '#ffd166';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  const csSize = Math.round(H * 0.032);
  ctx.font = `800 ${csSize}px system-ui, sans-serif`;
  const csW = ctx.measureText('COMING SOON').width;
  ctx.fillText('COMING SOON', W * 0.02, H * 0.945);
  // Billing starts after COMING SOON with a real gap, never on top of
  // it, and the user name is appended only if the credits do not
  // already name them, so no phrase appears twice.
  let billing = (state.billing || '').trim();
  const user = (state.userName || '').trim();
  if (user && !billing.toUpperCase().includes(user.toUpperCase())) billing = `${billing}  ${user}`.trim();
  billing = billing.toUpperCase();
  ctx.fillStyle = '#e5e7eb';
  const bx = W * 0.02 + csW + W * 0.02;
  const bMaxW = W * 0.84 - bx;
  const bSize = fitFont(ctx, billing, Math.max(40, bMaxW), H * 0.018, 'system-ui, sans-serif', '600');
  ctx.font = `600 ${bSize}px system-ui, sans-serif`;
  if (ctx.measureText(billing).width > bMaxW) {
    while (billing.length > 1 && ctx.measureText(billing + '…').width > bMaxW) billing = billing.slice(0, -1);
    billing += '…';
  }
  ctx.fillText(billing, bx, H * 0.945);
  drawBarcode(ctx, W * 0.86, H * 0.915, W * 0.11, H * 0.055, state.title);
  ctx.restore();
  if (state.halftone) drawHalftone(ctx, W, H);
  if (state.grain) drawGrain(ctx, W, H);
  if (state.vignette) {
    const v = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.45, W / 2, H / 2, Math.max(W, H) * 0.75);
    v.addColorStop(0, 'rgba(0,0,0,0)');
    v.addColorStop(1, 'rgba(0,0,0,0.38)');
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, W, H);
  }
}
