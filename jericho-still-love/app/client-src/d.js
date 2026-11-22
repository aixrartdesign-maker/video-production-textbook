
// ── audio: music, ambience, effects, narration ────────────────────────────
const SND = { ctx: null, master: null, music: null, sfx: null, vo: null, raw: {}, buf: {}, wait: {}, voNow: null };
const LOOPS = {};
const VO_KEYS = ['intro', 'crossed', 'face', 'choose', 'march', 'd1', 'd2', 'd3', 'd4', 'd5', 'd6', 'd7', 'fallen1', 'fallen2', 'reflect', 'cairn', 'again', 'ending', 'gauto', 'guide', 'lost', 'blow'];
function fetchAudio(n) { fetch(`/assets/audio/${n}.mp3`).then((r) => (r.ok ? r.arrayBuffer() : Promise.reject())).then((b) => { SND.raw[n] = b; if (SND.ctx) decode(n); }).catch(() => {}); }
if (!LAB) { ['m_fear', 'm_hope', 'shofar', 'collapse', 'steps', 'river', 'chime', 'shout', 'birds', 'fire'].forEach(fetchAudio); VO_KEYS.forEach((k) => fetchAudio('vo_' + k)); }
function decode(n) {
  const raw = SND.raw[n]; if (!raw) return; delete SND.raw[n];
  SND.ctx.decodeAudioData(raw, (b) => { SND.buf[n] = b; (SND.wait[n] || []).forEach((f) => f()); SND.wait[n] = []; }, () => {});
}
function startAudio() {
  const AC = window.AudioContext || window.webkitAudioContext; if (!AC || SND.ctx) return;
  try { SND.ctx = new AC(); } catch { return; }
  const c = SND.ctx, bus = (to) => { const g = c.createGain(); g.connect(to); return g; };
  SND.master = bus(c.destination); SND.master.gain.value = SET.sound ? 0.9 : 0;
  SND.music = bus(SND.master); SND.sfx = bus(SND.master); SND.vo = bus(SND.master); SND.vo.gain.value = 1.15;
  Object.keys(SND.raw).forEach(decode);
  // wind: filtered noise, always there, never loud
  const nb = c.createBuffer(1, c.sampleRate * 2, c.sampleRate), d = nb.getChannelData(0); let last = 0;
  for (let i = 0; i < d.length; i++) { const w = Math.random() * 2 - 1; last = (last + 0.02 * w) / 1.02; d[i] = last * 3.2; }
  const src = c.createBufferSource(); src.buffer = nb; src.loop = true; const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 420; f.Q.value = 0.5;
  LOOPS.wind = c.createGain(); LOOPS.wind.gain.value = 0; src.connect(f); f.connect(LOOPS.wind); LOOPS.wind.connect(SND.sfx); src.start();
}
function mkLoop(n, vol, bus) {
  if (!SND.ctx) return null; const g = SND.ctx.createGain(); g.gain.value = vol; g.connect(bus || SND.sfx);
  const go = () => { const s = SND.ctx.createBufferSource(); s.buffer = SND.buf[n]; s.loop = true; s.connect(g); s.start(); };
  if (SND.buf[n]) go(); else (SND.wait[n] = SND.wait[n] || []).push(go);
  return g;
}
function play(n, vol = 1, bus) {
  if (!SND.ctx || !SND.buf[n]) return null; const s = SND.ctx.createBufferSource(), g = SND.ctx.createGain();
  s.buffer = SND.buf[n]; g.gain.value = vol; s.connect(g); g.connect(bus || SND.sfx); s.start(); return { s, g };
}
function fade(g, v, sec) { if (!g || !SND.ctx) return; const t = SND.ctx.currentTime; g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(g.gain.value, t); g.gain.linearRampToValueAtTime(v, t + sec); }
function drum(vol = 0.7) { // a low frame-drum thump, synthesised
  if (!SND.ctx) return; const c = SND.ctx, t = c.currentTime, o = c.createOscillator(), g = c.createGain();
  o.type = 'sine'; o.frequency.setValueAtTime(92, t); o.frequency.exponentialRampToValueAtTime(38, t + 0.32);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
  o.connect(g); g.connect(SND.sfx); o.start(t); o.stop(t + 1);
}
function speak(key) { // narration; ducks the music while it talks
  if (!SND.ctx || !SET.voice) return 0; const b = SND.buf['vo_' + key]; if (!b) return 0;
  if (SND.voNow) { try { SND.voNow.stop(); } catch { /* already ended */ } }
  const s = SND.ctx.createBufferSource(); s.buffer = b; s.connect(SND.vo); s.start(); SND.voNow = s;
  fade(SND.music, 0.5, 0.3); s.onended = () => { if (SND.voNow === s) { SND.voNow = null; fade(SND.music, 1, 0.9); } };
  return b.duration;
}
document.addEventListener('visibilitychange', () => { if (!SND.ctx) return; if (document.hidden) SND.ctx.suspend(); else SND.ctx.resume(); });

// ── net: a private room per browser keeps the progress record ─────────────
const NET = { ws: null, tries: 0, replay: [] };
function pid() { try { let id = localStorage.getItem('hf:game:playerId'); if (!id) { id = Math.random().toString(36).slice(2, 10); localStorage.setItem('hf:game:playerId', id); } return id; } catch { return 'guest' + Math.floor(performance.now()); } }
function netConnect() {
  try {
    const id = pid(), proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${proto}//${location.host}/ws/p-${encodeURIComponent(id)}`); NET.ws = ws;
    ws.addEventListener('open', () => {
      NET.tries = 0; ws.send(JSON.stringify({ type: 'join', playerId: id })); ws.send(JSON.stringify({ type: 'reset' }));
      for (const action of NET.replay) ws.send(JSON.stringify({ type: 'action', action }));
    });
    ws.addEventListener('close', () => { if (NET.tries++ < 4) setTimeout(netConnect, 1500 * NET.tries); });
    ws.addEventListener('error', () => {});
  } catch { /* offline play is fine */ }
}
function netSend(action) { NET.replay.push(action); try { if (NET.ws && NET.ws.readyState === 1) NET.ws.send(JSON.stringify({ type: 'action', action })); } catch { /* ignore */ } }
setInterval(() => { try { if (NET.ws && NET.ws.readyState === 1) NET.ws.send('__ping'); } catch { /* ignore */ } }, 30000);

// ── input: keyboard + touch stick + drag look + gamepad ───────────────────
const input = { jx: 0, jy: 0, joyId: null, lookId: null, jox: 0, joy: 0, lx: 0, ly: 0, lastLook: -9, padA: false, padY: false };
const keys = new Set();
const typing = () => document.activeElement && /TEXTAREA|INPUT/.test(document.activeElement.tagName);
const joyEl = $('#joy'), knobEl = $('#knob');
function endJoy() { input.joyId = null; input.jx = input.jy = 0; joyEl.hidden = true; }
function dropInput() { keys.clear(); endJoy(); input.lookId = null; }
addEventListener('blur', dropInput);
addEventListener('keydown', (e) => {
  if (typing()) return;
  if (e.code === 'Escape' || e.code === 'KeyP') { togglePause(); return; }
  if (G.paused) return;
  keys.add(e.code);
  if (G.phase === 'intro') { skipIntro(); return; }
  if (e.code === 'Space' || e.code === 'Enter' || e.code === 'KeyE') { pressAction(); e.preventDefault(); }
  if (e.code === 'KeyF' && !e.repeat) setAuto(!AUTO.on, true);
  if (e.code.startsWith('Arrow')) e.preventDefault();
});
addEventListener('keyup', (e) => keys.delete(e.code));
canvas.addEventListener('pointerdown', (e) => {
  if (G.phase === 'intro') { skipIntro(); return; }
  if (ACT.on && horn && horn.visible) { V1.copy(horn.position).project(camera); const sx = (V1.x * 0.5 + 0.5) * innerWidth, sy = (-V1.y * 0.5 + 0.5) * innerHeight; if (V1.z < 1 && Math.hypot(sx - e.clientX, sy - e.clientY) < 96) { pressAction(); return; } }
  if (e.pointerType === 'touch' && e.clientX < innerWidth * 0.5 && input.joyId === null) {
    input.joyId = e.pointerId; input.jox = e.clientX; input.joy = e.clientY; joyEl.hidden = false; joyEl.style.left = e.clientX + 'px'; joyEl.style.top = e.clientY + 'px'; knobEl.style.transform = 'translate(0px,0px)';
  } else if (input.lookId === null) { input.lookId = e.pointerId; input.lx = e.clientX; input.ly = e.clientY; }
  try { canvas.setPointerCapture(e.pointerId); } catch { /* ignore */ }
});
canvas.addEventListener('pointermove', (e) => {
  if (e.pointerId === input.joyId) {
    let dx = e.clientX - input.jox, dy = e.clientY - input.joy; const d = Math.hypot(dx, dy), m = 54; if (d > m) { dx *= m / d; dy *= m / d; }
    input.jx = dx / m; input.jy = -dy / m; knobEl.style.transform = `translate(${dx}px,${dy}px)`;
  } else if (e.pointerId === input.lookId) {
    CAM.yaw -= (e.clientX - input.lx) * 0.0056; CAM.pitch = clamp(CAM.pitch + (e.clientY - input.ly) * 0.004, SET.fp ? -0.6 : 0.06, 0.95); input.lx = e.clientX; input.ly = e.clientY; input.lastLook = G.now;
  }
});
function pointerEnd(e) { if (e.pointerId === input.joyId) endJoy(); if (e.pointerId === input.lookId) input.lookId = null; }
canvas.addEventListener('pointerup', pointerEnd); canvas.addEventListener('pointercancel', pointerEnd);
const AX = { x: 0, y: 0 };
function readAxes() {
  let x = input.jx, y = input.jy;
  if (keys.has('KeyA') || keys.has('ArrowLeft')) x -= 1; if (keys.has('KeyD') || keys.has('ArrowRight')) x += 1;
  if (keys.has('KeyW') || keys.has('ArrowUp')) y += 1; if (keys.has('KeyS') || keys.has('ArrowDown')) y -= 1;
  const pads = navigator.getGamepads ? navigator.getGamepads() : []; let a = false, yb = false;
  for (const gp of pads) {
    if (!gp) continue; const dz = (v) => (Math.abs(v) > 0.18 ? v : 0); x += dz(gp.axes[0] || 0); y -= dz(gp.axes[1] || 0);
    const lx = dz(gp.axes[2] || 0); if (lx) { CAM.yaw -= lx * 0.04; input.lastLook = G.now; }
    if (gp.buttons[0] && gp.buttons[0].pressed) a = true; if (gp.buttons[3] && gp.buttons[3].pressed) yb = true;
  }
  if (a && !input.padA) pressAction(); input.padA = a; if (yb && !input.padY) setAuto(!AUTO.on, true); input.padY = yb;
  const l = Math.hypot(x, y); if (l > 1) { x /= l; y /= l; }
  AX.x = x; AX.y = y;
}

// ── HUD helpers ────────────────────────────────────────────────────────────
const subsEl = $('#subs'); let subsOff = 0;
function say(key, sec = 5.5) { // subtitle + narration; key is a line id (or raw text)
  const dur = STR.lines[key] ? speak(key) : 0;
  subsEl.textContent = STR.lines[key] || key; subsEl.classList.add('on'); $('#subBand').classList.add('on'); subsOff = G.now + Math.max(sec, dur + 1.3);
}
const dots = [...document.querySelectorAll('#dots i')], lamps = [...document.querySelectorAll('#days i')];
function sceneCard(n) {
  const s = STR.stages[n], el = $('#scard'); $('#scardNo').textContent = s.no; $('#scardName').textContent = s.name; el.classList.add('on');
  clearTimeout(sceneCard.t); sceneCard.t = setTimeout(() => el.classList.remove('on'), 2900);
}
function setStage(n, quiet) {
  G.stage = n; const s = STR.stages[n]; $('#chipNo').textContent = s.no; $('#chipName').textContent = s.name; $('#goal').textContent = s.goal;
  dots.forEach((d, i) => d.classList.toggle('on', i < n));
  $('#days').hidden = n !== 3; document.body.classList.toggle('march', n === 3);
  if (!quiet) { sceneCard(n); if (n > 1) netSend({ type: 'advance', to: n }); }
  if (n >= 2 && n <= 5) store('jericho:save', { stage: n, fear: G.fear ? G.fear.id : null, day: G.day, easy: AUTO.easy });
}
function setLamps() { lamps.forEach((l, i) => l.classList.toggle('on', i < G.day)); $('#days b').textContent = STR.dayNames[Math.min(G.day, 6)]; }
function setAuto(on, byUser) {
  if (on && (!G.target || G.phase !== 'play')) on = false;
  AUTO.on = on; if (byUser) AUTO.want = on; $('#auto').classList.toggle('on', on); $('#auto').classList.remove('nudge');
  if (on && byUser) { hideHint(); buzz(15); }
}
function cine(on) { document.body.classList.toggle('cine', on); }
const ACT = { on: false, t: 0, going: false, done: null };
function showAction(done) { ACT.on = true; ACT.t = 0; ACT.going = false; ACT.done = done; ACT.nag = G.now + 15; $('#act').hidden = false; $('#auto').hidden = true; $('#act').style.setProperty('--p', 0); document.body.classList.add('acting'); }
function hideAction() { ACT.on = false; ACT.going = false; $('#act').hidden = true; document.body.classList.remove('acting'); }
function pressAction() { if (!ACT.on || ACT.going || G.phase !== 'play') return; ACT.going = true; ACT.snd = play('shofar', 1); $('#act').classList.add('held'); buzz([40, 30, 200]); }
function updateAction(dt) {
  if (ACT.on && !ACT.going && G.phase === 'play' && G.now > ACT.nag) { ACT.nag = G.now + 15; say('blow', 6); } // a gentle reminder if the horn waits
  if (!ACT.on || !ACT.going) return; ACT.t += dt;
  $('#act').style.setProperty('--p', clamp(ACT.t / CFG.blowSeconds, 0, 1));
  if (ACT.t >= CFG.blowSeconds) { const f = ACT.done; hideAction(); $('#act').classList.remove('held'); f(); }
}
function showHint(text) { $('#hintText').textContent = text; $('#hint').classList.remove('off'); }
function hideHint() { $('#hint').classList.add('off'); }
