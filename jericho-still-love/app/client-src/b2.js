// ── sunrise: sun disc, light shafts, drifting motes, birds ────────────────
{
  const glow = canvasTex(256, 256, (c) => { const g = c.createRadialGradient(128, 128, 0, 128, 128, 128); g.addColorStop(0, 'rgba(255,250,235,1)'); g.addColorStop(0.16, 'rgba(255,228,165,.85)'); g.addColorStop(0.5, 'rgba(255,190,110,.24)'); g.addColorStop(1, 'rgba(255,170,90,0)'); c.fillStyle = g; c.fillRect(0, 0, 256, 256); });
  WORLD.sunSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, opacity: 0, transparent: true }));
  WORLD.sunSprite.scale.setScalar(170); scene.add(WORLD.sunSprite);
  const shaftTex = canvasTex(64, 256, (c, w, h) => { const g = c.createLinearGradient(0, 0, w, 0); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,255,255,1)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, w, h); c.globalCompositeOperation = 'destination-in'; const v = c.createLinearGradient(0, 0, 0, h); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(0.25, 'rgba(0,0,0,1)'); v.addColorStop(0.8, 'rgba(0,0,0,.7)'); v.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = v; c.fillRect(0, 0, w, h); });
  WORLD.shafts = [];
  for (let i = 0; i < 6; i++) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(5 + R() * 5, 52), new THREE.MeshBasicMaterial({ map: shaftTex, color: 0xffe2a8, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }));
    m.rotation.x = -1.02; m.position.set(CFG.cx - 22 + i * 8.6 + R() * 3, 13.4, CFG.cz - 16 + R() * 14); m.userData.ph = R() * TAU; m.renderOrder = 4; scene.add(m); WORLD.shafts.push(m);
  }
  const MN = 260, box = 46, mp = new Float32Array(MN * 3), ms = new Float32Array(MN);
  for (let i = 0; i < MN; i++) { mp[i * 3] = (R() - 0.5) * box; mp[i * 3 + 1] = 0.3 + R() * 12; mp[i * 3 + 2] = CFG.startZ + (R() - 0.5) * box; ms[i] = R() * TAU; }
  const mg = new THREE.BufferGeometry(); mg.setAttribute('position', new THREE.BufferAttribute(mp, 3));
  const dot = canvasTex(32, 32, (c) => { const g = c.createRadialGradient(16, 16, 0, 16, 16, 16); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.5, 'rgba(255,255,255,.5)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, 32, 32); });
  WORLD.motes = new THREE.Points(mg, new THREE.PointsMaterial({ size: 0.2, map: dot, transparent: true, opacity: 0.28, depthWrite: false, color: MOOD.moteA.clone(), sizeAttenuation: true }));
  WORLD.motes.frustumCulled = false; WORLD.motes.userData = { n: MN, box, seed: ms }; WORLD.motes.renderOrder = 5; scene.add(WORLD.motes);
  const bg = new THREE.BufferGeometry(); bg.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0.3, 0, 0, -0.3, -1.2, 0.42, 0, 0, 0, 0.3, 1.2, 0.42, 0, 0, 0, -0.3], 3));
  WORLD.birds = new THREE.InstancedMesh(bg, new THREE.MeshBasicMaterial({ color: 0x2c241d, side: THREE.DoubleSide }), 9);
  WORLD.birds.frustumCulled = false; WORLD.birds.visible = false; WORLD.birds.userData = { t: -1, off: [] };
  for (let i = 0; i < 9; i++) WORLD.birds.userData.off.push([(i % 2 ? 1 : -1) * Math.ceil(i / 2) * 2.6 + R(), R() * 2.4, Math.ceil(i / 2) * 2.2 + R(), R() * TAU, 0.8 + R() * 0.5]);
  scene.add(WORLD.birds);
}
function updateSky(dt) {
  const h = G.hope, t = G.now;
  WORLD.waterU.t.value = t;
  WORLD.skyFear.position.x = WORLD.skyHope.position.x = P.x; WORLD.skyFear.position.z = WORLD.skyHope.position.z = P.z;
  WORLD.skyFear.rotation.y = t * 0.0035;
  WORLD.sunSprite.position.set(P.x - 28, 24, P.z - 190);
  for (const s of WORLD.shafts) s.material.opacity = h * 0.13 * (0.75 + 0.25 * Math.sin(t * 0.5 + s.userData.ph));
  const m = WORLD.motes, a = m.geometry.attributes.position, p = a.array, { n, box, seed } = m.userData, hb = box / 2, fall = lerp(0.04, 0.42, h);
  for (let i = 0; i < n; i++) {
    const k = i * 3; p[k] += (0.5 + Math.sin(t * 0.6 + seed[i]) * 0.5) * dt; p[k + 1] -= fall * dt * (0.6 + (i % 5) * 0.2); p[k + 2] += Math.cos(t * 0.45 + seed[i] * 1.7) * 0.35 * dt;
    if (p[k] - P.x > hb) p[k] -= box; else if (p[k] - P.x < -hb) p[k] += box;
    if (p[k + 2] - P.z > hb) p[k + 2] -= box; else if (p[k + 2] - P.z < -hb) p[k + 2] += box;
    if (p[k + 1] < 0.1) p[k + 1] = 12 + (i % 7) * 0.2;
  }
  a.needsUpdate = true;
  const b = WORLD.birds, bu = b.userData;
  if (bu.t >= 0) {
    bu.t += dt; const bx = 150 - bu.t * 10;
    for (let i = 0; i < 9; i++) { const o = bu.off[i]; dummy.position.set(CFG.cx + bx + o[0] + o[2], 30 + o[1] + Math.sin(t + o[3]) * 0.6, CFG.cz - 46 + o[2] * 0.4 - o[0] * 0.5); dummy.rotation.set(0, -Math.PI / 2, 0); dummy.scale.set(o[4], Math.sin(t * 7 + o[3]) * 0.9 + 0.2, o[4]); dummy.updateMatrix(); b.setMatrixAt(i, dummy.matrix); }
    b.instanceMatrix.needsUpdate = true; if (bx < -170) { bu.t = -1; b.visible = false; later(38, flyBirds); }
  }
}
function flyBirds() { if (G.ended) return; WORLD.birds.userData.t = 0; WORLD.birds.visible = true; }

// ── footprints: the way you came stays on the ground ──────────────────────
{
  const ft = canvasTex(32, 64, (c) => { c.clearRect(0, 0, 32, 64); c.fillStyle = 'rgba(40,28,16,.5)'; c.beginPath(); c.ellipse(16, 22, 9, 16, 0, 0, TAU); c.fill(); c.beginPath(); c.ellipse(16, 50, 7.5, 9, 0, 0, TAU); c.fill(); });
  const fg = new THREE.PlaneGeometry(0.17, 0.36); fg.rotateX(-Math.PI / 2);
  WORLD.feet = new THREE.InstancedMesh(fg, new THREE.MeshBasicMaterial({ map: ft, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 }), 260);
  WORLD.feet.frustumCulled = false; WORLD.feet.count = 0; WORLD.feet.userData.i = 0; WORLD.feet.renderOrder = 1; scene.add(WORLD.feet);
}
function stampFoot() {
  const f = WORLD.feet, i = f.userData.i % 260, s = P.foot; P.foot = -s;
  const fx = P.x + Math.cos(P.heading) * 0.13 * s, fz = P.z - Math.sin(P.heading) * 0.13 * s; dummy.position.set(fx, groundY(fx, fz) + 0.04, fz); dummy.rotation.set(0, P.heading + Math.PI, 0); dummy.scale.setScalar(1); dummy.updateMatrix();
  f.setMatrixAt(i, dummy.matrix); f.userData.i++; f.count = Math.min(f.userData.i, 260); f.instanceMatrix.needsUpdate = true;
}

// ── dust + shockwave for the fall ──────────────────────────────────────────
const DUST = { n: 460, on: false, t: 0 };
{
  DUST.pos = new Float32Array(DUST.n * 3); DUST.vel = new Float32Array(DUST.n * 3);
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(DUST.pos, 3));
  const map = canvasTex(64, 64, (c) => { const g = c.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,.9)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, 64, 64); });
  DUST.pts = new THREE.Points(geo, new THREE.PointsMaterial({ size: 10, map, transparent: true, opacity: 0, depthWrite: false, color: 0xd6c7a4, sizeAttenuation: true }));
  DUST.pts.frustumCulled = false; DUST.pts.visible = false; DUST.pts.renderOrder = 6; scene.add(DUST.pts);
  DUST.wave = new THREE.Mesh(new THREE.RingGeometry(0.9, 1, 72), new THREE.MeshBasicMaterial({ color: 0xe8d9b4, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide }));
  DUST.wave.rotation.x = -Math.PI / 2; DUST.wave.position.set(CFG.cx, 1.25, CFG.cz); DUST.wave.visible = false; scene.add(DUST.wave);
}
function startDust() {
  for (let i = 0; i < DUST.n; i++) { const a = R() * TAU, r = CFG.wallR + (R() - 0.5) * 5, k = i * 3; DUST.pos[k] = CFG.cx + Math.sin(a) * r; DUST.pos[k + 1] = R() * 10; DUST.pos[k + 2] = CFG.cz + Math.cos(a) * r; DUST.vel[k] = Math.sin(a) * (1 + R() * 3.4); DUST.vel[k + 1] = 0.6 + R() * 2.2; DUST.vel[k + 2] = Math.cos(a) * (1 + R() * 3.4); }
  DUST.on = true; DUST.t = 0; DUST.pts.visible = true; DUST.wave.visible = true;
}
function updateDust(dt) {
  if (!DUST.on) return; DUST.t += dt; const p = DUST.pos, v = DUST.vel;
  for (let k = 0; k < p.length; k++) p[k] += v[k] * dt;
  DUST.pts.geometry.attributes.position.needsUpdate = true;
  DUST.pts.material.opacity = DUST.t < 2.5 ? (DUST.t / 2.5) * 0.5 : Math.max(0, 0.5 * (1 - (DUST.t - 2.5) / 9));
  const wk = clamp((DUST.t - 0.5) / 3.2, 0, 1), ws = CFG.wallR + wk * 34; DUST.wave.scale.set(ws, ws, 1); DUST.wave.material.opacity = wk > 0 ? (1 - wk) * 0.5 : 0;
  if (DUST.t > 11.5) { DUST.on = false; DUST.pts.visible = false; DUST.wave.visible = false; }
}
