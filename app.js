(() => {
'use strict';

/* ───────────────────────── constants ───────────────────────── */
const LINE_HEIGHT = 1.2;
const STRETCH_Y = 1.8;           // the tall-mono look: glyphs drawn 1.8x taller
const FONT = '"Barlow", "Helvetica Neue", Arial, sans-serif';
const WEIGHT = 400;
const PLACEHOLDER = 'type here...';
const SCAN_MODES = ['W_E', 'E_W', 'N_S', 'S_N', 'NW_SE', 'SE_NW', 'NE_SW', 'SW_NE'];
const MODE_GLYPH = { W_E: '→', E_W: '←', N_S: '↓', S_N: '↑', NW_SE: '↘', SE_NW: '↖', NE_SW: '↙', SW_NE: '↗' };
let LAYOUT = { del: { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity } };
let POS = {};

// Scale set and names from TidalCycles (Sound.Tidal.Scales), same as Music of Life
const SCALES = {
  minPent: [0,3,5,7,10], majPent: [0,2,4,7,9], ritusen: [0,2,5,7,9], egyptian: [0,2,5,7,10],
  kumai: [0,2,3,7,9], hirajoshi: [0,2,3,7,8], iwato: [0,1,5,6,10], chinese: [0,4,6,7,11],
  indian: [0,4,5,7,10], pelog: [0,1,3,7,8], prometheus: [0,2,4,6,11], scriabin: [0,1,4,7,9],
  gong: [0,2,4,7,9], shang: [0,2,5,7,10], jiao: [0,3,5,8,10], zhi: [0,2,5,7,9], yu: [0,3,5,7,10],
  whole: [0,2,4,6,8,10], augmented: [0,3,4,7,8,11], augmented2: [0,1,4,5,8,9],
  hexMajor7: [0,2,4,7,9,11], hexDorian: [0,2,3,5,7,10], hexPhrygian: [0,1,3,5,8,10],
  hexSus: [0,2,5,7,9,10], hexMajor6: [0,2,4,5,7,9], hexAeolian: [0,3,5,7,8,10],
  major: [0,2,4,5,7,9,11], ionian: [0,2,4,5,7,9,11], dorian: [0,2,3,5,7,9,10], phrygian: [0,1,3,5,7,8,10],
  lydian: [0,2,4,6,7,9,11], mixolydian: [0,2,4,5,7,9,10], aeolian: [0,2,3,5,7,8,10], minor: [0,2,3,5,7,8,10],
  locrian: [0,1,3,5,6,8,10], harmonicMinor: [0,2,3,5,7,8,11], harmonicMajor: [0,2,4,5,7,8,11],
  melodicMinor: [0,2,3,5,7,9,11], melodicMinorDesc: [0,2,3,5,7,8,10], melodicMajor: [0,2,4,5,7,8,10],
  bartok: [0,2,4,5,7,8,10], hindu: [0,2,4,5,7,8,10], todi: [0,1,3,6,7,8,11], purvi: [0,1,4,6,7,8,11],
  marva: [0,1,4,6,7,9,11], bhairav: [0,1,4,5,7,8,11], ahirbhairav: [0,1,4,5,7,9,10],
  superLocrian: [0,1,3,4,6,8,10], romanianMinor: [0,2,3,6,7,9,10], hungarianMinor: [0,2,3,6,7,8,11],
  neapolitanMinor: [0,1,3,5,7,8,11], enigmatic: [0,1,4,6,8,10,11], spanish: [0,1,4,5,7,8,10],
  leadingWhole: [0,2,4,6,8,10,11], lydianMinor: [0,2,4,6,7,8,10], neapolitanMajor: [0,1,3,5,7,9,11],
  locrianMajor: [0,2,4,5,6,8,10],
  diminished: [0,1,3,4,6,7,9,10], diminished2: [0,2,3,5,6,8,9,11],
  chromatic: [0,1,2,3,4,5,6,7,8,9,10,11],
};
const BANDS = 48;        // grid rows: finer than the pitch set, so letter shapes are sampled in more detail
const LOW_MIDI = 36;     // C2
const HIGH_MIDI = 96;    // C7
// Every note of the scale between C2 and C7, low to high. Rows are spread evenly over these notes
// (bottom row = C2, top row = C7), so a finer grid adds detail without pushing pitches out of range.
function scaleNotes(name) {
  const iv = SCALES[name], out = [];
  for (let midi = LOW_MIDI; midi <= HIGH_MIDI; midi++) {
    if (iv.includes((midi - LOW_MIDI) % 12)) out.push(440 * Math.pow(2, (midi - 69) / 12));
  }
  return out;
}
function rowNotes(count) {   // row index from the bottom -> note index
  return Array.from({ length: BANDS }, (_, r) => Math.round(r * (count - 1) / (BANDS - 1)));
}
let NOTES = scaleNotes('minPent');
let ROWNOTE = rowNotes(NOTES.length);
const SCALE_SHORT = {
  minPent: 'Min Pent', majPent: 'Maj Pent', ritusen: 'Ritu Sen', egyptian: 'Egyp Tian', kumai: 'Ku Mai',
  hirajoshi: 'Hira Josh', iwato: 'Iwa To', chinese: 'Chin Ese', indian: 'Ind Ian', pelog: 'Pe Log',
  prometheus: 'Pro Meth', scriabin: 'Scri Abin', gong: 'Gong', shang: 'Sha Ng', jiao: 'Jiao', zhi: 'Zhi', yu: 'Yu',
  whole: 'Who Le', augmented: 'Aug', augmented2: 'Aug 2', hexMajor7: 'Hex Maj7', hexDorian: 'Hex Dor',
  hexPhrygian: 'Hex Phr', hexSus: 'Hex Sus', hexMajor6: 'Hex Maj6', hexAeolian: 'Hex Aeo',
  major: 'Maj', ionian: 'Ion Ian', dorian: 'Dor Ian', phrygian: 'Phry Gian', lydian: 'Lyd Ian',
  mixolydian: 'Mixo Lyd', aeolian: 'Aeo Lian', minor: 'Min', locrian: 'Loc Rian',
  harmonicMinor: 'Harm Min', harmonicMajor: 'Harm Maj', melodicMinor: 'Mel Min', melodicMinorDesc: 'Melm Desc',
  melodicMajor: 'Mel Maj', bartok: 'Bar Tok', hindu: 'Hin Du', todi: 'Todi', purvi: 'Pur Vi', marva: 'Mar Va',
  bhairav: 'Bhai Rav', ahirbhairav: 'Ahir Bhai', superLocrian: 'Sup Loc', romanianMinor: 'Rom Min',
  hungarianMinor: 'Hun Min', neapolitanMinor: 'Nea Min', enigmatic: 'Enig Ma', spanish: 'Span Ish',
  leadingWhole: 'Lead Whl', lydianMinor: 'Lyd Min', neapolitanMajor: 'Nea Maj', locrianMajor: 'Loc Maj',
  diminished: 'Dim', diminished2: 'Dim 2', chromatic: 'Chro Ma',
};
const scaleWords = name => name.replace(/([a-z])([A-Z0-9])/g, '$1 $2').replace(/([0-9])/g, ' $1').replace(/\s+/g, ' ').trim();

/* ───────────────────────── audio engine ───────────────────────── */
// Voices: each band (row) gets its own always-running oscillators, an envelope gain and (optionally) a filter.
// A voice describes the oscillators and how its envelope behaves; lengths decide how long a note is held.
const VOICES = {
  pluck: { label: 'Pluck', wet: 0.4, A: 0.004, D: 0.25, S: 0.0,  R: 0.25, peak: 0.26,
           oscs: [{ type: 'square', ratio: 1, gain: 1, detune: 3 }], filter: { base: 1.0, amt: 3000, decay: 0.18, Q: 1 } },
  keys:  { label: 'Keys',  wet: 0.35, A: 0.006, D: 0.6, S: 0.35, R: 0.35, peak: 0.32,
           oscs: [{ type: 'triangle', ratio: 1, gain: 1 }, { type: 'sine', ratio: 2, gain: 0.25 }, { type: 'sine', ratio: 4, gain: 0.06 }],
           filter: { base: 2.5, amt: 2200, decay: 0.35, Q: 0.5 } },
  pad:   { label: 'Pad',   wet: 0.65, A: 0.18, D: 0.8, S: 0.8, R: 1.1, peak: 0.26,
           oscs: [{ type: 'sawtooth', ratio: 1, gain: 1, detune: -7 }, { type: 'sawtooth', ratio: 1, gain: 1, detune: 7 }, { type: 'sine', ratio: 0.5, gain: 0.5 }],
           filter: { base: 3, amt: 500, decay: 1.2, Q: 0.4, max: 2400 } },
  bell:  { label: 'Bell',  wet: 0.5, A: 0.002, D: 1.4, S: 0.0, R: 1.2, peak: 0.17, fm: { ratio: 3.5, index: 2.2, decay: 0.5 },
           oscs: [{ type: 'sine', ratio: 1, gain: 1 }] },
  organ: { label: 'Organ', wet: 0.3, A: 0.012, D: 0.1, S: 1.0, R: 0.07, peak: 0.13,
           oscs: [{ type: 'sine', ratio: 1, gain: 1 }, { type: 'sine', ratio: 2, gain: 0.5 }, { type: 'sine', ratio: 3, gain: 0.3 }, { type: 'sine', ratio: 4, gain: 0.18 }] },
  wood:  { label: 'Wood',  wet: 0.3, A: 0.002, D: 0.35, S: 0.0, R: 0.3, peak: 0.34,
           oscs: [{ type: 'sine', ratio: 1, gain: 1 }, { type: 'sine', ratio: 3.98, gain: 0.12 }],
           filter: { base: 4, amt: 2500, decay: 0.05, Q: 0.7 } },
};
// note length comes from a 0..1 slider: short gate -> long gate; at the top (>= 0.8) notes tie across steps (legato)
const lengthParams = v => ({ gate: 0.3 + v * 2.2, tie: v >= 0.8, rel: 0.6 + v * 1.6 });
const LENGTH_NAME = v => v < 0.25 ? 'Short' : v < 0.55 ? 'Medium' : v < 0.8 ? 'Long' : 'Legato';
// how a column of active cells becomes notes
const MODES = {
  chord:  { label: 'Chord' },    // every active note at once
  arp:    { label: 'Arpeggio' }, // each letter stroke (run of adjacent notes) once, low to high, spread across the step
  melody: { label: 'Melody' },   // only the highest note: the top outline of the text becomes a melody line
};
const VOICE_ORDER = Object.keys(VOICES), MODE_ORDER = Object.keys(MODES);
const VOICE_SHORT = { keys: 'Keys', pad: 'Pad', bell: 'Bell', organ: 'Or Gan', wood: 'Wood', pluck: 'Plu Ck' };

const audio = {
  ctx: null, master: null, comp: null, wet: null, dry: null, pans: [], held: [], live: new Set(), running: false,
  voice: 'keys', len: 0.85, mode: 'chord', lastMelody: -1, arpUp: false,
  init() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      const ctx = this.ctx = new AC();
      const master = this.master = ctx.createGain();
      master.gain.value = 0.42;

      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -14; comp.ratio.value = 4; comp.attack.value = 0.01; comp.release.value = 0.25; comp.knee.value = 12;

      const verb = ctx.createConvolver();
      verb.buffer = this.impulse(2.8);
      const dry = this.dry = ctx.createGain(); dry.gain.value = 0.8;
      const wet = this.wet = ctx.createGain(); wet.gain.value = VOICES[this.voice].wet;
      master.connect(dry); dry.connect(comp);
      master.connect(verb); verb.connect(wet); wet.connect(comp);
      comp.connect(ctx.destination);
      this.comp = comp;
      this.buildPans();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  },
  impulse(dur) {
    const rate = this.ctx.sampleRate, len = Math.floor(rate * dur);
    const buf = this.ctx.createBuffer(2, len, rate);
    for (let c = 0; c < 2; c++) {
      const d = buf.getChannelData(c);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2);
    }
    return buf;
  },
  // one stereo position per note of the scale (low notes left, high notes right)
  buildPans() {
    this.releaseAll(0.05);
    this.pans.forEach(p => setTimeout(() => { try { p.disconnect(); } catch (e) {} }, 600));
    this.pans = NOTES.map((f, i) => {
      const pan = this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : this.ctx.createGain();
      if (pan.pan) pan.pan.value = (i / Math.max(1, NOTES.length - 1)) * 1.6 - 0.8;
      pan.connect(this.master);
      return pan;
    });
    this.held = new Array(NOTES.length).fill(null); this.lastMelody = -1;
  },
  setVoice(name) {
    if (!VOICES[name]) return;
    this.voice = name;
    if (this.ctx) { this.releaseAll(0.05); this.wet.gain.setTargetAtTime(VOICES[name].wet, this.ctx.currentTime, 0.1); }
  },
  setLength(v) { const wasTie = lengthParams(this.len).tie; this.len = v; if (this.ctx && wasTie !== lengthParams(v).tie) this.releaseAll(0.15); },
  setMode(m) { if (MODES[m]) { this.mode = m; if (this.ctx) this.releaseAll(0.12); } },
  setScale() { if (this.ctx) this.buildPans(); },
  // metronome click: dry, bright and loud enough to cut through the notes (accent on the downbeat)
  tick(accent) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime + 0.005;
    const o = this.ctx.createOscillator(), g = this.ctx.createGain(), hp = this.ctx.createBiquadFilter();
    o.type = 'triangle'; o.frequency.setValueAtTime(accent ? 2400 : 1600, t);
    hp.type = 'highpass'; hp.frequency.value = 900;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(accent ? 0.9 : 0.6, t + 0.002);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.045);
    g.gain.linearRampToValueAtTime(0, t + 0.05);
    o.connect(hp); hp.connect(g); g.connect(this.ctx.destination);
    o.start(t); o.stop(t + 0.06);
  },
  // A note is its own little synth: fresh oscillators, filter and envelope that start from silence,
  // fade out and are thrown away. No envelope is ever cut short, so nothing can click.
  noteOn(j, t, vel, unit, P) {
    const ctx = this.ctx, v = VOICES[this.voice], f = NOTES[j];
    const peak = v.peak * vel;
    const A = Math.max(0.005, Math.min(v.A, unit * 0.6));
    const env = ctx.createGain();
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(peak, t + A);
    env.gain.setTargetAtTime(peak * v.S, t + A, v.D / 3);
    env.connect(this.pans[j]);
    let head = env;
    if (v.filter) {
      const fl = ctx.createBiquadFilter(), base = Math.min(f * v.filter.base, 18000);
      const top = Math.min(base + v.filter.amt * Math.min(vel, 1), v.filter.max || 18000);
      fl.type = 'lowpass'; fl.Q.value = v.filter.Q;
      fl.frequency.setValueAtTime(base, t);
      fl.frequency.linearRampToValueAtTime(top, t + Math.max(A, 0.008));
      fl.frequency.setTargetAtTime(base, t + Math.max(A, 0.008), v.filter.decay / 3);
      fl.connect(env); head = fl;
    }
    const mix = ctx.createGain(); mix.gain.value = 1 / v.oscs.reduce((a, o) => a + o.gain, 0); mix.connect(head);
    const oscs = v.oscs.map(o => {
      const osc = ctx.createOscillator(), g = ctx.createGain();
      osc.type = o.type; osc.frequency.value = f * o.ratio;
      osc.detune.value = (o.detune || 0) + (Math.random() * 4 - 2);
      g.gain.value = o.gain; osc.connect(g); g.connect(mix);
      return osc;
    });
    if (v.fm) {
      const mo = ctx.createOscillator(), mg = ctx.createGain(), idx = f * v.fm.ratio * v.fm.index * (0.6 + 0.4 * Math.min(vel, 1));
      mo.frequency.value = f * v.fm.ratio;
      mg.gain.setValueAtTime(0, t);
      mg.gain.linearRampToValueAtTime(idx, t + A);
      mg.gain.setTargetAtTime(idx * 0.08, t + A, v.fm.decay / 3);
      mo.connect(mg); oscs.forEach(o => mg.connect(o.frequency));
      oscs.push(mo);
    }
    const note = { env, oscs, start: t, A, ended: false };
    oscs.forEach(o => o.start(t));
    oscs[0].onended = () => { note.ended = true; this.live.delete(note); try { env.disconnect(); } catch (e) {} };
    this.live.add(note);
    if (!P.tie) this.release(note, t + Math.max(A, P.gate * unit), v.R * P.rel / 3);
    return note;
  },
  // fade a note out from wherever it is (setTarget picks up smoothly from the current value), then stop it
  release(note, t, tau) {
    if (!note || note.released) return;
    note.released = true;
    t = Math.max(t, note.start + note.A, this.ctx.currentTime);
    tau = Math.max(0.01, tau);
    note.env.gain.setTargetAtTime(0, t, tau);
    note.oscs.forEach(o => { try { o.stop(t + tau * 9); } catch (e) {} });
  },
  swell(note, level, t) { if (note && !note.released) note.env.gain.setTargetAtTime(level, Math.max(t, note.start + note.A), 0.08); },
  // rowDens[row]: row 0 = top of screen. Rows are folded onto notes (loudest row wins).
  update(rowDens, stepSec) {
    if (!this.ctx || !this.running) return;
    const now = this.ctx.currentTime + 0.01;          // a hair ahead, so every event lands cleanly on time
    const P = lengthParams(this.len), v = VOICES[this.voice];
    const relTau = v.R * P.rel / 3;
    const nd = new Array(NOTES.length).fill(0);
    for (let row = 0; row < BANDS; row++) {
      const d = rowDens[row] || 0, j = ROWNOTE[BANDS - 1 - row];
      if (d > nd[j]) nd[j] = d;
    }
    // fewer simultaneous notes in arp / melody, so each one is louder to keep the overall level even
    const boost = this.mode === 'melody' ? 2.4 : this.mode === 'arp' ? 1.6 : 1;
    const vel = j => (0.45 + 0.55 * Math.min(1, nd[j])) * boost;
    const active = nd.map((d, j) => d > 0.05 ? j : -1).filter(j => j >= 0);

    if (this.mode === 'chord') {
      for (let j = 0; j < NOTES.length; j++) {
        const on = nd[j] > 0.05;
        if (P.tie) {
          if (on && !this.held[j]) this.held[j] = this.noteOn(j, now, vel(j), stepSec, P);
          else if (on && v.S > 0) this.swell(this.held[j], v.peak * vel(j) * Math.max(v.S, 0.5), now);
          else if (!on && this.held[j]) { this.release(this.held[j], now, relTau); this.held[j] = null; }
        } else if (on) this.noteOn(j, now, vel(j), stepSec, P);
      }
      return;
    }

    if (this.mode === 'melody') {                       // a single line: the highest active note
      const top = active.length ? active[active.length - 1] : -1, last = this.lastMelody;
      if (P.tie) {
        if (top === last && top >= 0) { if (v.S > 0) this.swell(this.held[top], v.peak * vel(top) * Math.max(v.S, 0.5), now); }
        else {
          if (last >= 0 && this.held[last]) { this.release(this.held[last], now, relTau); this.held[last] = null; }
          if (top >= 0) this.held[top] = this.noteOn(top, now, vel(top), stepSec, P);
        }
      } else if (top >= 0) this.noteOn(top, now, vel(top), stepSec, P);
      this.lastMelody = top;
      return;
    }

    // arpeggio: every stroke (run of adjacent notes) gives its bottom, middle and top note;
    // those notes are spread across the step, going up on one step and down on the next
    let notes = [];
    for (let i = 0, lo = -1; i < active.length; i++) {
      if (lo < 0) lo = active[i];
      if (i === active.length - 1 || active[i + 1] !== active[i] + 1) {
        const hi = active[i], len = hi - lo + 1;
        if (len === 1) notes.push(lo);
        else if (len <= 3) notes.push(lo, hi);
        else notes.push(lo, Math.round((lo + hi) / 2), hi);
        lo = -1;
      }
    }
    const MAX = 6;
    if (notes.length > MAX) notes = Array.from({ length: MAX }, (_, i) => notes[Math.round(i * (notes.length - 1) / (MAX - 1))]);
    if (!notes.length) return;
    this.arpUp = !this.arpUp;
    if (!this.arpUp) notes.reverse();
    const slot = stepSec / notes.length;
    const AP = { gate: P.gate, tie: false, rel: P.rel };     // arp notes never tie; the slider sets how much they overlap
    notes.forEach((j, n) => this.noteOn(j, now + n * slot, vel(j), slot, AP));
  },
  releaseAll(tc) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    this.live.forEach(n => this.release(n, now, tc));
    this.held = new Array(NOTES.length).fill(null); this.lastMelody = -1;
  },
  play() { this.init(); this.running = true; },
  stop() { this.running = false; this.releaseAll(0.1); }
};

/* ───────────────────────── state ───────────────────────── */
const S = {
  blocks: [{ id: 'init', x: 10, y: 34, text: PLACEHOLDER, fontSize: 0.15 }],
  selected: new Set(),
  editingId: null,
  caret: 0,
  sel: { start: 0, end: 0 },
  marquee: null,                 // {x,y,w,h} in %
  hoverTrash: false,
  playing: false,
  metronome: false,     // metronome tile removed; kept off
  bpm: 240,
  loopStart: 0, loopEnd: 100,    // %
  mode: 'W_E',
  scale: 'minPent',
  voice: 'keys',
  len: 0.85,
  pmode: 'chord',     // chord / arp / melody (S.mode is the scan direction)
  beat: 0,
  progress: 0,
  drag: null,                    // {target, startX, startY, offsets, moved}
};
let uid = 0;
const newId = () => 'b' + Date.now().toString(36) + (uid++);

/* ───────────────────────── dom ───────────────────────── */
const $ = id => document.getElementById(id);
const stage = $('stage'), cv = $('cv'), ctx = cv.getContext('2d');
const off = document.createElement('canvas');
const offCtx = off.getContext('2d', { willReadFrequently: true });
const ta = $('ta');
let W = 1, H = 1, DPR = 1;

function resize() {
  const r = stage.getBoundingClientRect();
  DPR = window.devicePixelRatio || 1;
  W = Math.max(1, r.width); H = Math.max(1, r.height);
  cv.width = off.width = Math.round(W * DPR);
  cv.height = off.height = Math.round(H * DPR);
  snapLoops();
  layoutUI();
}
window.addEventListener('resize', resize);

/* ───────────────────────── grid geometry ───────────────────────── */
function grid() {
  const cellH = H / BANDS;
  const cols = Math.max(2, 2 * Math.round(W / cellH / 2));   // always even, so centred groups sit exactly on the grid
  return { cols, cellW: W / cols, cellH };
}
function stepsFor(mode) {
  const { cols } = grid();
  if (mode === 'N_S' || mode === 'S_N') return BANDS;
  if (mode === 'W_E' || mode === 'E_W') return cols;
  return cols + BANDS;
}
function scanLine(mode, p, w, h) {
  p = Number.isFinite(p) ? p : 0;
  switch (mode) {
    case 'W_E': return { x1: p * w, y1: 0, x2: p * w, y2: h };
    case 'E_W': return { x1: w - p * w, y1: 0, x2: w - p * w, y2: h };
    case 'N_S': return { x1: 0, y1: p * h, x2: w, y2: p * h };
    case 'S_N': return { x1: 0, y1: h - p * h, x2: w, y2: h - p * h };
    case 'NW_SE': { const q = p * (w + h); return { x1: q - h, y1: h, x2: q, y2: 0 }; }
    case 'SE_NW': { const q = (1 - p) * (w + h); return { x1: q - h, y1: h, x2: q, y2: 0 }; }
    case 'NE_SW': { const q = p * (w + h); return { x1: w - (q - h), y1: h, x2: w - q, y2: 0 }; }
    case 'SW_NE': { const q = (1 - p) * (w + h); return { x1: w - (q - h), y1: h, x2: w - q, y2: 0 }; }
  }
}
// sign of travel along x (vertical/diagonal lines) or y (horizontal lines)
const TRAVEL = { W_E: 1, E_W: -1, N_S: 1, S_N: -1, NW_SE: 1, SE_NW: -1, NE_SW: -1, SW_NE: 1 };
function progressAt(px, py, mode) {
  const w = W, h = H; let v = 0;
  switch (mode) {
    case 'W_E': v = px / w; break;
    case 'E_W': v = 1 - px / w; break;
    case 'N_S': v = py / h; break;
    case 'S_N': v = 1 - py / h; break;
    case 'NW_SE': v = (px + py) / (w + h); break;
    case 'SE_NW': v = 1 - (px + py) / (w + h); break;
    case 'NE_SW': v = ((w - px) + py) / (w + h); break;
    case 'SW_NE': v = 1 - ((w - px) + py) / (w + h); break;
  }
  return Math.max(0, Math.min(1, v));
}
function corner(mode, which) {
  const s = { NW_SE: [0, 0], SE_NW: [W, H], NE_SW: [W, 0], SW_NE: [0, H] };
  const e = { NW_SE: [W, H], SE_NW: [0, 0], NE_SW: [0, H], SW_NE: [W, 0] };
  return (which === 'start' ? s : e)[mode];
}
function snapLoops() {
  const snap = 100 / stepsFor(S.mode);
  if (!Number.isFinite(snap) || snap <= 0) return;
  S.loopStart = Math.max(0, Math.round(S.loopStart / snap) * snap);
  S.loopEnd = Math.min(100, Math.round(S.loopEnd / snap) * snap);
  if (S.loopEnd - S.loopStart < snap) S.loopEnd = Math.min(100, S.loopStart + snap);
  const steps = stepsFor(S.mode);
  S.progress = Math.floor(S.progress * steps + 1e-6) / steps;
}

/* ───────────────────────── text geometry ───────────────────────── */
const measureCtx = document.createElement('canvas').getContext('2d');
function blockGeom(b) {
  const fs = H * (b.fontSize || 0.15);
  measureCtx.font = `${WEIGHT} ${fs}px ${FONT}`;
  const lines = b.text.split('\n');
  const charW = measureCtx.measureText('0').width;
  const widths = lines.map(l => measureCtx.measureText(l).width);
  const lineH = fs * LINE_HEIGHT * STRETCH_Y;
  return {
    x: b.x / 100 * W, y: b.y / 100 * H, fs, lines, charW, lineH,
    w: Math.max(charW, ...widths), h: lines.length * lineH
  };
}
function blockAt(px, py) {
  for (let i = S.blocks.length - 1; i >= 0; i--) {
    const b = S.blocks[i], g = blockGeom(b);
    const pad = 4;
    if (px >= g.x - pad && px <= g.x + g.w + pad && py >= g.y - pad && py <= g.y + g.h + pad) return b;
  }
  return null;
}
function charIndexAt(b, px, py) {
  const g = blockGeom(b);
  const li = Math.floor((py - g.y) / g.lineH);
  if (li < 0) return 0;
  if (li >= g.lines.length) return b.text.length;
  let idx = 0;
  for (let i = 0; i < li; i++) idx += g.lines[i].length + 1;
  const line = g.lines[li], rx = px - g.x;
  measureCtx.font = `${WEIGHT} ${g.fs}px ${FONT}`;
  let best = 0, bestD = Infinity;
  for (let i = 0; i <= line.length; i++) {
    const d = Math.abs(measureCtx.measureText(line.slice(0, i)).width - rx);
    if (d < bestD) { bestD = d; best = i; } else break;
  }
  return idx + best;
}

/* ───────────────────────── scanning ───────────────────────── */
const highlights = new Map();    // "c,r" -> {c, r, a}
function flash(c, r) { highlights.set(c + ',' + r, { c, r, a: 1 }); }

function coverage(data, dw, dh, x0, y0, x1, y1) {
  const N = 6; let hit = 0, n = 0;
  for (let j = 0; j < N; j++) {
    const sy = Math.floor((y0 + (j + 0.5) * (y1 - y0) / N) * DPR);
    if (sy < 0 || sy >= dh) continue;
    for (let i = 0; i < N; i++) {
      const sx = Math.floor((x0 + (i + 0.5) * (x1 - x0) / N) * DPR);
      if (sx < 0 || sx >= dw) continue;
      n++;
      if (data[(sy * dw + sx) * 4 + 3] > 100) hit++;
    }
  }
  return n ? hit / n : 0;
}

function scanStep() {
  const { cols, cellW, cellH } = grid();
  const dw = off.width, dh = off.height;
  let data;
  try { data = offCtx.getImageData(0, 0, dw, dh).data; } catch (e) { return; }
  const dens = new Array(BANDS).fill(0);
  const mode = S.mode, dir = TRAVEL[mode];
  const line = scanLine(mode, S.progress, W, H);

  if (mode === 'N_S' || mode === 'S_N') {
    const row = Math.floor((line.y1 + dir * cellH * 0.5) / cellH);
    if (row >= 0 && row < BANDS) {
      let sum = 0;
      for (let c = 0; c < cols; c++) {
        const cov = coverage(data, dw, dh, c * cellW, row * cellH, (c + 1) * cellW, (row + 1) * cellH);
        if (cov > 0.02) flash(c, row);
        sum += cov;
      }
      dens[row] = Math.min(1, (sum / cols) * 20);
    }
  } else {
    for (let row = 0; row < BANDS; row++) {
      const yc = (row + 0.5) * cellH;
      const x = line.x1 + (yc - line.y1) * (line.x2 - line.x1) / (line.y2 - line.y1);
      const c = Math.floor((x + dir * cellW * 0.5) / cellW);
      if (c < 0 || c >= cols) continue;
      const cov = coverage(data, dw, dh, c * cellW, row * cellH, (c + 1) * cellW, (row + 1) * cellH);
      if (cov > 0.02) flash(c, row);
      dens[row] = Math.min(1, cov * 2.5);
    }
  }
  audio.update(dens, stepMs() / 1000);
}

const stepMs = () => 60000 / S.bpm;
// text size is relative to screen height, so shrink it on tall portrait screens
const defaultSize = () => +Math.max(0.05, Math.min(0.15, 0.15 * (W / H) / 1.2)).toFixed(3);

function advance() {
  const steps = stepsFor(S.mode);
  const start = S.loopStart / 100, end = S.loopEnd / 100;
  S.progress += 1 / steps;
  if (S.progress >= end - 1e-6 || S.progress < start - 1e-6) {
    S.progress = Math.floor(start * steps + 1e-6) / steps;
  }
  S.beat = (S.beat + 1) % 4;
  if (S.metronome) audio.tick(S.beat === 0);
  scanStep();
}

/* ───────────────────────── render ───────────────────────── */
function drawTextLayer() {
  offCtx.setTransform(1, 0, 0, 1, 0, 0);
  offCtx.clearRect(0, 0, off.width, off.height);
  offCtx.setTransform(DPR, 0, 0, DPR, 0, 0);
  offCtx.textBaseline = 'top';
  offCtx.textAlign = 'left';
  for (const b of S.blocks) {
    const g = blockGeom(b);
    offCtx.save();
    offCtx.translate(g.x, g.y);
    offCtx.scale(1, STRETCH_Y);
    offCtx.font = `${WEIGHT} ${g.fs}px ${FONT}`;
    offCtx.fillStyle = S.selected.has(b.id) ? (S.hoverTrash ? '#ef4444' : '#22d3ee') : '#ffffff';
    g.lines.forEach((l, i) => offCtx.fillText(l, 0, i * g.fs * LINE_HEIGHT));
    offCtx.restore();
  }
}

function strokeLine(l) { ctx.beginPath(); ctx.moveTo(l.x1, l.y1); ctx.lineTo(l.x2, l.y2); ctx.stroke(); }

let lastStepAt = 0;
function frame(ts) {
  if (S.playing) {
    const ms = stepMs();
    if (ts - lastStepAt >= ms) {
      lastStepAt = (ts - lastStepAt > ms * 3) ? ts : lastStepAt + ms;
      drawTextLayer();
      advance();
    }
  }
  drawTextLayer();

  const { cols, cellW, cellH } = grid();
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);

  // grid
  // hairline grid: exactly one device pixel, snapped to the pixel grid
  ctx.strokeStyle = 'rgba(255,255,255,0.2)';
  ctx.lineWidth = 1 / DPR;
  const half = 0.5 / DPR, snapPx = v => Math.round(v * DPR) / DPR + half;
  ctx.beginPath();
  for (let c = 0; c <= cols; c++) { const x = snapPx(c * cellW); ctx.moveTo(x, 0); ctx.lineTo(x, H); }
  for (let r = 0; r <= BANDS; r++) { const y = snapPx(r * cellH); ctx.moveTo(0, y); ctx.lineTo(W, y); }
  ctx.stroke();

  // fading cell highlights
  for (const [k, h] of highlights) {
    ctx.fillStyle = `rgba(250,204,21,${h.a})`;
    ctx.fillRect(h.c * cellW, h.r * cellH, cellW, cellH);
    h.a -= 0.05;
    if (h.a <= 0) highlights.delete(k);
  }

  // text, screened over the grid
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = 'screen';
  ctx.globalAlpha = 0.9;
  ctx.drawImage(off, 0, 0);
  ctx.restore();
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

  // marquee
  if (S.marquee) {
    const m = S.marquee;
    const x = m.x / 100 * W, y = m.y / 100 * H, w = m.w / 100 * W, h = m.h / 100 * H;
    ctx.save();
    ctx.strokeStyle = '#22d3ee'; ctx.lineWidth = 1; ctx.setLineDash([5, 5]);
    ctx.strokeRect(x, y, w, h);
    ctx.fillStyle = 'rgba(34,211,238,0.1)'; ctx.fillRect(x, y, w, h);
    ctx.restore();
  }

  // scan line
  if (S.playing) {
    ctx.strokeStyle = '#facc15'; ctx.lineWidth = 2;
    strokeLine(scanLine(S.mode, S.progress, W, H));
  }

  // loop markers
  const diag = !['W_E', 'E_W', 'N_S', 'S_N'].includes(S.mode);
  const ls = S.loopStart / 100, le = S.loopEnd / 100;
  ctx.lineWidth = 2; ctx.setLineDash([4, 4]);
  ctx.strokeStyle = 'rgba(6,182,212,0.7)';
  strokeLine(scanLine(S.mode, ls, W, H));
  ctx.strokeStyle = 'rgba(217,70,239,0.7)';
  strokeLine(scanLine(S.mode, le, W, H));
  ctx.setLineDash([]);
  if (diag && ls < 0.01) {
    const [x, y] = corner(S.mode, 'start');
    ctx.fillStyle = 'rgba(6,182,212,0.9)'; ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI * 2); ctx.fill();
  }
  if (diag && le > 0.99) {
    const [x, y] = corner(S.mode, 'end');
    ctx.fillStyle = 'rgba(217,70,239,0.9)'; ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI * 2); ctx.fill();
  }

  // caret + text selection for the block being edited
  const eb = S.blocks.find(b => b.id === S.editingId);
  if (eb) {
    const g = blockGeom(eb);
    ctx.save();
    ctx.translate(g.x, g.y);
    ctx.scale(1, STRETCH_Y);
    ctx.font = `${WEIGHT} ${g.fs}px ${FONT}`;
    const s = Math.min(S.sel.start, S.sel.end), e = Math.max(S.sel.start, S.sel.end);
    const step = g.fs * LINE_HEIGHT;
    if (s !== e) {
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      let idx = 0;
      g.lines.forEach((l, i) => {
        const a = Math.max(s, idx), z = Math.min(e, idx + l.length);
        if (a < z) {
          const x0 = ctx.measureText(l.slice(0, a - idx)).width;
          const x1 = ctx.measureText(l.slice(0, z - idx)).width;
          ctx.fillRect(x0, i * step, x1 - x0, g.fs);
        }
        idx += l.length + 1;
      });
    }
    if (Math.floor(ts / 500) % 2 === 0) {
      let idx = 0;
      for (let i = 0; i < g.lines.length; i++) {
        const l = g.lines[i];
        if (S.caret <= idx + l.length) {
          const x = ctx.measureText(l.slice(0, S.caret - idx)).width;
          ctx.fillStyle = '#fff';
          ctx.fillRect(x, i * step, 2, g.fs);
          break;
        }
        idx += l.length + 1;
      }
    }
    ctx.restore();
  }

  requestAnimationFrame(frame);
}

/* ───────────────────────── editing ───────────────────────── */
function beginEdit(b, caretIdx) {
  S.editingId = b.id;
  S.selected = new Set();
  if (b.text === PLACEHOLDER) { b.text = ''; caretIdx = 0; }
  S.caret = caretIdx; S.sel = { start: caretIdx, end: caretIdx };
  ta.value = b.text;
  ta.readOnly = false;
  ta.focus({ preventScroll: true });   // synchronous, so phones raise the keyboard
  try { ta.setSelectionRange(caretIdx, caretIdx); } catch (e) {}
  syncUI();
}
function endEdit() {
  if (!S.editingId) return;
  const id = S.editingId;
  S.editingId = null;
  S.blocks = S.blocks.filter(b => b.id !== id || b.text.trim() !== '');
  ta.blur();
  ta.readOnly = true;
  syncUI();
}
function syncCaretFromTA() {
  S.caret = ta.selectionDirection === 'backward' ? ta.selectionStart : ta.selectionEnd;
  S.sel = { start: ta.selectionStart, end: ta.selectionEnd };
}
ta.addEventListener('input', () => {
  const b = S.blocks.find(b => b.id === S.editingId);
  if (!b) return;
  b.text = ta.value;
  syncCaretFromTA();
});
['select', 'keyup', 'click'].forEach(ev => ta.addEventListener(ev, () => { if (S.editingId) syncCaretFromTA(); }));
document.addEventListener('selectionchange', () => { if (S.editingId && document.activeElement === ta) syncCaretFromTA(); });

/* ───────────────────────── pointer interaction ───────────────────────── */
function local(e) {
  const r = stage.getBoundingClientRect();
  return { px: e.clientX - r.left, py: e.clientY - r.top };
}
function resizeCursor() {
  if (S.mode === 'N_S' || S.mode === 'S_N') return 'row-resize';
  if (S.mode === 'W_E' || S.mode === 'E_W') return 'col-resize';
  if (S.mode === 'NW_SE' || S.mode === 'SE_NW') return 'nwse-resize';
  return 'nesw-resize';
}
function nearLoop(px, py) {
  const p = progressAt(px, py, S.mode) * 100;
  const T = 2;
  if (Math.abs(p - S.loopStart) < T) return 'loopStart';
  if (Math.abs(p - S.loopEnd) < T) return 'loopEnd';
  return null;
}

stage.addEventListener('pointerdown', e => {
  if (e.button !== 0) return;
  if (anySliderOpen()) { closeSliders(); e.preventDefault(); return; }
  if (!$('vmenu').hidden) { toggleVoiceMenu(false); e.preventDefault(); return; }
  if (!$('menu').hidden) { toggleMenu(false); e.preventDefault(); return; }
  if (!$('pop').hidden) { toggleHelp(false); e.preventDefault(); return; }
  e.preventDefault();
  stage.setPointerCapture(e.pointerId);
  const { px, py } = local(e);
  const xP = px / W * 100, yP = py / H * 100;
  S.drag = { target: null, sx: e.clientX, sy: e.clientY, offsets: new Map() };

  const loop = nearLoop(px, py);
  if (loop) { S.drag.target = loop; return; }

  const hit = blockAt(px, py);
  if (hit) {
    if (hit.id === S.editingId) {
      const idx = charIndexAt(hit, px, py);
      S.drag.target = 'text'; S.drag.anchor = idx;
      if (e.pointerType !== 'mouse') { S.drag.touchEdit = hit.id; S.drag.grab = { x: xP - hit.x, y: yP - hit.y }; }
      S.caret = idx; S.sel = { start: idx, end: idx };
      ta.focus({ preventScroll: true });
      try { ta.setSelectionRange(idx, idx); } catch (err) {}
      return;
    }
    if (S.editingId) endEdit();
    const multi = e.shiftKey || e.metaKey || e.ctrlKey;
    let sel;
    if (S.selected.has(hit.id) && !multi) sel = new Set(S.selected);
    else {
      sel = new Set(multi ? S.selected : []);
      if (multi && sel.has(hit.id)) { if (!e.altKey) sel.delete(hit.id); }
      else sel.add(hit.id);
    }
    S.drag.target = 'block';
    S.drag.hitId = hit.id;
    if (e.altKey) {   // clone the selection and drag the copies
      const copies = new Set();
      sel.forEach(id => {
        const o = S.blocks.find(b => b.id === id);
        if (!o) return;
        const c = { ...o, id: newId() };
        S.blocks.push(c); copies.add(c.id);
        S.drag.offsets.set(c.id, { x: xP - o.x, y: yP - o.y });
      });
      sel = copies;
      S.drag.cloned = true;
    } else {
      sel.forEach(id => {
        const b = S.blocks.find(b => b.id === id);
        if (b) S.drag.offsets.set(id, { x: xP - b.x, y: yP - b.y });
      });
    }
    S.selected = sel;
    syncUI();
    return;
  }

  // empty space → marquee (or create, if it turns out to be a click)
  if (S.editingId) endEdit();
  S.drag.target = 'marquee';
  S.drag.base = e.shiftKey ? new Set(S.selected) : new Set();
  S.selected = new Set(S.drag.base);
  S.marquee = { x: xP, y: yP, w: 0, h: 0 };
  syncUI();
});

stage.addEventListener('pointermove', e => {
  const { px, py } = local(e);
  const xP = px / W * 100, yP = py / H * 100;
  const d = S.drag;

  if (!d) {
    if (e.pointerType === 'mouse') {
      let cur = 'crosshair';
      if (nearLoop(px, py)) cur = resizeCursor();
      else {
        const b = blockAt(px, py);
        if (b) cur = b.id === S.editingId ? 'text' : 'move';
      }
      stage.style.cursor = cur;
    }
    return;
  }
  if (Math.hypot(e.clientX - d.sx, e.clientY - d.sy) >= 6) d.moved = true;

  if (d.target === 'text' && d.touchEdit && d.moved) {
    // on touch, dragging the block you're typing in moves it instead of selecting text
    const id = d.touchEdit;
    endEdit();
    if (S.blocks.some(b => b.id === id)) {
      S.selected = new Set([id]);
      d.offsets.set(id, d.grab);
      d.target = 'block'; d.hitId = id; d.fromEdit = true;
    } else { S.drag = null; return; }
  }
  if (d.target === 'text') {
    const b = S.blocks.find(b => b.id === S.editingId);
    if (!b) return;
    const idx = charIndexAt(b, px, py);
    S.caret = idx; S.sel = { start: d.anchor, end: idx };
    try { ta.setSelectionRange(Math.min(d.anchor, idx), Math.max(d.anchor, idx), idx < d.anchor ? 'backward' : 'forward'); } catch (err) {}
    stage.style.cursor = 'text';
    return;
  }

  if (d.target === 'block') {
    if (!d.moved) return;
    stage.style.cursor = 'move';
    { const d = LAYOUT.del; S.hoverTrash = px > d.x0 && px < d.x1 && py > d.y0 && py < d.y1; }
    for (const b of S.blocks) {
      const o = d.offsets.get(b.id);
      if (o) { b.x = xP - o.x; b.y = yP - o.y; }
    }
    syncUI();
    return;
  }

  if (d.target === 'marquee') {
    const m = S.marquee;
    m.w = xP - m.x; m.h = yP - m.y;
    const ax = Math.min(m.x, xP) / 100 * W, ay = Math.min(m.y, yP) / 100 * H;
    const aw = Math.abs(m.w) / 100 * W, ah = Math.abs(m.h) / 100 * H;
    const sel = new Set(d.base);
    for (const b of S.blocks) {
      const g = blockGeom(b);
      if (g.x < ax + aw && g.x + g.w > ax && g.y < ay + ah && g.y + g.h > ay) sel.add(b.id);
    }
    S.selected = sel;
    syncUI();
    return;
  }

  if (d.target === 'loopStart' || d.target === 'loopEnd') {
    stage.style.cursor = resizeCursor();
    const snap = 100 / stepsFor(S.mode);
    const v = Math.round(progressAt(px, py, S.mode) * 100 / snap) * snap;
    if (d.target === 'loopStart') S.loopStart = Math.max(0, Math.min(v, S.loopEnd - snap));
    else S.loopEnd = Math.min(100, Math.max(v, S.loopStart + snap));
  }
});

function pointerEnd(e) {
  const d = S.drag;
  if (!d) return;
  S.drag = null;
  const { px, py } = local(e);
  const xP = px / W * 100, yP = py / H * 100;
  const isClick = !d.moved;

  if (d.target === 'block') {
    if (S.hoverTrash) {
      S.blocks = S.blocks.filter(b => !S.selected.has(b.id));
      S.selected = new Set();
    } else if (isClick && !d.cloned && !(e.shiftKey || e.metaKey || e.ctrlKey)) {
      const b = S.blocks.find(b => b.id === d.hitId);
      if (b) beginEdit(b, charIndexAt(b, px, py));
    }
  } else if (d.target === 'marquee' && isClick && e.type === 'pointerup') {
    const b = { id: newId(), x: Math.max(0, xP), y: Math.max(0, yP - 2), text: '', fontSize: defaultSize() };
    S.blocks.push(b);
    beginEdit(b, 0);
  } else if (d.target === 'text') {
    ta.focus({ preventScroll: true });
  }

  S.marquee = null;
  S.hoverTrash = false;
  syncUI();
}
stage.addEventListener('pointerup', pointerEnd);
stage.addEventListener('pointercancel', pointerEnd);

/* ───────────────────────── keyboard ───────────────────────── */
window.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    if (anySliderOpen()) { closeSliders(); return; }
    if (!$('vmenu').hidden) { toggleVoiceMenu(false); return; }
    if (!$('menu').hidden) { toggleMenu(false); return; }
    if (!$('pop').hidden) { toggleHelp(false); return; }
    endEdit();
    S.selected = new Set();
    syncUI();
    return;
  }
  if (S.editingId) return;
  if (e.target instanceof HTMLButtonElement && (e.key === ' ' || e.key === 'Enter')) return;
  if ((e.metaKey || e.ctrlKey) && (e.key === 'c' || e.key === 'v')) {
    e.preventDefault();
    if (e.key === 'c') copySelection(); else pasteClip();
  } else if ((e.key === 'Backspace' || e.key === 'Delete') && S.selected.size) {
    e.preventDefault();
    deleteSelection();
  } else if (e.key === ' ') {
    e.preventDefault();
    togglePlay();
  }
});

/* ───────────────────────── controls ───────────────────────── */
function togglePlay() {
  S.playing = !S.playing;
  if (S.playing) {
    audio.play();
    const steps = stepsFor(S.mode);
    const start = S.loopStart / 100, end = S.loopEnd / 100;
    if (S.progress < start - 1e-6 || S.progress >= end - 1e-6) S.progress = Math.floor(start * steps + 1e-6) / steps;
    lastStepAt = performance.now();
    drawTextLayer();
    S.beat = 0;
    if (S.metronome) audio.tick(true);
    scanStep();
  } else {
    audio.stop();
  }
  syncUI();
}
function cycleMode() {
  const cur = S.mode;
  const next = SCAN_MODES[(SCAN_MODES.indexOf(cur) + 1) % SCAN_MODES.length];
  const reversal = (cur === 'W_E' && next === 'E_W') || (cur === 'N_S' && next === 'S_N') ||
                   (cur === 'NW_SE' && next === 'SE_NW') || (cur === 'NE_SW' && next === 'SW_NE');
  if (reversal) { const s = S.loopStart; S.loopStart = 100 - S.loopEnd; S.loopEnd = 100 - s; }
  S.mode = next;
  snapLoops();
  syncUI();
}
function adjustSize(delta) {
  for (const b of S.blocks) {
    if (S.selected.has(b.id) || b.id === S.editingId) b.fontSize = Math.max(0.05, Math.min(0.5, +(b.fontSize + delta).toFixed(3)));
  }
}
function deleteSelection() {
  const ids = new Set(S.selected);
  if (S.editingId) ids.add(S.editingId);
  if (!ids.size) return;
  S.editingId = null;
  ta.blur(); ta.readOnly = true;
  S.blocks = S.blocks.filter(b => !ids.has(b.id));
  S.selected = new Set();
  syncUI();
}
// desktop: the panel grows left and down from the ? tile, snapped to grid cells
function sizeHelpPanel() {
  const pop = $('pop');
  const { cols, cellW, cellH } = grid();
  const { inset, m, span: k } = LAYOUT;
  pop.style.setProperty('--gap', (2 * inset) + 'px');
  if (matchMedia('(max-width: 640px)').matches) { pop.style.left = pop.style.top = pop.style.width = pop.style.height = ''; return; }
  const hp = POS.helpBtn;
  const pcols = Math.min(cols - 2 * m, Math.max(4 * k, Math.round(400 / cellW) - k));   // one tile narrower
  const right = (hp.col + k) * cellW - inset;
  const up = hp.row > BANDS / 2;                       // ? at the bottom: the panel grows upwards from it
  pop.classList.toggle('up', up);
  pop.style.left = (right - pcols * cellW + 2 * inset) + 'px';
  pop.style.width = (pcols * cellW - 2 * inset) + 'px';
  // body height: fit the text, then round up to whole grid cells
  const body = pop.querySelector('.pop-body');
  pop.style.height = 'auto'; body.style.flex = 'none'; body.style.height = 'auto';
  const need = k * cellH + body.scrollHeight + inset;
  const room = up ? hp.row + k - m : LAYOUT.floorRow - hp.row - 1;
  const rows = Math.min(room, Math.ceil(need / cellH));
  pop.style.top = ((up ? hp.row + k - rows : hp.row) * cellH + inset) + 'px';
  pop.style.height = (rows * cellH - 2 * inset) + 'px';
  body.style.flex = ''; body.style.height = '';
}
function toggleHelp(force) {
  const pop = $('pop');
  const open = typeof force === 'boolean' ? force : pop.hidden;
  pop.hidden = !open;
  if (open) toggleMenu(false);
  $('app').classList.toggle('help-open', open);
  if (open) sizeHelpPanel();
  $('helpBtn').classList.toggle('open', open);
  $('helpBtn').setAttribute('aria-expanded', open);
  $('helpBtn').innerHTML = open ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4l16 16M20 4L4 20"/></svg>' : '?';
  $('helpBtn').setAttribute('aria-label', open ? 'Close help' : 'Help');
}

/* copy / paste (an in-app clipboard of whole text blocks) */
let clip = [], pasteCount = 0;
function targetIds() {
  const ids = new Set(S.selected);
  if (S.editingId) ids.add(S.editingId);
  return ids;
}
function copySelection() {
  const ids = targetIds();
  const src = S.blocks.filter(b => ids.has(b.id) && b.text !== '');
  if (!src.length) return;
  clip = src.map(b => ({ ...b }));
  pasteCount = 0;
  const t = $('copyBtn');
  t.classList.add('flash'); setTimeout(() => t.classList.remove('flash'), 350);
  syncUI();
}
function pasteClip() {
  if (!clip.length) return;
  endEdit();
  pasteCount++;
  const { cellW, cellH } = grid();
  const dx = pasteCount * LAYOUT.span * cellW / W * 100, dy = pasteCount * LAYOUT.span * cellH / H * 100;
  const ids = new Set();
  for (const b of clip) {
    const c = { ...b, id: newId(), x: b.x + dx, y: b.y + dy };
    if (c.x > 92) c.x -= 2 * dx;
    if (c.y > 92) c.y -= 2 * dy;
    S.blocks.push(c); ids.add(c.id);
  }
  S.selected = ids;
  syncUI();
}

/* tiles snap to grid cells: each one covers span x span cells */
function layoutUI() {
  const { cols, cellW, cellH } = grid();
  const k = Math.max(2, Math.min(5, Math.round(42 / Math.min(cellW, cellH))));   // tiles cover k x k cells, ~42px
  const inset = Math.max(2, Math.min(4, cellH * 0.12));
  const tw = k * cellW - 2 * inset, th = k * cellH - 2 * inset;
  $('ui').style.setProperty('--t', Math.min(tw, th) + 'px');
  $('menu').style.setProperty('--t', Math.min(tw, th) + 'px');
  $('vmenu').style.setProperty('--t', Math.min(tw, th) + 'px');
  ['lenPanel', 'bpmPanel', 'sizePanel'].forEach(id => $(id).style.setProperty('--t', Math.min(tw, th) + 'px'));
  const placeEl = (el, col, row) => {
    el.style.transform = `translate(${col * cellW + inset}px, ${row * cellH + inset}px)`;
    el.style.width = tw + 'px'; el.style.height = th + 'px';
  };
  POS = {};
  const place = (id, col, row) => {
    POS[id] = { col, row };
    const el = $(id);
    el.style.transform = `translate(${col * cellW + inset}px, ${row * cellH + inset}px)`;
    el.style.width = tw + 'px'; el.style.height = th + 'px';
  };
  const m = 1, rightCol = cols - m - k, bottomRow = BANDS - m - k;
  const lay = (ids, start, row) => ids.forEach((id, i) => place(id, start + i * k, row));
  const scaleCol = Math.floor((cols - k) / 2);
  // Corners: direction (top left), help (top right), copy + paste (bottom left), delete (bottom right).
  // Centre top: how it sounds (sound, scale, mode, length). Centre bottom: tempo | play | size.
  const sound = ['voiceBtn', 'scaleBtn', 'modeBtn', 'lenBtn'];
  const middle = ['bpmVal', 'playBtn', 'sizeVal'];
  const mid4 = (cols - 4 * k) / 2;                      // cols even: a group of four sits exactly on the grid
  const mid3 = (cols - 3 * k) / 2;                      // a group of three is centred on the screen (may sit half a cell off the grid)
  place('dirBtn', m, m);
  place('helpBtn', rightCol, m);
  place('copyBtn', m, bottomRow);
  place('pasteBtn', m + k, bottomRow);
  place('trash', rightCol, bottomRow);
  // top centre: same row as the corners when there is room, otherwise just below
  const topFits = mid4 >= m + k + 1 && mid4 + 4 * k + 1 <= rightCol;
  lay(sound, Math.max(m, mid4), topFits ? m : m + k + 1);
  // bottom centre: same row as copy / paste / delete when there is room, otherwise just above
  let floorRow = bottomRow;                             // highest row of bottom tiles (menus and panels stop above it)
  if (mid3 >= m + 2 * k + 0.5 && mid3 + 3 * k + 0.5 <= rightCol) lay(middle, mid3, bottomRow);
  else { floorRow = bottomRow - k - 1; lay(middle, Math.max(m, mid3), floorRow); }
  const tp = POS.trash;
  LAYOUT = { span: k, cellW, cellH, inset, m, rightCol, bottomRow, floorRow, tw, th,
    del: { x0: (tp.col - 0.5) * cellW, y0: (tp.row - 0.5) * cellH, x1: (tp.col + k + 0.5) * cellW, y1: (tp.row + k + 0.5) * cellH } };
  const pop = $('pop');
  // help overlay text lines up with the tile grid
  pop.style.setProperty('--pt', (m * cellH + inset) + 'px');
  pop.style.setProperty('--pl', (m * cellW + inset) + 'px');
  pop.style.setProperty('--pr', (W - rightCol * cellW + cellW) + 'px');
  pop.style.setProperty('--pb', ((BANDS - bottomRow - k) * cellH + inset) + 'px');
  pop.style.setProperty('--pbb', ((BANDS - floorRow) * cellH + inset) + 'px');
  pop.style.setProperty('--xw', tw + 'px');
  pop.style.setProperty('--xh', th + 'px');
  pop.style.setProperty('--t', Math.min(tw, th) + 'px');
  if (!pop.hidden) sizeHelpPanel();

  // scale menu: grid of tiles hanging under the scale tile, sized so every scale fits on screen
  const names = Object.keys(SCALES);
  const topIds = ['scaleBtn', 'voiceBtn', 'modeBtn', 'lenBtn', 'dirBtn', 'helpBtn'];
  const topEnd = Math.max(...topIds.map(id => POS[id].row)) + k + 1;
  const availRows = Math.max(1, Math.floor((floorRow - topEnd) / k));
  const maxCols = Math.max(1, Math.floor((cols - 2 * m) / k));
  const ncols = Math.min(maxCols, Math.max(6, Math.ceil(names.length / availRows)));
  const nrows = Math.ceil(names.length / ncols);
  const menuW = ncols * k, menuH = nrows * k;
  const startCol = Math.max(m, Math.floor((cols - menuW) / 2));
  const startRow = topEnd - 1;                    // directly under the top tiles
  [...$('menu').children].forEach((el, i) => {
    placeEl(el, startCol + (i % ncols) * k, startRow + Math.floor(i / ncols) * k);
  });
  // sound menu: one row (or more on narrow screens) of name tiles, centred under the top tiles
  const vItems = [...$('vmenu').children], vcols = Math.min(maxCols, vItems.length);
  const vStart = Math.max(m, Math.floor((cols - vcols * k) / 2));
  vItems.forEach((el, i) => placeEl(el, vStart + (i % vcols) * k, startRow + Math.floor(i / vcols) * k));
  fitScaleLabel();
  placeSliders();
}

/* scale tile + menu */
function fitLabel(el, name) {
  el.innerHTML = (SCALE_SHORT[name] || name).split(' ').map(w => `<span>${w}</span>`).join('');
  el.title = `${scaleWords(name)} (${SCALES[name].length} notes)`;
}
function fitScaleLabel() { const n = scaleWords(S.scale); $('scaleBtn').title = `Scale: ${n}`; $('scaleBtn').setAttribute('aria-label', `Scale: ${n}`); }
function buildMenu() {
  const menu = $('menu');
  menu.innerHTML = Object.keys(SCALES).map(nm =>
    `<button class="tile opt" type="button" role="option" data-scale="${nm}" aria-label="${scaleWords(nm)}"></button>`).join('');
  [...menu.children].forEach(el => fitLabel(el, el.dataset.scale));
  menu.addEventListener('click', e => {
    const b = e.target.closest('.opt');
    if (!b) return;
    setScale(b.dataset.scale);
    toggleMenu(false);
  });
}
function setScale(name) {
  if (!SCALES[name]) return;
  S.scale = name;
  NOTES = scaleNotes(name);
  ROWNOTE = rowNotes(NOTES.length);
  audio.setScale();
  fitScaleLabel();
  syncUI();
}
function toggleMenu(force) {
  const menu = $('menu');
  const open = typeof force === 'boolean' ? force : menu.hidden;
  if (open) { toggleHelp(false); closeSliders(); toggleVoiceMenu(false); }
  menu.hidden = !open;
  $('scaleBtn').classList.toggle('open', open);
  $('scaleBtn').setAttribute('aria-expanded', open);
  menu.querySelectorAll('.opt').forEach(o => { const on = o.dataset.scale === S.scale; o.classList.toggle('on', on); o.setAttribute('aria-selected', on); });
}

/* typing a tempo into the BPM tile */

// keep chrome clicks from reaching the canvas or stealing the text caret
stage.addEventListener('mousedown', e => e.preventDefault());
for (const el of [$('ui'), $('pop'), $('menu'), $('vmenu'), $('lenPanel'), $('bpmPanel'), $('sizePanel')]) {
  el.addEventListener('mousedown', e => { if (S.editingId && e.target.tagName !== 'INPUT') e.preventDefault(); });
}
$('playBtn').onclick = togglePlay;
$('dirBtn').onclick = cycleMode;
$('metroBtn').onclick = () => {
  S.metronome = !S.metronome;
  if (S.metronome) { audio.init(); audio.tick(true); }   // audible confirmation, even when stopped
  syncUI();
};
$('copyBtn').onclick = copySelection;
// icons
const VOICE_ICON = {
  keys:  '<path d="M2 12C4.5 3 7.5 3 12 12S19.5 21 22 12"/>',
  pad:   '<path d="M2 13.5C5 6.5 9 6.5 12 13.5S19 20.5 22 13.5"/><path d="M2 10.5C5 3.5 9.5 3.5 12.5 10.5S19.5 17 22 10.5" opacity=".45"/>',
  bell:  '<path d="M2 12C3 2.5 5 2.5 6 12S8.5 19 9.5 12 11.5 6.5 12.5 12 14 15.6 15 12 16.4 9.8 17.2 12H22"/>',
  organ: '<path d="M2 8C5 3.5 9 3.5 12 8S19 12.5 22 8"/><path d="M2 17C3.3 14.5 4.7 14.5 6 17S8.7 19.5 10 17 12.7 14.5 14 17 16.7 19.5 18 17 20.7 14.5 22 17"/>',
  wood:  '<path d="M2 12H7C8 3.5 10 3.5 11 12S13 16.5 14 12H22"/>',
  pluck: '<path d="M2 16H7V8H12V16H17V8H22"/>',
};
const MODE_ICON = {
  chord:  '<rect x="7.5" y="3" width="9" height="9"/><rect x="7.5" y="12" width="9" height="9"/>',
  arp:    '<rect x="3" y="12" width="9" height="9"/><rect x="12" y="3" width="9" height="9"/>',
  melody: '<rect x="7.5" y="7.5" width="9" height="9"/>',
};
const lenIcon = v => { const p = 6 + v * 10, d = p + 2 + v * 1.5; return `M3 20L6 4H${p.toFixed(1)}L${d.toFixed(1)} 20H22`; };

// sound / mode: tap to cycle; when stopped, a short phrase previews the change
let previewTimers = [];
function previewSound() {
  if (S.playing) return;
  audio.init();
  previewTimers.forEach(clearTimeout); previewTimers = [];
  audio.running = true;
  audio.releaseAll(0.05);
  const N = NOTES.length, c = Math.floor(N / 2), step = 0.3;
  const phrase = [[c - 4, c, c + 3], [c - 4, c, c + 3], [c - 2, c + 2, c + 5], [c - 5, c - 1, c + 4]];
  const rowsFor = notes => {
    const d = new Array(BANDS).fill(0);
    notes.forEach(j => { const r = ROWNOTE.indexOf(Math.max(0, Math.min(N - 1, j))); if (r >= 0) d[BANDS - 1 - r] = 0.8; });
    return d;
  };
  phrase.forEach((notes, n) => previewTimers.push(setTimeout(() => audio.update(rowsFor(notes), step), n * step * 1000)));
  previewTimers.push(setTimeout(() => { audio.update(new Array(BANDS).fill(0), step); audio.running = S.playing; }, phrase.length * step * 1000));
}
function buildVoiceMenu() {
  const vm = $('vmenu');
  vm.innerHTML = VOICE_ORDER.map(v =>
    `<button class="tile opt" type="button" role="option" data-voice="${v}" aria-label="${VOICES[v].label}" title="${VOICES[v].label}">` +
    VOICE_SHORT[v].split(' ').map(w => `<span>${w}</span>`).join('') + `</button>`).join('');
  vm.addEventListener('click', e => {
    const b = e.target.closest('.opt'); if (!b) return;
    S.voice = b.dataset.voice; audio.setVoice(S.voice);
    toggleVoiceMenu(false); syncUI(); previewSound();
  });
}
function toggleVoiceMenu(force) {
  const vm = $('vmenu'), open = typeof force === 'boolean' ? force : vm.hidden;
  if (open) { toggleMenu(false); toggleHelp(false); closeSliders(); }
  vm.hidden = !open;
  $('voiceBtn').classList.toggle('open', open);
  $('voiceBtn').setAttribute('aria-expanded', open);
  vm.querySelectorAll('.opt').forEach(o => { const on = o.dataset.voice === S.voice; o.classList.toggle('on', on); o.setAttribute('aria-selected', on); });
}
buildVoiceMenu();
$('voiceBtn').onclick = () => toggleVoiceMenu();
$('modeBtn').onclick = () => {
  S.pmode = MODE_ORDER[(MODE_ORDER.indexOf(S.pmode) + 1) % MODE_ORDER.length];
  audio.setMode(S.pmode);
  syncUI(); previewSound();
};

// vertical sliders that drop out of their tile: note length, tempo and text size.
// Tempo and size also have a number at the top you can tap and type into.
const BPM_MIN = 20, BPM_MAX = 320, SIZE_MIN = 0.04, SIZE_MAX = 0.5;
const sizeTargets = () => S.blocks.filter(b => S.selected.has(b.id) || b.id === S.editingId);
const SLIDERS = {
  len:  { tile: 'lenBtn', panel: 'lenPanel',
          get: () => S.len,
          set: v => { S.len = v; audio.setLength(v); },
          done: () => previewSound(), text: () => LENGTH_NAME(S.len) },
  bpm:  { tile: 'bpmVal', panel: 'bpmPanel',
          get: () => (S.bpm - BPM_MIN) / (BPM_MAX - BPM_MIN),
          set: v => { S.bpm = Math.round(BPM_MIN + v * (BPM_MAX - BPM_MIN)); },
          num: () => S.bpm, type: n => { S.bpm = Math.max(10, Math.min(999, n)); }, text: () => S.bpm + ' BPM' },
  size: { tile: 'sizeVal', panel: 'sizePanel',
          get: () => { const b = sizeTargets()[0]; return b ? (b.fontSize - SIZE_MIN) / (SIZE_MAX - SIZE_MIN) : 0; },
          set: v => { const fs = +(SIZE_MIN + v * (SIZE_MAX - SIZE_MIN)).toFixed(3); sizeTargets().forEach(b => { b.fontSize = fs; }); },
          num: () => { const b = sizeTargets()[0]; return b ? Math.round(b.fontSize * 100) : ''; },
          type: n => { const fs = Math.max(SIZE_MIN, Math.min(SIZE_MAX, n / 100)); sizeTargets().forEach(b => { b.fontSize = fs; }); },
          text: () => 'Size ' + SLIDERS.size.num() },
};
function placeSliders() {
  const { cellW, cellH, inset, span: k, floorRow } = LAYOUT || {};
  if (!cellW) return;
  for (const key in SLIDERS) {
    const P = POS[SLIDERS[key].tile]; if (!P) continue;
    const el = $(SLIDERS[key].panel), up = P.row > BANDS / 2;
    const room = up ? P.row - (LAYOUT.m + k + 1) : floorRow - 1 - (P.row + k);
    const rows = Math.max(3 * k, Math.min(6 * k, room));
    el.classList.toggle('up', up);
    el.style.left = (P.col * cellW + inset) + 'px';
    el.style.top = ((up ? P.row - rows : P.row + k) * cellH + inset) + 'px';
    el.style.width = (k * cellW - 2 * inset) + 'px';
    el.style.height = (rows * cellH - 2 * inset) + 'px';
  }
}
function closeSliders(except) { for (const key in SLIDERS) if (key !== except) toggleSlider(key, false); }
function toggleSlider(key, force) {
  const sl = SLIDERS[key], el = $(sl.panel), tile = $(sl.tile);
  const open = typeof force === 'boolean' ? force : el.hidden;
  if (open) { toggleMenu(false); toggleHelp(false); toggleVoiceMenu(false); closeSliders(key); placeSliders(); }
  if (el.hidden === !open) return;
  el.hidden = !open;
  tile.classList.toggle('open', open);
  tile.setAttribute('aria-expanded', open);
  if (open) syncSliders();
}
const anySliderOpen = () => Object.values(SLIDERS).some(sl => !$(sl.panel).hidden);
function syncSliders() {
  for (const key in SLIDERS) {
    const sl = SLIDERS[key], el = $(sl.panel);
    const pc = Math.round(Math.max(0, Math.min(1, sl.get())) * 100);
    el.querySelector('.fill').style.height = pc + '%';
    el.querySelector('.thumb').style.bottom = pc + '%';
    el.setAttribute('aria-valuenow', pc);
    el.setAttribute('aria-valuetext', sl.text());
    const inp = el.querySelector('.sval');
    if (inp && document.activeElement !== inp) inp.value = sl.num();
  }
}
for (const key in SLIDERS) {
  const sl = SLIDERS[key], el = $(sl.panel), track = el.querySelector('.track'), inp = el.querySelector('.sval');
  $(sl.tile).onclick = () => toggleSlider(key);
  const valAt = e => { const r = track.getBoundingClientRect(); return Math.max(0, Math.min(1, 1 - (e.clientY - r.top) / r.height)); };
  const apply = v => { sl.set(Math.max(0, Math.min(1, v))); syncUI(); };
  let dragging = false;
  el.addEventListener('pointerdown', e => {
    if (e.target === inp) return;                       // tapping the number types into it
    e.preventDefault(); dragging = true; el.setPointerCapture(e.pointerId); apply(valAt(e));
  });
  el.addEventListener('pointermove', e => { if (dragging) apply(valAt(e)); });
  el.addEventListener('pointerup', e => { if (!dragging) return; dragging = false; apply(valAt(e)); if (sl.done) sl.done(); });
  el.addEventListener('pointercancel', () => { dragging = false; });
  el.addEventListener('keydown', e => {
    if (e.target === inp) return;
    const d = { ArrowUp: 0.02, ArrowRight: 0.02, ArrowDown: -0.02, ArrowLeft: -0.02 }[e.key];
    if (d) { e.preventDefault(); e.stopPropagation(); apply(sl.get() + d); if (sl.done) sl.done(); }
  });
  if (inp) {
    const commit = () => { const n = parseInt(inp.value, 10); if (Number.isFinite(n)) sl.type(n); inp.blur(); syncUI(); };
    inp.addEventListener('focus', () => inp.select());
    inp.addEventListener('input', () => { inp.value = inp.value.replace(/[^0-9]/g, ''); });
    inp.addEventListener('keydown', e => {
      e.stopPropagation();
      if (e.key === 'Enter') { e.preventDefault(); commit(); }
      else if (e.key === 'Escape') { e.preventDefault(); inp.value = sl.num(); inp.blur(); }
    });
    inp.addEventListener('blur', () => { const n = parseInt(inp.value, 10); if (Number.isFinite(n) && n !== sl.num()) { sl.type(n); syncUI(); } });
  }
}
$('pasteBtn').onclick = pasteClip;
$('trash').onclick = deleteSelection;
$('helpBtn').onclick = () => { toggleMenu(false); toggleVoiceMenu(false); toggleHelp(); };
$('scaleBtn').onclick = () => toggleMenu();


const DIR_ANGLE = { W_E: 0, E_W: 180, N_S: 90, S_N: -90, NW_SE: 45, SE_NW: -135, NE_SW: 135, SW_NE: -45 };
const ICON_PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3.5v17l15-8.5z" fill="currentColor" stroke="none"/></svg>';
const ICON_STOP = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="5" width="14" height="14" fill="currentColor" stroke="none"/></svg>';
let lastPlayIcon = null;
function syncUI() {
  if (lastPlayIcon !== S.playing) {
    $('playBtn').innerHTML = S.playing ? ICON_STOP : ICON_PLAY;
    $('playBtn').setAttribute('aria-label', S.playing ? 'Stop' : 'Play');
    lastPlayIcon = S.playing;
  }
  $('dirBtn').querySelector('svg').style.transform = `rotate(${DIR_ANGLE[S.mode]}deg)`;
  $('bpmVal').title = `Tempo: ${S.bpm} BPM`;
  $('bpmVal').setAttribute('aria-label', `Tempo: ${S.bpm} BPM`);
  $('voiceBtn').title = `Sound: ${VOICES[S.voice].label}`;
  $('voiceBtn').setAttribute('aria-label', `Sound: ${VOICES[S.voice].label}`);
  $('modeIcon').innerHTML = MODE_ICON[S.pmode];
  $('modeBtn').title = MODES[S.pmode].label;
  $('modeBtn').setAttribute('aria-label', `Play as: ${MODES[S.pmode].label}`);
  $('lenPath').setAttribute('d', lenIcon(S.len));
  $('lenBtn').title = `Note length: ${LENGTH_NAME(S.len)}`;
  $('lenBtn').setAttribute('aria-label', `Note length: ${LENGTH_NAME(S.len)}`);
  syncSliders();
  $('metroBtn').classList.toggle('on', S.metronome);
  $('metroBtn').setAttribute('aria-pressed', S.metronome);

  const ids = targetIds();
  const has = ids.size > 0;
  $('sizeVal').disabled = !has;
  if (!has && !$('sizePanel').hidden) toggleSlider('size', false);
  const first = S.blocks.find(b => ids.has(b.id));
  $('sizeVal').title = first ? `Text size: ${Math.round(first.fontSize * 100)}` : 'Text size (select text first)';
  $('copyBtn').disabled = !has;
  $('pasteBtn').disabled = clip.length === 0;
  $('trash').disabled = !has && !S.hoverTrash;
  $('trash').classList.toggle('hot', S.hoverTrash);
}

/* ───────────────────────── boot ───────────────────────── */
buildMenu();
resize();
{ const st = 100 / stepsFor(S.mode); S.loopStart = st; S.loopEnd = 100 - st; snapLoops(); }
S.blocks[0].fontSize = defaultSize();
// make sure the starting text fits across the screen too (narrow phones), once the font has loaded
function fitStartText() {
  const b = S.blocks.find(x => x.id === 'init');
  if (!b || b.text !== PLACEHOLDER) return;
  const g = blockGeom(b), room = W * 0.86 - g.x;
  if (g.w > room) b.fontSize = +(b.fontSize * room / g.w).toFixed(3);
}
fitStartText();
if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitStartText);
syncUI();
ta.readOnly = true;
requestAnimationFrame(frame);
if (document.fonts && document.fonts.load) Promise.all([document.fonts.load(`400 40px "Barlow"`), document.fonts.load(`500 14px "Barlow"`), document.fonts.load(`400 20px "Barlow Condensed"`)]).catch(() => {});
})();
