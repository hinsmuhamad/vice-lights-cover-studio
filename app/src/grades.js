// Ten colour grades. Each grade is a real treatment: a filter pass for
// saturation, contrast and brightness, plus a duotone gradient wash drawn
// over the photo in soft light, plus a warm or cool edge tint.
export const GRADES = [
  { id: 'sunset', name: 'Vice Sunset', sat: 1.35, con: 1.12, bri: 1.04, top: '#ffb347', mid: '#ff5e8a', bot: '#7b2f8a', wash: 'overlay', washAlpha: 0.28 },
  { id: 'neon', name: 'Neon Night', sat: 1.5, con: 1.18, bri: 0.98, top: '#ff2e88', mid: '#7b2ff7', bot: '#0b1035', wash: 'overlay', washAlpha: 0.34 },
  { id: 'golden', name: 'Golden Hour', sat: 1.3, con: 1.08, bri: 1.08, top: '#ffd166', mid: '#ff9a3d', bot: '#8a4b1f', wash: 'soft-light', washAlpha: 0.35 },
  { id: 'twilight', name: 'Twilight Purple', sat: 1.25, con: 1.1, bri: 0.96, top: '#c084fc', mid: '#7c3aed', bot: '#1e1b4b', wash: 'overlay', washAlpha: 0.3 },
  { id: 'teal', name: 'Teal Coast', sat: 1.3, con: 1.1, bri: 1.02, top: '#5eead4', mid: '#0d9488', bot: '#083344', wash: 'soft-light', washAlpha: 0.32 },
  { id: 'pink', name: 'Hot Pink', sat: 1.55, con: 1.14, bri: 1.0, top: '#ff7ab8', mid: '#ff2e88', bot: '#4c0519', wash: 'overlay', washAlpha: 0.32 },
  { id: 'retro', name: 'Retro Fade', sat: 0.85, con: 0.95, bri: 1.08, top: '#fde68a', mid: '#f59e0b', bot: '#78350f', wash: 'soft-light', washAlpha: 0.3 },
  { id: 'mono', name: 'Mono Noir', sat: 0, con: 1.25, bri: 1.02, top: '#e5e7eb', mid: '#9ca3af', bot: '#111827', wash: 'overlay', washAlpha: 0.22 },
  { id: 'steel', name: 'Cold Steel', sat: 0.9, con: 1.15, bri: 1.0, top: '#bfdbfe', mid: '#3b82f6', bot: '#0f172a', wash: 'soft-light', washAlpha: 0.3 },
  { id: 'palm', name: 'Palm Print', sat: 1.45, con: 1.05, bri: 1.05, top: '#a3e635', mid: '#16a34a', bot: '#14532d', wash: 'overlay', washAlpha: 0.26 },
];

export function gradeById(id) {
  return GRADES.find((g) => g.id === id) || GRADES[0];
}

// Draw a photo into a temp canvas with the grade filter and wash applied,
// then return that canvas so the caller can clip and place it.
export function gradedPhoto(img, w, h, grade) {
  const t = document.createElement('canvas');
  t.width = Math.max(2, Math.round(w));
  t.height = Math.max(2, Math.round(h));
  const c = t.getContext('2d');
  c.filter = `saturate(${grade.sat}) contrast(${grade.con}) brightness(${grade.bri})`;
  c.drawImage(img, 0, 0, t.width, t.height);
  c.filter = 'none';
  const wash = c.createLinearGradient(0, 0, 0, t.height);
  wash.addColorStop(0, grade.top);
  wash.addColorStop(0.55, grade.mid);
  wash.addColorStop(1, grade.bot);
  c.globalCompositeOperation = grade.wash;
  c.globalAlpha = grade.washAlpha;
  c.fillStyle = wash;
  c.fillRect(0, 0, t.width, t.height);
  c.globalAlpha = 1;
  c.globalCompositeOperation = 'source-over';
  return t;
}

// A plain sunset sky used when a panel has no photo yet. The sun disc
// sits off centre so an empty panel still reads as a poster, not a blank.
export function paintSky(ctx, x, y, w, h, grade) {
  const g = ctx.createLinearGradient(x, y, x, y + h);
  g.addColorStop(0, grade.top);
  g.addColorStop(0.55, grade.mid);
  g.addColorStop(1, grade.bot);
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.beginPath();
  ctx.arc(x + w * 0.72, y + h * 0.3, Math.min(w, h) * 0.14, 0, Math.PI * 2);
  ctx.fill();
}
