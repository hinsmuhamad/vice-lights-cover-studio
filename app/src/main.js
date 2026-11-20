// Wires the Vice Lights Cover Studio page: controls, live preview, photo
// loading, face-aware crop, shuffle, undo and redo, and PNG export.
// A ?shot= query sets up a fixed scene for a screenshot instead.
import { drawCover } from './renderer.js';
import { LAYOUTS, layoutById } from './layouts.js';
import { GRADES, gradeById } from './grades.js';
import { SAMPLES, sampleUrl, CAPTIONS, SUBTITLES, TAGLINES, ROLES } from './samples.js';
import { findFace } from './facecrop.js';
import { defaultState, resizePanels, makeHistory, pushHistory, undo, redo } from './editor.js';
import { exportOne, exportAll } from './exporter.js';
import { runShot } from './shots.js';

const $ = (id) => document.getElementById(id);
const canvas = $('cover');
let state = defaultState();
let images = new Map();
let history = makeHistory();
let selectedPanel = 0;
let dragging = null;

export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function redraw() {
  drawCover(canvas, state, images);
}

function setStatus(text) {
  $('status').textContent = text;
}

function commit() {
  pushHistory(history, state);
  redraw();
}

function syncControls() {
  $('title').value = state.title;
  $('subtitle').value = state.subtitle;
  $('tagline').value = state.tagline.join(', ');
  $('quote').value = state.quote;
  $('quoteSource').value = state.quoteSource;
  $('vol').value = state.vol;
  $('seal').value = state.seal;
  $('billing').value = state.billing;
  $('userName').value = state.userName;
  $('layout').value = state.layout;
  $('grade').value = state.grade;
  $('grain').checked = state.grain;
  $('vignette').checked = state.vignette;
  $('halftone').checked = state.halftone;
  $('showCallouts').checked = state.showCallouts;
  $('calloutPlace').value = state.calloutPlace;
  $('calloutTime').value = state.calloutTime;
  $('heat').value = state.heat;
  $('wanted').value = state.wanted;
  syncPanelControls();
  document.querySelectorAll('#layoutChips button').forEach((b) => b.classList.toggle('on', b.dataset.id === state.layout));
  document.querySelectorAll('#gradeChips button').forEach((b) => b.classList.toggle('on', b.dataset.id === state.grade));
  document.querySelectorAll('#samples button').forEach((b) => b.classList.toggle('on', state.panels[selectedPanel] && state.panels[selectedPanel].photoId === b.dataset.id));
}

function syncPanelControls() {
  const pick = $('panelPick');
  pick.innerHTML = '';
  state.panels.forEach((p, i) => {
    const opt = document.createElement('option');
    opt.value = String(i);
    opt.textContent = `Panel ${i + 1} ${p.role || ''}`.trim();
    pick.appendChild(opt);
  });
  pick.value = String(Math.min(selectedPanel, state.panels.length - 1));
  const p = state.panels[selectedPanel] || state.panels[0];
  if (!p) return;
  $('role').value = p.role;
  $('place').value = p.place;
  $('time').value = p.time;
  $('note').value = p.note;
  $('zoom').value = String(p.zoom);
}

function fillChips() {
  const lc = $('layoutChips');
  LAYOUTS.forEach((l) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.id = l.id;
    b.textContent = l.name;
    b.title = l.note;
    b.addEventListener('click', () => setLayout(l.id));
    lc.appendChild(b);
  });
  const gc = $('gradeChips');
  GRADES.forEach((g) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.id = g.id;
    b.textContent = g.name;
    b.addEventListener('click', () => setGrade(g.id));
    gc.appendChild(b);
  });
  const sc = $('samples');
  SAMPLES.forEach((s) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.id = s.id;
    b.title = s.label;
    const img = document.createElement('img');
    img.src = sampleUrl(s.id);
    img.alt = s.label;
    b.appendChild(img);
    b.addEventListener('click', () => loadSampleIntoPanel(s.id, selectedPanel));
    sc.appendChild(b);
  });
  const layoutSel = $('layout');
  LAYOUTS.forEach((l) => {
    const o = document.createElement('option');
    o.value = l.id; o.textContent = `${l.name} (${l.panels} panels)`;
    layoutSel.appendChild(o);
  });
  const gradeSel = $('grade');
  GRADES.forEach((g) => {
    const o = document.createElement('option');
    o.value = g.id; o.textContent = g.name;
    gradeSel.appendChild(o);
  });
}

function setLayout(id) {
  if (state.layout === id) return;
  pushHistory(history, state);
  state.layout = layoutById(id).id;
  resizePanels(state);
  selectedPanel = 0;
  syncControls();
  redraw();
}

function setGrade(id) {
  if (state.grade === id) return;
  pushHistory(history, state);
  state.grade = gradeById(id).id;
  syncControls();
  redraw();
}

async function loadSampleIntoPanel(sampleId, panelIndex) {
  try {
    const img = await loadImage(sampleUrl(sampleId));
    images.set(panelIndex, img);
    state.panels[panelIndex].photoId = sampleId;
    state.panels[panelIndex].face = findFace(img);
    pushHistory(history, state);
    syncControls();
    redraw();
    setStatus(`Loaded ${sampleId} into panel ${panelIndex + 1}, face centred.`);
  } catch (e) {
    setStatus('That sample photo could not be loaded.');
  }
}

async function loadFileIntoPanel(file, panelIndex) {
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    images.set(panelIndex, img);
    state.panels[panelIndex].photoId = 'upload';
    state.panels[panelIndex].face = findFace(img);
    redraw();
    setStatus(`Loaded your photo into panel ${panelIndex + 1}, face centred.`);
  } catch (e) {
    setStatus('That photo could not be read.');
  }
}

function bindControls() {
  const text = (id, key, parse) => {
    $(id).addEventListener('input', (e) => {
      state[key] = parse ? parse(e.target.value) : e.target.value;
      redraw();
    });
    $(id).addEventListener('change', () => commit());
  };
  text('title', 'title');
  text('subtitle', 'subtitle');
  text('quote', 'quote');
  text('quoteSource', 'quoteSource');
  text('vol', 'vol');
  text('seal', 'seal');
  text('billing', 'billing');
  text('userName', 'userName');
  text('calloutPlace', 'calloutPlace');
  text('calloutTime', 'calloutTime');
  text('wanted', 'wanted');
  text('heat', 'heat', (v) => Math.max(1, Math.min(5, Number(v) || 4)));
  $('tagline').addEventListener('input', (e) => {
    state.tagline = e.target.value.split(',').map((s) => s.trim()).filter(Boolean).slice(0, 3);
    redraw();
  });
  $('tagline').addEventListener('change', () => commit());
  $('layout').addEventListener('change', (e) => setLayout(e.target.value));
  $('grade').addEventListener('change', (e) => setGrade(e.target.value));
  const toggle = (id, key) => {
    $(id).addEventListener('change', (e) => {
      pushHistory(history, state);
      state[key] = e.target.checked;
      redraw();
    });
  };
  toggle('grain', 'grain');
  toggle('vignette', 'vignette');
  toggle('halftone', 'halftone');
  toggle('showCallouts', 'showCallouts');
  $('panelPick').addEventListener('change', (e) => {
    selectedPanel = Number(e.target.value);
    syncControls();
    redraw();
  });
  const panelText = (id, key) => {
    $(id).addEventListener('input', (e) => {
      const p = state.panels[selectedPanel];
      if (p) { p[key] = e.target.value; redraw(); }
    });
    $(id).addEventListener('change', () => commit());
  };
  panelText('role', 'role');
  panelText('place', 'place');
  panelText('time', 'time');
  panelText('note', 'note');
  $('zoom').addEventListener('input', (e) => {
    const p = state.panels[selectedPanel];
    if (p) { p.zoom = Number(e.target.value); redraw(); }
  });
  $('zoom').addEventListener('change', () => commit());
  $('faceCrop').addEventListener('click', () => {
    const p = state.panels[selectedPanel];
    const img = images.get(selectedPanel);
    if (p && img) {
      pushHistory(history, state);
      p.face = findFace(img);
      p.dx = 0; p.dy = 0;
      redraw();
      setStatus('Face centred for this panel.');
    } else setStatus('Load a photo into this panel first.');
  });
  $('resetCrop').addEventListener('click', () => {
    const p = state.panels[selectedPanel];
    if (p) {
      pushHistory(history, state);
      p.zoom = 1.15; p.dx = 0; p.dy = 0;
      syncControls(); redraw();
    }
  });
  $('uploadOne').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    pushHistory(history, state);
    const img = await loadImage(URL.createObjectURL(file));
    const face = findFace(img);
    state.panels.forEach((p, i) => {
      images.set(i, img);
      p.photoId = 'upload';
      p.face = face;
    });
    redraw();
    setStatus('One photo fills all panels.');
  });
  $('uploadMany').addEventListener('change', async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    pushHistory(history, state);
    for (let i = 0; i < files.length && i < state.panels.length; i++) {
      const img = await loadImage(URL.createObjectURL(files[i]));
      images.set(i, img);
      state.panels[i].photoId = 'upload';
      state.panels[i].face = findFace(img);
    }
    redraw();
    setStatus(`${Math.min(files.length, state.panels.length)} photos placed, one per panel.`);
  });
  $('fillAll').addEventListener('click', async () => {
    const first = [...images.values()][0];
    if (!first) { setStatus('Load or pick a photo first.'); return; }
    pushHistory(history, state);
    state.panels.forEach((p, i) => { images.set(i, first); p.face = p.face || findFace(first); });
    redraw();
    setStatus('One photo fills all panels.');
  });
  $('fillEach').addEventListener('click', async () => {
    pushHistory(history, state);
    for (let i = 0; i < state.panels.length; i++) {
      const s = SAMPLES[i % SAMPLES.length];
      try {
        const img = await loadImage(sampleUrl(s.id));
        images.set(i, img);
        state.panels[i].photoId = s.id;
        state.panels[i].face = findFace(img);
      } catch (e) { /* keep the panel empty if a sample is missing */ }
    }
    redraw();
    setStatus('Sample photos placed, one per panel.');
  });
  $('shuffle').addEventListener('click', async () => {
    pushHistory(history, state);
    const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
    state.layout = pick(LAYOUTS).id;
    resizePanels(state);
    state.grade = pick(GRADES).id;
    state.title = pick(CAPTIONS);
    state.subtitle = pick(SUBTITLES);
    state.tagline = pick(TAGLINES).slice();
    state.panels.forEach((p, i) => {
      const r = ROLES[(i + Math.floor(Math.random() * ROLES.length)) % ROLES.length];
      p.role = r.role; p.place = r.place; p.time = r.time; p.note = r.note;
    });
    for (let i = 0; i < state.panels.length; i++) {
      const s = pick(SAMPLES);
      try {
        const img = await loadImage(sampleUrl(s.id));
        images.set(i, img);
        state.panels[i].photoId = s.id;
        state.panels[i].face = findFace(img);
      } catch (e) { /* keep panel empty */ }
    }
    selectedPanel = 0;
    syncControls();
    redraw();
    setStatus(`Shuffled: ${layoutById(state.layout).name}, ${gradeById(state.grade).name}, ${state.title}.`);
  });
  $('undo').addEventListener('click', () => {
    const prev = undo(history, state);
    if (prev) { state = prev; syncControls(); redraw(); setStatus('Undone.'); }
    else setStatus('Nothing to undo.');
  });
  $('redo').addEventListener('click', () => {
    const next = redo(history, state);
    if (next) { state = next; syncControls(); redraw(); setStatus('Redone.'); }
    else setStatus('Nothing to redo.');
  });
  $('exportSquare').addEventListener('click', async () => setStatus(await exportOne(state, images, 'square')));
  $('exportPortrait').addEventListener('click', async () => setStatus(await exportOne(state, images, 'portrait')));
  $('exportWide').addEventListener('click', async () => setStatus(await exportOne(state, images, 'wide')));
  $('exportAll').addEventListener('click', async () => setStatus(await exportAll(state, images)));
  // Drag to move the selected panel photo, wheel to zoom it.
  canvas.addEventListener('pointerdown', (e) => {
    dragging = { x: e.clientX, y: e.clientY };
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const p = state.panels[selectedPanel];
    if (!p) return;
    const rect = canvas.getBoundingClientRect();
    p.dx = (p.dx || 0) + (e.clientX - dragging.x) / rect.width * 2;
    p.dy = (p.dy || 0) + (e.clientY - dragging.y) / rect.height * 2;
    dragging = { x: e.clientX, y: e.clientY };
    redraw();
  });
  canvas.addEventListener('pointerup', () => {
    if (dragging) { dragging = null; commit(); }
  });
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const p = state.panels[selectedPanel];
    if (!p) return;
    p.zoom = Math.max(1, Math.min(2.5, (p.zoom || 1.15) + (e.deltaY < 0 ? 0.1 : -0.1)));
    $('zoom').value = String(p.zoom);
    redraw();
  }, { passive: false });
}

fillChips();
bindControls();
syncControls();

const shot = new URLSearchParams(location.search).get('shot');
if (shot) {
  runShot(shot, new URLSearchParams(location.search), async (scene) => {
    if (scene.w && scene.h && shot === 'cover') {
      canvas.width = scene.w;
      canvas.height = scene.h;
    }
    state.title = scene.caption;
    state.layout = scene.layout;
    state.grade = scene.grade;
    resizePanels(state);
    const img = await loadImage(scene.photoUrl);
    const face = findFace(img);
    state.panels.forEach((p, i) => {
      images.set(i, img);
      p.photoId = scene.photo;
      p.face = face;
    });
    if (shot === 'cover') document.body.classList.add('shot-cover');
    syncControls();
    redraw();
  });
} else {
  // First view: fill every panel with a different sample so the poster
  // is complete on load, with each crop centred on its face.
  (async () => {
    for (let i = 0; i < state.panels.length; i++) {
      const s = SAMPLES[i % SAMPLES.length];
      try {
        const img = await loadImage(sampleUrl(s.id));
        images.set(i, img);
        state.panels[i].photoId = s.id;
        state.panels[i].face = findFace(img);
      } catch (e) { /* keep the panel empty if a sample is missing */ }
    }
    syncControls();
    redraw();
  })();
  redraw();
}
