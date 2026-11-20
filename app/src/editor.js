// Editor state: the single source of truth for the cover, plus undo and
// redo. Images live outside the state (in a Map by panel index) so undo
// snapshots stay small JSON and never carry photo pixels.
import { layoutById } from './layouts.js';
import { ROLES } from './samples.js';

export function defaultPanels(count) {
  return Array.from({ length: count }, (_, i) => {
    const role = ROLES[i % ROLES.length];
    return {
      role: role.role, place: role.place, time: role.time, note: role.note,
      zoom: 1.15, dx: 0, dy: 0, face: null, photoId: null,
    };
  });
}

export function defaultState() {
  return {
    title: 'VICE LIGHTS',
    subtitle: 'Paid in Sunsets',
    tagline: ['Seven lives', 'one harbor', 'no way back'],
    quote: 'THE HOTTEST RIDE OF THE YEAR',
    quoteSource: 'Golden Mile Gazette',
    vol: 'VOL. 01',
    seal: 'BEST CAST',
    billing: 'A VICE LIGHTS PICTURE  SHOT ON YOUR OWN PHONE  STARRING YOU AND YOUR CREW',
    userName: 'Starring You',
    layout: 'hero-grid',
    grade: 'sunset',
    grain: true,
    vignette: true,
    halftone: false,
    showCallouts: true,
    calloutPlace: 'CORAL CAUSEWAY',
    calloutTime: '7:15 PM',
    heat: 4,
    wanted: 'WANTED',
    panels: defaultPanels(7),
  };
}

// Keep the panel list in step when the layout changes: keep existing
// panels, add fresh role tags for new ones, drop extras.
export function resizePanels(state) {
  const count = layoutById(state.layout).panels;
  while (state.panels.length < count) {
    const i = state.panels.length;
    const role = ROLES[i % ROLES.length];
    state.panels.push({
      role: role.role, place: role.place, time: role.time, note: role.note,
      zoom: 1.15, dx: 0, dy: 0, face: null, photoId: null,
    });
  }
  state.panels.length = count;
  return state;
}

export function snapshot(state) {
  return JSON.stringify(state);
}

export function restore(text) {
  return JSON.parse(text);
}

// A small undo stack: push before each change, pop on undo, keep the
// redo stack beside it. Capped at 40 entries so long sessions stay light.
export function makeHistory() {
  return { past: [], future: [] };
}

export function pushHistory(history, state) {
  history.past.push(snapshot(state));
  if (history.past.length > 40) history.past.shift();
  history.future.length = 0;
}

export function undo(history, state) {
  if (!history.past.length) return null;
  history.future.push(snapshot(state));
  return restore(history.past.pop());
}

export function redo(history, state) {
  if (!history.future.length) return null;
  history.past.push(snapshot(state));
  return restore(history.future.pop());
}
