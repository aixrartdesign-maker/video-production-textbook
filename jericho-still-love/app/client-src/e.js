
// ── quality tiers ──────────────────────────────────────────────────────────
const QL = { tier: 'high', acc: 0, n: 0 };
function pickTier() { if (SET.quality === 'high' || SET.quality === 'low') return SET.quality; const mem = navigator.deviceMemory || 4, cores = navigator.hardwareConcurrency || 4; return COARSE && (mem <= 3 || cores <= 4) ? 'low' : 'high'; }
function applyQuality(tier) {
  QL.tier = tier; const hi = tier === 'high';
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, hi ? 2 : 1.25));
  if (renderer.shadowMap.enabled !== hi) { renderer.shadowMap.enabled = hi; sun.castShadow = hi; scene.traverse((o) => { if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => { m.needsUpdate = true; }); }); }
  for (const d of DENS) d.im.count = hi ? d.hi : d.lo;
  DUST.pts.geometry.setDrawRange(0, hi ? DUST.n : 190);
  if (COMP.some((c) => c.on)) showCompanions(false);
  resize();
}
function resize() { const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.fov = w < h ? 72 : 56; camera.updateProjectionMatrix(); }
addEventListener('resize', resize);

// ── scene flow ─────────────────────────────────────────────────────────────
const SAVE = (() => { const s = qs.get('stage') ? { stage: Number(qs.get('stage')), fear: qs.get('fear'), day: Number(qs.get('day')) || 0, easy: qs.has('easy') } : load('jericho:save'); return s && s.stage >= 2 && s.stage <= 5 ? s : null; })();
function resumePlay() { G.phase = 'play'; if (AUTO.want && G.target) setAuto(true); }
function begin(mode) {
  startAudio(); const save = mode === 'resume' ? SAVE : null;
  AUTO.easy = save ? !!save.easy : mode === 'easy'; AUTO.want = AUTO.easy;
  $('#title').style.opacity = 0; setTimeout(() => { $('#title').hidden = true; }, 1100);
  $('#hud').hidden = false; $('#auto').hidden = false;
  LOOPS.fear = mkLoop('m_fear', 0.8, SND.music); LOOPS.steps = mkLoop('steps', 0, null, HERO.steps ? clamp((HERO.steps * HERO.stride * 60) / 165, 0.75, 1.15) : 1); // the recording steps about 165 times a minute LOOPS.river = mkLoop('river', 0); LOOPS.fire = mkLoop('fire', 0);
  if (save) resumeAt(save); else { drop('jericho:save'); G.phase = 'intro'; G.intro = 0; cine(true); $('#skipHint').hidden = false; later(1.3, () => { if (G.phase === 'intro') say('intro', 6); }); }
  netConnect();
}
function skipIntro() { if (G.phase === 'intro' && G.intro > 0.7) G.intro = 99; }
function endIntro() {
  cine(false); $('#skipHint').hidden = true; G.phase = 'play'; setStage(1); setTarget({ x: 0, z: CFG.riverZ0 - 6 });
  if (AUTO.easy) later(1.4, () => { setAuto(true); say('gauto', 5); showHint(COARSE ? STR.hintEasyTouch : STR.hintEasyKeys); later(10, hideHint); });
  else { showHint(COARSE ? STR.hintTouch : STR.hintKeys); later(4.5, () => { if (!G.movedOnce && G.phase === 'play') say('guide', 5); }); }
  later(13, () => warpHint(1));
}
function onReach() {
  if (G.stage === 1) { say('crossed', 6); setStage(2); setTarget({ x: CFG.cx, z: CFG.cz + CFG.beaconR }); later(7.4, () => { if (G.stage === 2 && G.phase === 'play') say('face', 7); }); }
  else if (G.stage === 2) { G.phase = 'modal'; dropInput(); setTarget(null); $('#choose').hidden = false; say('choose', 4); }
  else if (G.stage === 3) reachDay();
  else if (G.stage === 5) atCairn();
  else if (G.stage === 6) ending();
}
// ── straight to the light: for anyone who would rather not walk the whole way ──
const JUMP = { busy: false };
function hitLight(sx, sy) { // is this tap on the pillar of light the player follows?
  if (!G.target || !beacon.visible || G.phase !== 'play') return false;
  const t = G.target, by = beacon.position.y, pad = Math.max(42, Math.min(innerWidth, innerHeight) * 0.075); let best = Infinity;
  for (let i = 0; i <= 14; i++) {
    V1.set(t.x, by + 0.3 + i * 2.2, t.z).project(camera); if (V1.z > 1 || V1.z < -1) continue;
    best = Math.min(best, Math.hypot((V1.x * 0.5 + 0.5) * innerWidth - sx, (-V1.y * 0.5 + 0.5) * innerHeight - sy));
  }
  return best < pad;
}
function jumpToLight() {
  const t = G.target; if (JUMP.busy || G.paused || G.phase !== 'play' || !t || ACT.on) return false;
  const reach = t.r || CFG.reach; if (Math.hypot(t.x - P.x, t.z - P.z) < reach + 1.5) return false; // already there
  JUMP.busy = true; dropInput(); buzz(20); hideHint(); const fx = $('#warpFx'); fx.classList.add('on');
  setTimeout(() => {
    if (G.phase === 'play' && G.target === t && !G.paused) {
      const rg = ringGuide(), r = reach - 0.5; // stand just inside the ring, on the side the walk would have come from
      if (rg) { const a = Math.atan2(t.x - CFG.cx, t.z - CFG.cz) - Math.sign(rg.d) * (r / CFG.beaconR); P.x = CFG.cx + Math.sin(a) * CFG.beaconR; P.z = CFG.cz + Math.cos(a) * CFG.beaconR; }
      else { const dx = t.x - P.x, dz = t.z - P.z, d = Math.hypot(dx, dz) || 1; P.x = t.x - (dx / d) * r; P.z = t.z - (dz / d) * r; }
      const ux = t.x - P.x, uz = t.z - P.z; P.heading = Math.atan2(ux, uz); CAM.yaw = Math.atan2(-ux, -uz); CAM.pitch = CFG.camPitch; input.lastLook = -9;
      P.y = groundY(P.x, P.z); P.step = 0; hero.position.set(P.x, P.y, P.z); hero.rotation.y = P.heading; TRAIL.length = 0; G.progT = G.now; G.progD = 1e9; G.jumps = (G.jumps || 0) + 1;
      if (COMP.some((c) => c.on)) showCompanions(true);
    }
    fx.classList.remove('on'); JUMP.busy = false;
  }, 240);
  return true;
}
function warpHint(stage) { if (G.phase === 'play' && G.stage === stage && G.target && !G.jumps) { showHint(STR.hintWarp); later(9, hideHint); } } // the short cut, said once per stretch until it is used
function pickFear(f) {
  G.fear = f; netSend({ type: 'fear', value: f.id }); drawWord(f.label); $('#choose').hidden = true;
  G.day = 0; TRAIL.length = 0; setStage(3); setLamps(); resumePlay(); setTarget(beaconPos(1)); say('march', 8); later(10, () => warpHint(3));
}
function reachDay() {
  G.day++; const d = G.day; netSend({ type: 'day', n: d }); setLamps(); store('jericho:save', { stage: 3, fear: G.fear.id, day: d, easy: AUTO.easy });
  if (M.flower) FL.start[d - 1] = G.now + 0.5;
  setTarget(null); G.phase = 'beat'; dropInput(); drum(0.8); buzz(25);
  if (d === 7) {
    say('d7', 5); fade(LOOPS.fear, 0.1, 2.5);
    later(4.4, () => { setStage(4); resumePlay(); if (horn) { horn.visible = true; horn.position.set(P.x, P.y + 1.6, P.z - 1.5); } later(2.4, () => { if (G.stage === 4 && !G.collapsed) { showAction(startCollapse); say('blow', 6); } }); });
    return;
  }
  cine(true); $('#nightText').textContent = STR.dayNames[d - 1]; $('#night').classList.add('on'); play('chime', 0.45);
  later(0.6, () => say('d' + d, 4.4));
  later(3.7, () => $('#night').classList.remove('on'));
  if (d === 4) {
    later(1.8, () => showCompanions(true));
    later(3.9, () => { G.ov = { yaw: P.heading, pitch: 0.2, dist: 8, lookY: 1.5, back: CAM.yaw }; });
    later(7.8, () => { G.ov = { yaw: G.ov.back, pitch: CFG.camPitch, dist: CFG.camDist, lookY: 2 }; });
    later(9.1, () => { G.ov = null; cine(false); resumePlay(); setTarget(beaconPos(d + 1)); });
  } else later(4.7, () => { cine(false); resumePlay(); setTarget(beaconPos(d + 1)); });
}
function openCity() { // what the fallen wall reveals
  if (M.house) M.house.visible = true; if (M.cairn) M.cairn.visible = true;
  (WORLD.houseSpots || []).forEach((p) => COL.push({ x: p[0], z: p[1], r: 3.2 * p[3] })); COL.push({ x: CFG.cx, z: CFG.cz, r: 1.45 });
}
function startCollapse() {
  if (G.collapsed) return; G.collapsed = true; G.phase = 'cine'; G.tCol = G.now; setTarget(null); dropInput(); cine(true); $('#goal').textContent = '';
  W.active = true; W.t = 0; GATE.t = 0; wordPlane.visible = false; G.shake = 1; startDust(); later(1.6, () => { WORLD.gateProps.visible = false; }); buzz([80, 40, 300, 60, 500]);
  if (!CALM) { G.slow = 0.4; later(0.55, () => { G.slow = 1; }); }
  const fl = $('#flash'); fl.style.transition = 'none'; fl.style.opacity = 0.7; requestAnimationFrame(() => requestAnimationFrame(() => { fl.style.transition = 'opacity 2.4s'; fl.style.opacity = 0; }));
  play('shout', 0.9); play('collapse', 1); later(1.5, () => play('collapse', 0.9)); later(3.2, () => play('collapse', 0.55));
  G.hopeStart = G.now + 2; fade(LOOPS.fear, 0, 4); LOOPS.hope = mkLoop('m_hope', 0, SND.music); later(2.6, () => fade(LOOPS.hope, 0.85, 6));
  LOOPS.birds = mkLoop('birds', 0); later(7, () => fade(LOOPS.birds, 0.45, 5));
  for (let i = 0; i < RB.n; i++) RB.start[i] = G.now + 1.4 + R() * 2.8;
  for (let i = 17; i < FL.n; i++) FL.start[i] = G.now + 3.4 + R() * 6.5;
  G.cheer = true; later(8, () => { G.cheer = false; });
  G.ov = { yaw: Math.atan2(P.x - CFG.cx, P.z - CFG.cz), pitch: 0.17, dist: 26, lookY: 13.5 };
  later(5.6, () => { if (G.ov && G.phase === 'cine') G.ov = { yaw: G.ov.yaw, pitch: 0.2, dist: 13, lookY: 4.4 }; }); // as the dust settles, come back down to the people
  later(3.6, openCity); later(4, () => { play('chime', 0.6); if (horn) horn.visible = false; }); later(6.5, () => play('chime', 0.5)); later(8.5, flyBirds);
  later(3.2, () => say('fallen1', 4)); later(8, () => say('fallen2', 6));
  later(14, () => { G.ov = null; cine(false); setStage(5); resumePlay(); setTarget({ x: CFG.cx, z: CFG.cz + 3.6, r: 1.5 }); say('reflect', 7); });
}
function fastCollapse() { // resume after the fall: settle everything at once
  G.collapsed = true; wordPlane.visible = false; W.active = true; W.t = 0; GATE.t = 0; let guard = 0;
  while ((W.active || GATE.t < 2) && guard++ < 4000) updateWall(1 / 30);
  G.shake = 0; G.hope = 1; G.hopeStart = -100; WORLD.gateProps.visible = false; applyMood(1); openCity();
  for (let i = 0; i < RB.n; i++) RB.start[i] = -10; for (let i = 17; i < FL.n; i++) FL.start[i] = -10;
  if (WORLD.citadel) WORLD.citadel.visible = false;
  fade(LOOPS.fear, 0, 0.5); LOOPS.hope = mkLoop('m_hope', 0.85, SND.music); LOOPS.birds = mkLoop('birds', 0.45);
}
function resumeAt(s) {
  const st = clamp(s.stage | 0, 2, 5), f = FEARS.find((x) => x.id === s.fear) || FEARS[0], rp = (a) => NET.replay.push(a);
  NET.replay.length = 0; rp({ type: 'advance', to: 2 }); cine(false); G.phase = 'play'; G.movedOnce = true;
  if (st === 2) { P.x = 0; P.z = CFG.riverZ0 - 6; setStage(2, true); sceneCard(2); setTarget({ x: CFG.cx, z: CFG.cz + CFG.beaconR }); if (AUTO.want) setAuto(true); return; }
  G.fear = f; drawWord(f.label); rp({ type: 'fear', value: f.id }); rp({ type: 'advance', to: 3 });
  const day = st === 3 ? clamp(s.day | 0, 0, 6) : 7; G.day = day;
  for (let n = 1; n <= day; n++) { rp({ type: 'day', n }); if (M.flower) FL.start[n - 1] = -10; }
  const a1 = ((day % 7) * TAU) / 7 + (day === 7 ? TAU : 0), a0 = a1 - TAU / 7; TRAIL.length = 0;
  for (let i = 0; i <= 24; i++) { const a = a0 + ((a1 - a0) * i) / 24; TRAIL.push({ x: CFG.cx + Math.sin(a) * CFG.beaconR, z: CFG.cz + Math.cos(a) * CFG.beaconR }); }
  P.x = CFG.cx + Math.sin(a1) * CFG.beaconR; P.z = CFG.cz + Math.cos(a1) * CFG.beaconR; P.heading = a1 + Math.PI / 2; CAM.yaw = P.heading + Math.PI;
  if (day >= 4) showCompanions(true);
  if (st === 3) { setStage(3, true); sceneCard(3); setLamps(); setTarget(beaconPos(day + 1)); }
  else {
    rp({ type: 'advance', to: 4 }); P.heading = Math.PI; CAM.yaw = 0;
    if (st === 4) { setStage(4, true); sceneCard(4); fade(LOOPS.fear, 0.1, 1); if (horn) { horn.visible = true; horn.position.set(P.x, groundY(P.x, P.z) + 1.6, P.z - 1.5); } later(1.2, () => { showAction(startCollapse); say('blow', 6); }); }
    else { rp({ type: 'advance', to: 5 }); fastCollapse(); setStage(5, true); sceneCard(5); setTarget({ x: CFG.cx, z: CFG.cz + 3.6, r: 1.5 }); later(1.5, () => say('reflect', 7)); }
  }
  if (AUTO.want) setAuto(true);
}
function atCairn() {
  setTarget(null); G.phase = 'cine'; dropInput(); cine(true); G.kneel = true; HERO.kneelGoal = HERO.kneelT;
  G.face = Math.atan2(CFG.cx - P.x, CFG.cz - P.z); G.ov = { yaw: G.face + Math.PI - 0.8, pitch: 0.22, dist: 5.8, lookY: 1.25 };
  say('cairn', 6); later(5, () => { G.phase = 'modal'; $('#write').hidden = false; });
}
function closeWrite(text) {
  G.note = (text || '').trim().slice(0, 60); if (G.note) netSend({ type: 'note' });
  $('#write').hidden = true; G.phase = 'cine'; WORLD.stone.visible = true; WORLD.stone.userData.t = G.now; play('chime', 0.7); drum(0.5); buzz(30);
  for (let i = 7; i < 17; i++) FL.start[i] = G.now + 0.7 + (i - 7) * 0.13;
  later(1.6, () => { HERO.kneelGoal = HERO.act.Kneel ? HERO.act.Kneel.getClip().duration : 0; });
  later(3.8, () => { G.kneel = false; setStage(6); drop('jericho:save'); const shot = snapshot(1080, 440); (document.fonts && document.fonts.load ? document.fonts.load('800 72px "JM"').catch(() => {}) : Promise.resolve()).then(() => { drawCard(shot); G.phase = 'modal'; $('#card').hidden = false; play('chime', 0.6); }); });
}
function goOn() {
  $('#card').hidden = true; if (G.ended) return;
  cine(false); G.ov = null; resumePlay(); setTarget({ x: CFG.cx, z: CFG.endZ }); say('again', 7);
}
function ending() {
  if (G.ended) return; G.ended = true; setTarget(null); G.phase = 'end'; dropInput(); AUTO.want = false; setAuto(false);
  $('#fade').classList.add('on'); $('#roam').textContent = STR.close;
  later(2.9, () => { $('#end').hidden = false; requestAnimationFrame(() => requestAnimationFrame(() => $('#end').classList.add('on'))); $('#hud').hidden = true; speak('ending'); fade(LOOPS.steps, 0, 0.5); G.frozen = true; });
}
function togglePause() {
  if (G.phase === 'title' || G.phase === 'end' || G.phase === 'modal') return;
  G.paused = !G.paused; $('#pause').hidden = !G.paused; dropInput(); if (SND.ctx) { if (G.paused) SND.ctx.suspend(); else SND.ctx.resume(); }
}

// ── message card ───────────────────────────────────────────────────────────
function snapshot(w, h) { // a still of this moment for the card
  const cam = new THREE.PerspectiveCamera(46, w / h, 0.3, 700), fx = Math.sin(G.face || Math.PI), fz = Math.cos(G.face || Math.PI);
  cam.position.set(P.x - fx * 7.5 + fz * 2.6, P.y + 2.3, P.z - fz * 7.5 - fx * 2.6); cam.lookAt(P.x + fx * 14, P.y + 2.6, P.z + fz * 14);
  const pr = renderer.getPixelRatio(), size = renderer.getSize(new THREE.Vector2()), cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  try { renderer.setPixelRatio(1); renderer.setSize(w, h, false); renderer.render(scene, cam); cv.getContext('2d').drawImage(renderer.domElement, 0, 0, w, h); } catch { /* card works without it */ }
  renderer.setPixelRatio(pr); renderer.setSize(size.x, size.y, false); renderer.render(scene, camera); return cv;
}
function wrap(c, text, maxW) {
  const out = []; let line = '';
  for (const word of text.split(' ')) {
    const tryLine = line ? line + ' ' + word : word;
    if (c.measureText(tryLine).width <= maxW) { line = tryLine; continue; }
    if (line) out.push(line); line = '';
    for (const ch of word) { if (c.measureText(line + ch).width > maxW && line) { out.push(line); line = ch; } else line += ch; }
  }
  if (line) out.push(line); return out;
}
function drawCard(shot) {
  const cv = $('#cardCanvas'), c = cv.getContext('2d'), w = cv.width, h = cv.height, f = G.fear || FEARS[0];
  const serif = '"JM","Noto Serif KR","AppleMyungjo","Batang",serif', sans = '"Pretendard","Apple SD Gothic Neo","Noto Sans KR","Malgun Gothic",sans-serif';
  const bg = c.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, '#efe6d2'); bg.addColorStop(1, '#e3d5b6'); c.fillStyle = bg; c.fillRect(0, 0, w, h);
  if (shot) { c.drawImage(shot, 0, 0, w, 440); const g = c.createLinearGradient(0, 300, 0, 442); g.addColorStop(0, 'rgba(239,230,210,0)'); g.addColorStop(1, '#eee4cf'); c.fillStyle = g; c.fillRect(0, 300, w, 142); }
  c.strokeStyle = '#c9a24a'; c.lineWidth = 3; c.strokeRect(36, 36, w - 72, h - 72);
  c.textAlign = 'center'; c.fillStyle = '#9a7b2f'; c.font = `600 24px ${sans}`; c.fillText(STR.cardTop, w / 2, 506);
  c.fillStyle = '#2a241c'; c.font = `800 74px ${serif}`; c.fillText(STR.cardTitle[0], w / 2, 598); c.fillText(STR.cardTitle[1], w / 2, 686);
  const rr = rng(f.id.length * 97 + 3);
  for (let i = 0; i < 22; i++) { const x = 150 + rr() * (w - 300), y = 722 + rr() * 30, r = 5 + rr() * 7; c.fillStyle = rr() < 0.5 ? '#e3b857' : '#fffaf0'; for (let p = 0; p < 5; p++) { const a = (p / 5) * TAU; c.beginPath(); c.arc(x + Math.cos(a) * r, y + Math.sin(a) * r, r * 0.62, 0, TAU); c.fill(); } c.fillStyle = '#c98f2b'; c.beginPath(); c.arc(x, y, r * 0.45, 0, TAU); c.fill(); }
  c.fillStyle = '#7a756f'; c.font = `500 30px ${sans}`; c.fillText(STR.cardMine, w / 2, 812);
  c.fillStyle = '#2a241c'; c.font = `800 96px ${serif}`; c.fillText(f.label, w / 2, 912);
  c.fillStyle = '#2a241c'; c.font = `400 38px ${serif}`; let y = 990; for (const ln of wrap(c, f.msg, w - 220)) { c.fillText(ln, w / 2, y); y += 54; }
  c.fillStyle = '#9a7b2f'; c.font = `500 28px ${sans}`; c.fillText(f.ref, w / 2, y); y += 58;
  if (G.note) { c.fillStyle = '#4a4238'; c.font = `500 31px ${sans}`; for (const ln of wrap(c, `“${G.note}”`, w - 240).slice(0, 2)) { c.fillText(ln, w / 2, y); y += 44; } }
  c.fillStyle = '#2a241c'; c.font = `800 29px ${serif}`; c.fillText(STR.cardCore, w / 2, h - 118);
  c.fillStyle = '#6b655c'; c.font = `500 24px ${sans}`; c.fillText(STR.cardWho, w / 2, h - 72);
}
function saveCard() {
  $('#cardCanvas').toBlob(async (blob) => {
    if (!blob) return; const file = new File([blob], 'jericho-card.png', { type: 'image/png' });
    try { if (COARSE && navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: document.title }); return; } } catch { /* fall through to download */ }
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'jericho-card.png'; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }, 'image/png');
}
