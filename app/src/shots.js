// Fixed scenes for screenshots, driven by URL params.
//   ?shot=cover&photo=pier&caption=Sunset%20Heist&layout=hero-grid&grade=sunset&w=1280&h=720
//   ?shot=editor&photo=boulevard&caption=Boulevard%20Queen&layout=hero-grid&grade=sunset
// photo is a sample id (boulevard, pier, convertible, rooftop, neon, fishing).
// caption sets the title. layout and grade pick the look. w and h size the
// cover canvas for a cover shot. window.__shotReady is set once painted,
// after fonts settle, so a headless screenshot waits for the real look.
import { sampleUrl } from './samples.js';
import { layoutById } from './layouts.js';
import { gradeById } from './grades.js';

export async function runShot(shot, query, apply) {
  if (shot === 'cover') document.body.classList.add('shot-cover');
  const photo = query.get('photo') || 'pier';
  const caption = query.get('caption') || 'Sunset Heist';
  const layout = layoutById(query.get('layout') || 'hero-grid').id;
  const grade = gradeById(query.get('grade') || 'sunset').id;
  const w = Number(query.get('w') || 0);
  const h = Number(query.get('h') || 0);
  await apply({ photo, photoUrl: sampleUrl(photo), caption, layout, grade, w, h, shot });
  try { await document.fonts.ready; } catch (e) { /* fonts are optional for the shot */ }
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
