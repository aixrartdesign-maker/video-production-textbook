
// ── per-frame simulation ───────────────────────────────────────────────────
function constrain(px, pz) {
  const bx = P.x, bz = P.z - CFG.wz, bd = Math.hypot(bx, bz); if (bd > CFG.wr) { P.x = (bx / bd) * CFG.wr; P.z = CFG.wz + (bz / bd) * CFG.wr; }
  if (P.z > CFG.riverZ0 && P.z < CFG.riverZ1 && Math.abs(P.x) > CFG.pathHalf) { // the river: only the dry path crosses
    if (Math.abs(px) <= CFG.pathHalf + 0.001 && pz > CFG.riverZ0 && pz < CFG.riverZ1) P.x = clamp(P.x, -CFG.pathHalf, CFG.pathHalf);
    else P.z = pz >= CFG.riverZ1 ? CFG.riverZ1 : pz <= CFG.riverZ0 ? CFG.riverZ0 : P.z;
  }
  const dx = P.x - CFG.cx, dz = P.z - CFG.cz, r = Math.hypot(dx, dz);
  if (!G.collapsed) { if (r < CFG.keepOut) { const k = CFG.keepOut / (r || 1); P.x = CFG.cx + dx * k; P.z = CFG.cz + dz * k; } }
  else if (r > CFG.wallR - 2.4 && r < CFG.keepOut - 0.4 && Math.abs(dx) > 4.2) { // the ruined ring: only the two roads pass
    if (Math.abs(px - CFG.cx) <= 4.2) P.x = CFG.cx + clamp(dx, -4.2, 4.2);
    else { const to = r > (CFG.wallR + CFG.keepOut) / 2 - 1.4 ? CFG.keepOut - 0.4 : CFG.wallR - 2.4, k = to / r; P.x = CFG.cx + dx * k; P.z = CFG.cz + dz * k; }
  }
  for (const c of COL) { const ex = P.x - c.x, ez = P.z - c.z, d = Math.hypot(ex, ez), min = c.r + 0.35; if (d < min && d > 1e-4) { const k = min / d; P.x = c.x + ex * k; P.z = c.z + ez * k; } }
}
function updateCamera(dt) {
  const ov = G.ov, fp = SET.fp && G.phase === 'play' && !ov;
  if (G.stage === 4 && !G.collapsed && !ov && input.lookId === null && G.now - input.lastLook > 2.5) { // stand before the gate: turn to face what is about to fall
    CAM.yaw = lerpAngle(CAM.yaw, Math.atan2(P.x - CFG.cx, P.z - CFG.cz), 1 - Math.exp(-1.5 * dt)); CAM.pitch = damp(CAM.pitch, 0.1, 1.5, dt);
  }
  G.camDist = damp(G.camDist, fp ? 0.01 : ov ? ov.dist : G.stage === 4 && !G.collapsed ? 11 : CFG.camDist, ov ? 1.6 : G.stage === 4 ? 1.4 : 4, dt);
  G.lookY = damp(G.lookY, ov ? ov.lookY : G.stage === 4 && !G.collapsed ? 4.3 : G.stage === 2 ? 3.6 : 2, 1.6, dt);
  if (ov) { CAM.yaw = lerpAngle(CAM.yaw, ov.yaw, 1 - Math.exp(-1.7 * dt)); CAM.pitch = damp(CAM.pitch, ov.pitch, 1.6, dt); }
  const cp = Math.cos(CAM.pitch), sh = CALM ? 0 : G.shake * G.shake * 0.5;
  G.side = damp(G.side || 0, G.stage === 4 && !G.collapsed && !ov && !fp ? 1.9 * clamp(camera.aspect / 1.6, 0.3, 1) : 0, 2.2, dt); // step aside so the gate, the pilgrim and the horn all show
  const sx = Math.cos(CAM.yaw) * G.side, sz = -Math.sin(CAM.yaw) * G.side;
  let x = P.x + Math.sin(CAM.yaw) * cp * G.camDist, y = P.y + Math.max(0.5, 1.6 + Math.sin(CAM.pitch) * G.camDist), z = P.z + Math.cos(CAM.yaw) * cp * G.camDist;
  if (!G.collapsed) { const dx = x - CFG.cx, dz = z - CFG.cz, r = Math.hypot(dx, dz), min = CFG.keepOut - 0.5; if (r < min) { x = CFG.cx + (dx / (r || 1)) * min; z = CFG.cz + (dz / (r || 1)) * min; } }
  y = Math.max(y, groundY(x, z) + 0.75);
  if (G.shake > 0) G.shake = Math.max(0, G.shake - dt / 6);
  if (HERO.body) HERO.body.visible = G.camDist > 0.9; HERO.blob.visible = QL.tier !== 'high';
  if (G.phase === 'intro') { // a slow descent from above the camp to the pilgrim's shoulder
    const k = smooth(G.intro / 8.2);
    camera.position.set(lerp(P.x + 27, x, k), lerp(23, y, k), lerp(P.z + 17, z, k)); camera.lookAt(lerp(CFG.cx, P.x, k), lerp(9, P.y + G.lookY, k), lerp(CFG.cz + 34, P.z, k)); return;
  }
  if (G.camDist < 0.9) { // first person
    const p = CAM.pitch - 0.22, ey = P.y + 1.62; camera.position.set(P.x, ey, P.z); camera.lookAt(P.x - Math.sin(CAM.yaw) * Math.cos(p), ey - Math.sin(p), P.z - Math.cos(CAM.yaw) * Math.cos(p)); return;
  }
  camera.position.set(x + sx + (Math.random() - 0.5) * sh, y + (Math.random() - 0.5) * sh, z + sz); camera.lookAt(P.x + sx, P.y + G.lookY, P.z + sz);
}
function update(dt) {
  G.now += dt; G.frames++;
  for (let i = timers.length - 1; i >= 0; i--) if (timers[i].t <= G.now) { const f = timers[i].fn; timers.splice(i, 1); f(); }
  readAxes();
  if (G.phase === 'intro') { G.intro += dt; if (G.intro >= 8.2) endIntro(); }
  const px = P.x, pz = P.z; P.moving = false;
  if (G.phase === 'play') {
    const fx = -Math.sin(CAM.yaw), fz = -Math.cos(CAM.yaw), rx = Math.cos(CAM.yaw), rz = -Math.sin(CAM.yaw);
    let mx = fx * AX.y + rx * AX.x, mz = fz * AX.y + rz * AX.x, m = Math.hypot(mx, mz);
    if (m > 0.25 && AUTO.on) setAuto(false, true); // steering by hand takes over
    if (AUTO.on && G.target) { const wp = waypoint(); mx = wp.x - P.x; mz = wp.z - P.z; m = Math.hypot(mx, mz); if (m > 0.05) { mx /= m; mz /= m; m = 1; } else m = 0; }
    if (m > 0.08) {
      const ux = mx / m, uz = mz / m, sp = CFG.speed * Math.min(1, m); P.moving = true;
      P.x += ux * sp * dt; P.z += uz * sp * dt; P.heading = lerpAngle(P.heading, Math.atan2(ux, uz), 1 - Math.exp(-10 * dt));
      if (G.now - input.lastLook > 1.4 && input.lookId === null) { if (AUTO.on) CAM.yaw = lerpAngle(CAM.yaw, Math.atan2(-ux, -uz), 1 - Math.exp(-1.2 * dt)); else if (Math.abs(AX.x) > 0.15) CAM.yaw -= AX.x * 1.2 * dt; }
      constrain(px, pz);
      P.step += Math.hypot(P.x - px, P.z - pz); if (P.step > (HERO.steps ? CFG.speed / (HERO.steps * HERO.stride) : 0.74)) { P.step = 0; stampFoot(); } // one print per step of the clip
      if (!G.movedOnce) { G.movedOnce = true; later(3, hideHint); }
    }
    if (G.target) {
      const dx = G.target.x - P.x, dz = G.target.z - P.z, d = Math.hypot(dx, dz);
      if (G.frames % 5 === 0) {
        const ang = Math.atan2(dx * rx + dz * rz, dx * fx + dz * fz), off = !AUTO.on && Math.abs(ang) > 1.05, tn = $('#turn');
        $('#dist').textContent = Math.round(d) + ' m'; $('#needle svg').style.transform = `rotate(${ang}rad)`;
        tn.hidden = !off; if (off) tn.className = ang > 0 ? 'right' : 'left'; $('#warp').hidden = d < (G.target.r || CFG.reach) + 6;
      }
      if (d < (G.target.r || CFG.reach)) onReach();
      else if (!AUTO.on && !subsOff) { // gentle help when someone seems lost
        if (d < G.progD - 2) { G.progD = d; G.progT = G.now; }
        else if (G.now - G.progT > (G.nag ? 16 : 11)) { G.progT = G.now; G.progD = d; G.nag = (G.nag || 0) + 1; if (G.nag % 2) say('guide', 5); else { say('lost', 6); $('#auto').classList.add('nudge'); } }
      }
    }
  }
  if (G.stage === 4 && !G.collapsed && !P.moving) P.heading = lerpAngle(P.heading, Math.atan2(CFG.cx - P.x, CFG.cz - P.z), 1 - Math.exp(-4 * dt));
  if (G.kneel) P.heading = lerpAngle(P.heading, G.face, 1 - Math.exp(-5 * dt));
  P.state = G.kneel ? 'Kneel' : ACT.going ? 'Horn' : P.moving ? 'Walk' : 'Idle';
  updateAction(dt); heroAnim(dt);
  P.y = damp(P.y, groundY(P.x, P.z), 16, dt); hero.position.set(P.x, P.y, P.z); hero.rotation.y = P.heading;
  updateCompanions(dt);
  if (horn && horn.visible) {
    const fwx = Math.sin(P.heading), fwz = Math.cos(P.heading);
    if (ACT.going && HERO.bones.Head) {
      const hd = HERO.bones.Head.getWorldPosition(V1), ff = HERO.bones.headfront ? HERO.bones.headfront.getWorldPosition(V2) : V2.copy(hd);
      const mx = lerp(hd.x, ff.x, WORLD.mouth[0]) + fwx * WORLD.mouth[2], my = lerp(hd.y, ff.y, WORLD.mouth[1]) + WORLD.mouth[3], mz = lerp(hd.z, ff.z, WORLD.mouth[0]) + fwz * WORLD.mouth[2];
      horn.position.set(mx, my, mz); horn.lookAt(mx + fwx, my + 0.45, mz + fwz);
    } else {
      const k = 1 - Math.exp(-5 * dt); horn.position.x = lerp(horn.position.x, P.x + fwx * 1.5, k); horn.position.y = lerp(horn.position.y, P.y + 1.62 + Math.sin(G.now * 2) * 0.1, k); horn.position.z = lerp(horn.position.z, P.z + fwz * 1.5, k);
      horn.rotation.set(0.35, G.now * 1.1, 0);
    }
  }
  updateWall(dt); updateDust(dt); updateBloom(M.flower, FL); updateBloom(M.rubble, RB); updateChevrons(); updateSky(dt);
  const ct = WORLD.citadel; if (ct && ct.visible && G.collapsed) { const k = clamp((G.now - G.tCol - 0.9) / 4.8, 0, 1); ct.position.y = -k * k * 48; ct.rotation.z = k * 0.06; ct.rotation.x = -k * 0.04; if (k >= 1) ct.visible = false; }
  const st = WORLD.stone; if (st && st.visible) { const k = clamp((G.now - st.userData.t) / 0.7, 0, 1); st.scale.setScalar(Math.max(easeOutBack(k), 0.01)); st.position.y = WORLD.stoneY + (1 - k) * 0.9; st.material.emissiveIntensity = lerp(1.6, 0.35, clamp((G.now - st.userData.t) / 3, 0, 1)); }
  if (WORLD.fires) WORLD.fires.forEach((f, i) => { if (f.visible) f.scale.setScalar(f.userData.s * (0.88 + 0.16 * Math.sin(G.now * 12 + i * 2) + 0.08 * Math.sin(G.now * 29 + i))); });
  if (WORLD.fireLight) WORLD.fireLight.intensity = 15 * (0.85 + 0.25 * Math.sin(G.now * 11) + 0.1 * Math.sin(G.now * 27));
  if (G.hope < 1 && G.now > G.hopeStart) { G.hope = Math.min(1, (G.now - G.hopeStart) / 8); applyMood(smooth(G.hope)); }
  if (subsOff && G.now > subsOff) { subsEl.classList.remove('on'); $('#subBand').classList.remove('on'); subsOff = 0; }
  const pulse = 1 + Math.sin(G.now * 3) * 0.08; beacon.userData.ring.scale.set(pulse, pulse, 1);
  if (G.target) beacon.userData.beam.material.opacity = 0.42 * clamp((Math.hypot(G.target.x - P.x, G.target.z - P.z) - 3) / 14, 0.14, 1);
  updateCamera(dt);
  sun.target.position.set(P.x, 0, P.z - 4); sun.position.copy(sun.target.position).addScaledVector(SUNDIR, 130);
  if (SND.ctx) {
    if (LOOPS.steps) LOOPS.steps.gain.value = damp(LOOPS.steps.gain.value, P.moving ? 0.5 : 0, 12, dt);
    if (LOOPS.river) LOOPS.river.gain.value = clamp(1 - Math.abs(P.z - 58) / 34, 0, 1) * 0.65;
    if (LOOPS.fire && WORLD.campfire) LOOPS.fire.gain.value = clamp(1 - Math.hypot(P.x - WORLD.campfire.x, P.z - WORLD.campfire.z) / 24, 0, 1) * 0.6;
    if (LOOPS.wind) LOOPS.wind.gain.value = (0.05 + 0.03 * Math.sin(G.now * 0.23) + 0.02 * Math.sin(G.now * 0.71)) * lerp(1.5, 0.6, G.hope);
  }
}
let last = performance.now(), fpsN = 0, fpsT = 0;
function frame(t) {
  requestAnimationFrame(frame);
  const raw = Math.min(0.05, (t - last) / 1000); last = t;
  if (G.frozen || document.hidden) return;
  if (!G.lab && !G.paused) for (let i = 0; i < TS; i++) update(raw * G.slow);
  renderer.render(scene, camera);
  if (SET.quality === 'auto' && QL.tier === 'high' && G.phase === 'play' && !G.paused) { QL.acc += raw; if (++QL.n >= 220) { if (QL.acc / QL.n > 1 / 26) applyQuality('low'); QL.acc = 0; QL.n = 0; } }
  if (DEBUG) { fpsN++; fpsT += raw; if (fpsT >= 0.5) { $('#fps').hidden = false; $('#fps').textContent = `${Math.round(fpsN / fpsT)} fps ${QL.tier}\n${renderer.info.render.calls} calls\n${renderer.info.render.triangles} tris\nstage ${G.stage} ${G.phase}${AUTO.on ? ' auto' : ''}`; fpsN = 0; fpsT = 0; } }
}

// ── model lab (?lab): every generated model on a grid with axes ───────────
function lab(g) {
  $('#title').hidden = true; scene.fog = null; scene.background = new THREE.Color(0x8f98a3); WORLD.skyFear.visible = false; WORLD.skyHope.visible = false;
  const Y = 400; let i = 0;
  for (const n of Object.keys(g)) {
    const m = g[n]; if (!m) continue; const root = m.scene; root.traverse((o) => { if (o.isMesh) { fixMat(o.material); o.frustumCulled = false; } }); root.updateMatrixWorld(true);
    const b = new THREE.Box3().setFromObject(root), s = b.getSize(new THREE.Vector3()), c = b.getCenter(new THREE.Vector3()), k = 2.3 / Math.max(s.x, s.y, s.z);
    const holder = new THREE.Group(); root.position.sub(c); root.position.y += s.y / 2; holder.add(root); holder.scale.setScalar(k); holder.position.set((i % 5) * 3.3, Y, Math.floor(i / 5) * 3.6); scene.add(holder);
    const ax = new THREE.AxesHelper(1.5); ax.position.copy(holder.position); ax.position.y += 0.01; scene.add(ax); i++;
  }
  resize(); camera.fov = 40; camera.updateProjectionMatrix();
  if (qs.get('v') === '1') camera.position.set(6.6 - 12, Y + 6, 3.6 + 14); else camera.position.set(6.6 + 9, Y + 9, 3.6 + 15);
  camera.lookAt(6.6, Y + 1, 3.6); G.lab = true;
}

// ── wire up UI, then load ──────────────────────────────────────────────────
function applyText() { document.documentElement.style.setProperty('--ts', SET.big ? 1.28 : 1); }
function buildOptions() {
  const box = $('#opts'); box.textContent = '';
  const row = (label, text, on, fn) => { const r = document.createElement('div'); r.className = 'opt'; const l = document.createElement('span'); l.textContent = label; const b = document.createElement('button'); b.type = 'button'; b.textContent = text; b.classList.toggle('on', on); b.addEventListener('click', () => { fn(); store('jericho:set', SET); buildOptions(); }); r.append(l, b); box.append(r); };
  const tog = (key, label, after) => row(STR[label], SET[key] ? STR.on : STR.off, !!SET[key], () => { SET[key] = !SET[key]; if (after) after(); });
  tog('sound', 'optSound', () => { if (SND.master) SND.master.gain.value = SET.sound ? 0.9 : 0; });
  tog('voice', 'optVoice', () => { if (!SET.voice && SND.voNow) { try { SND.voNow.stop(); } catch { /* ended */ } } });
  tog('big', 'optBig', applyText);
  row(STR.optView, SET.fp ? STR.v1 : STR.v3, !!SET.fp, () => { SET.fp = !SET.fp; });
  row(STR.optQuality, STR['q' + SET.quality], SET.quality !== 'auto', () => { SET.quality = SET.quality === 'auto' ? 'high' : SET.quality === 'high' ? 'low' : 'auto'; applyQuality(pickTier()); });
  if (navigator.vibrate) tog('haptics', 'optHaptic');
  if (document.documentElement.requestFullscreen) row(STR.optFull, document.fullscreenElement ? STR.on : STR.off, !!document.fullscreenElement, () => { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen().catch(() => {}); });
}
{
  const T = (id, s) => { $(id).textContent = s; };
  const V = (id, s) => { const e = $(id); e.textContent = ''; for (const ln of s.split('\n')) { const sp = document.createElement('span'); sp.textContent = ln; e.appendChild(sp); } };
  T('#titleLead', STR.lead); V('#titleVerse', STR.verse0); T('#titleRef', STR.ref0); T('#tip', STR.tips[Math.floor(Math.random() * STR.tips.length)]);
  T('#easyT', STR.easy); T('#easyS', STR.easySub); T('#manualT', STR.manual); T('#manualS', STR.manualSub); T('#resume', STR.resume);
  T('#chooseH', STR.chooseH); T('#chooseP', STR.chooseP); T('#writeH', STR.writeH); T('#writeP', STR.writeP); $('#note').placeholder = STR.notePh;
  T('#skipWrite', STR.skipWrite); T('#keep', STR.keep); T('#save', STR.save); T('#roam', STR.roam); T('#autoLabel', STR.auto); T('#warpT', STR.warp); T('#actLabel', STR.blow); T('#skipHint', STR.skip);
  T('#pauseH', STR.pauseH); T('#cont', STR.cont); T('#restart', STR.restart); T('#endLine', STR.lines.ending); V('#endMeet', STR.verse1); T('#endInfo', STR.ref1); T('#endWho', STR.cardWho);
  T('#endCard', STR.again); T('#endReplay', STR.replay); T('#lostText', STR.lost); T('#reload', STR.reload); T('#turnText', STR.turn);
  for (const f of FEARS) { const b = document.createElement('button'); b.type = 'button'; b.textContent = f.label; b.addEventListener('click', () => pickFear(f)); $('#fears').append(b); }
  $('#easy').addEventListener('click', () => begin('easy')); $('#manual').addEventListener('click', () => begin('manual')); $('#resume').addEventListener('click', () => begin('resume'));
  $('#skipWrite').addEventListener('click', () => closeWrite('')); $('#keep').addEventListener('click', () => closeWrite($('#note').value));
  $('#save').addEventListener('click', saveCard); $('#roam').addEventListener('click', goOn);
  $('#auto').addEventListener('click', () => setAuto(!AUTO.on, true)); $('#act').addEventListener('click', pressAction); $('#warp').addEventListener('click', jumpToLight);
  $('#menuBtn').addEventListener('click', togglePause); $('#cont').addEventListener('click', togglePause);
  const again = () => { drop('jericho:save'); location.href = location.pathname; };
  $('#restart').addEventListener('click', again); $('#endReplay').addEventListener('click', again); $('#reload').addEventListener('click', () => location.reload());
  $('#endCard').addEventListener('click', () => { $('#card').hidden = false; });
  applyText(); buildOptions();
}
const MODELS = ['hero', 'priest', 'woman', 'elder', 'shofar', 'rubble', 'palm', 'acacia', 'rock', 'tent', 'jars', 'house', 'cairn', 'citadel'];
Promise.all(MODELS.map(glb)).then((arr) => {
  const g = Object.fromEntries(MODELS.map((n, i) => [n, arr[i]]));
  if (LAB) { lab(g); return; }
  setupHero(g.hero); setupHorn(g.shofar); addCompanions([[g.priest, 1.76], [g.woman, 1.62], [g.elder, 1.7]]);
  M.flower = billboards('flower', CFG.n.flowers, 1.2, 0.714, 1.06); M.rubble = instanced(g.rubble, CFG.n.rubble, 5.2, false);
  M.palm = instanced(g.palm, CFG.n.palms, 9.6, true, true, trimBase); M.acacia = instanced(g.acacia, CFG.n.acacia, 6.5, true); M.rock = instanced(g.rock, CFG.n.rocks, 2.6, false);
  M.tent = instanced(g.tent, 4, 8, false); M.jars = instanced(g.jars, 3, 2.7, false); M.house = instanced(g.house, CFG.n.houses, 6.2, false); M.cairn = instanced(g.cairn, 1, 1.7, true);
  M.grass = billboards('grass', CFG.n.grass, 1.25, 1.02, 1.12); M.reeds = billboards('reeds', CFG.n.reeds, 2.3, 2.0, 1.45);
  layoutScenery();
  if (g.citadel) {
    const c = g.citadel.scene; c.traverse((o) => { if (o.isMesh) { fixMat(o.material); o.castShadow = true; } }); c.updateMatrixWorld(true);
    const b = new THREE.Box3().setFromObject(c), s = b.getSize(new THREE.Vector3()), holder = new THREE.Group();
    c.position.set(-(b.min.x + b.max.x) / 2, -b.min.y, -(b.min.z + b.max.z) / 2); holder.add(c); holder.scale.setScalar(44 / Math.max(s.x, s.z)); holder.position.set(CFG.cx, 0, CFG.cz); holder.rotation.y = WORLD.citadelYaw; scene.add(holder); WORLD.citadel = holder;
  }
  const sg = new THREE.IcosahedronGeometry(0.2, 1); sg.scale(1.25, 0.7, 1);
  WORLD.stone = new THREE.Mesh(sg, new THREE.MeshStandardMaterial({ color: 0xc4bdae, roughness: 0.9, emissive: 0x6a4c12, emissiveIntensity: 0.4 })); WORLD.stoneY = 1.78;
  WORLD.stone.position.set(CFG.cx, WORLD.stoneY, CFG.cz); WORLD.stone.visible = false; WORLD.stone.castShadow = true; scene.add(WORLD.stone);
  if (WORLD.campfire) {
    const f = new THREE.Sprite(new THREE.SpriteMaterial({ map: WORLD.flame, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, transparent: true }));
    f.position.set(WORLD.campfire.x + WORLD.fireOff[0], WORLD.campfire.y + 0.75, WORLD.campfire.z + WORLD.fireOff[1]); f.scale.setScalar(1.9); f.userData.s = 1.9; scene.add(f); WORLD.fires.push(f);
    WORLD.fireLight = new THREE.PointLight(0xff9a4a, 15, 22, 2); WORLD.fireLight.position.set(f.position.x, WORLD.campfire.y + 1.3, f.position.z); scene.add(WORLD.fireLight);
  }
  for (const f of WORLD.fires) if (!f.userData.s) f.userData.s = f.scale.x;
  applyQuality(pickTier()); applyMood(0);
  $('#loadRow').hidden = true; $('#startRow').hidden = false; if (SAVE) $('#resume').hidden = false;
  window.__g = { G, P, CAM, AUTO, HERO, COMP, W, SET, QL, FEARS, WORLD, CFG, begin, pickFear, pressAction, startCollapse, closeWrite, goOn, jumpToLight, hitLight, renderer, camera, beacon };
  if (qs.get('stage') && SAVE) begin('resume');
});
requestAnimationFrame(frame);
