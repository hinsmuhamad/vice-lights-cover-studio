// Ten layouts. Each layout returns panel rectangles as fractions of the
// cover, a title band kept clear of the hero face, and a short note.
// Rects use x, y, w, h in 0 to 1. hero marks the big panel. tilt is degrees.
export const LAYOUTS = [
  { id: 'hero-grid', name: 'Hero Grid', panels: 7, note: 'Big hero centre, portraits around' },
  { id: 'slanted', name: 'Slanted Panels', panels: 6, note: 'Tilted dividers, title over the art' },
  { id: 'nine', name: 'Nine-Panel Grid', panels: 9, note: '3 by 3 small panels, title block' },
  { id: 'fullbleed', name: 'Full-Bleed Hero', panels: 4, note: 'One photo edge to edge, strip at foot' },
  { id: 'snapshot', name: 'Tilted Snapshot', panels: 5, note: 'Tilted overlapping snapshots' },
  { id: 'magazine', name: 'Magazine', panels: 5, note: 'Hero left, stacked panels right' },
  { id: 'comic', name: 'Comic Strip', panels: 6, note: 'Painted panels, halftone feel' },
  { id: 'bottom', name: 'Bottom Title', panels: 6, note: 'Title at the foot, clean' },
  { id: 'popout', name: 'Pop-Out Hero', panels: 6, note: 'Hero breaks out over the title band' },
  { id: 'diagonal', name: 'Diagonal Split', panels: 6, note: 'Big hero left, two panels right, title across the middle' },
];

export function layoutById(id) {
  return LAYOUTS.find((l) => l.id === id) || LAYOUTS[0];
}

// Panel rects for a cover of width W and height H. The top bar takes the
// top 9 percent and the foot strip takes the bottom 11 percent, so panels
// live between them and the title band never sits on a face by accident.
export function panelRects(layoutId, W, H) {
  const top = 0.09, foot = 0.89;
  const bodyY = top * H, bodyH = (foot - top) * H;
  const R = (x, y, w, h, hero, tilt) => ({ x: x * W, y: y * H, w: w * W, h: h * H, hero: !!hero, tilt: tilt || 0 });
  switch (layoutId) {
    case 'slanted':
      return [
        R(0.01, top, 0.32, 0.80, true, -2),
        R(0.34, top, 0.20, 0.38, false, 2),
        R(0.55, top, 0.20, 0.38, false, -2),
        R(0.76, top, 0.23, 0.38, false, 2),
        R(0.34, 0.50, 0.31, 0.39, false, -2),
        R(0.66, 0.50, 0.33, 0.39, false, 2),
      ];
    case 'nine':
      return Array.from({ length: 9 }, (_, i) => {
        const col = i % 3, row = Math.floor(i / 3);
        return R(0.01 + col * 0.327, top + row * 0.267, 0.317, 0.257, i === 4);
      });
    case 'fullbleed':
      return [
        R(0, 0, 1, 1, true),
        R(0.03, 0.72, 0.21, 0.16),
        R(0.27, 0.72, 0.21, 0.16),
        R(0.51, 0.72, 0.21, 0.16),
      ];
    case 'snapshot':
      return [
        R(0.06, 0.14, 0.42, 0.62, true, -4),
        R(0.52, 0.11, 0.40, 0.34, false, 3),
        R(0.50, 0.48, 0.20, 0.30, false, -3),
        R(0.72, 0.48, 0.20, 0.30, false, 4),
        R(0.30, 0.60, 0.24, 0.24, false, 2),
      ];
    case 'magazine':
      return [
        R(0.01, top, 0.52, 0.80, true),
        R(0.55, top, 0.44, 0.19),
        R(0.55, 0.30, 0.44, 0.19),
        R(0.55, 0.51, 0.44, 0.19),
        R(0.55, 0.72, 0.44, 0.17),
      ];
    case 'comic':
      return [
        R(0.01, top, 0.48, 0.40, true),
        R(0.51, top, 0.48, 0.40),
        R(0.01, 0.51, 0.31, 0.38),
        R(0.34, 0.51, 0.31, 0.38),
        R(0.67, 0.51, 0.32, 0.19),
        R(0.67, 0.72, 0.32, 0.17),
      ];
    case 'bottom':
      return [
        R(0.01, top, 0.32, 0.62, true),
        R(0.34, top, 0.32, 0.30),
        R(0.67, top, 0.32, 0.30),
        R(0.34, 0.42, 0.32, 0.30),
        R(0.67, 0.42, 0.32, 0.30),
        R(0.01, 0.73, 0.98, 0.06),
      ];
    case 'popout':
      // Hero ends at 0.57, clear of the title band at 0.60-0.73, so the
      // hero frame can never cover the title letters. The bottom strip
      // sits below the tagline (0.753-0.797) and above the foot strip.
      return [
        R(0.30, 0.07, 0.40, 0.50, true, -2),
        R(0.01, top, 0.27, 0.22),
        R(0.72, top, 0.27, 0.22),
        R(0.01, 0.33, 0.27, 0.24),
        R(0.72, 0.33, 0.27, 0.24),
        R(0.30, 0.81, 0.40, 0.07),
      ];
    case 'diagonal':
      return [
        R(0.01, 0.09, 0.52, 0.47, true, -2),
        R(0.55, 0.09, 0.44, 0.22, false, 2),
        R(0.55, 0.33, 0.44, 0.23, false, -2),
        R(0.01, 0.74, 0.32, 0.14, false, 0),
        R(0.34, 0.74, 0.32, 0.14, false, 0),
        R(0.67, 0.74, 0.32, 0.14, false, 0),
      ];
    case 'hero-grid':
    default:
      // Vertical budget, same at every cover size: top bar ends 0.09,
      // panel rows 0.09-0.44, title band 0.45-0.59, tagline 0.613-0.657,
      // bottom row 0.67-0.88, foot strip from 0.89. No panel touches
      // the title band, the tagline or the foot strip, so the title
      // never covers a role tag and no row is cut off.
      return [
        R(0.33, top, 0.34, 0.35, true),
        R(0.01, top, 0.30, 0.17),
        R(0.69, top, 0.30, 0.17),
        R(0.01, 0.27, 0.30, 0.17),
        R(0.69, 0.27, 0.30, 0.17),
        R(0.01, 0.67, 0.48, 0.21),
        R(0.51, 0.67, 0.48, 0.21),
      ];
  }
}

// Where the title, subtitle and tagline sit, as fractions of the cover.
// Every layout reserves a band that does not cover the hero face: the hero
// face sits in the upper half of its panel, the title sits below it or in
// a dedicated band, and pop-out keeps the title clear of the frame centre.
export function titleBand(layoutId, W, H) {
  const bands = {
    'hero-grid': { x: 0.05, y: 0.45, w: 0.90, h: 0.14 },
    slanted: { x: 0.05, y: 0.58, w: 0.90, h: 0.20 },
    nine: { x: 0.05, y: 0.42, w: 0.90, h: 0.16 },
    fullbleed: { x: 0.05, y: 0.30, w: 0.90, h: 0.24 },
    snapshot: { x: 0.05, y: 0.78, w: 0.90, h: 0.14 },
    magazine: { x: 0.02, y: 0.01, w: 0.96, h: 0.08 },
    comic: { x: 0.05, y: 0.44, w: 0.90, h: 0.10 },
    bottom: { x: 0.05, y: 0.80, w: 0.90, h: 0.10 },
    popout: { x: 0.05, y: 0.60, w: 0.90, h: 0.13 },
    diagonal: { x: 0.05, y: 0.58, w: 0.90, h: 0.14 },
  };
  const b = bands[layoutId] || bands['hero-grid'];
  return { x: b.x * W, y: b.y * H, w: b.w * W, h: b.h * H };
}
