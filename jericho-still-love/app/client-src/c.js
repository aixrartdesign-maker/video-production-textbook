
// ── instanced props from generated models ─────────────────────────────────
const DENS = [];
function trimBase(geo, H) { // the generated palm stands on a little diorama base with a tiny figure: keep the trunk, drop the rest
  const p = geo.attributes.position; let ax = 0, az = 0, n = 0;
  for (let i = 0; i < p.count; i++) { const y = p.getY(i); if (y > 0.27 * H && y < 0.4 * H) { ax += p.getX(i); az += p.getZ(i); n++; } }
  if (!n) return; ax /= n; az /= n;
  if (!geo.index) { const all = []; for (let i = 0; i < p.count; i++) all.push(i); geo.setIndex(all); }
  const src = geo.index.array, keep = [];
  for (let i = 0; i < src.length; i += 3) {
    const a = src[i], b = src[i + 1], c = src[i + 2], y = (p.getY(a) + p.getY(b) + p.getY(c)) / 3;
    if (y < 0.25 * H && Math.hypot((p.getX(a) + p.getX(b) + p.getX(c)) / 3 - ax, (p.getZ(a) + p.getZ(b) + p.getZ(c)) / 3 - az) > 0.05 * H) continue;
    keep.push(a, b, c);
  }
  geo.setIndex(keep);
}
function instanced(g, counts, size, byHeight, shadow = true, trim = null) {
  if (!g) return null; let mesh = null; g.scene.updateMatrixWorld(true); g.scene.traverse((o) => { if (o.isMesh && !mesh) mesh = o; });
  if (!mesh) return null;
  const geo = mesh.geometry.clone(); geo.applyMatrix4(mesh.matrixWorld); geo.computeBoundingBox();
  const bb = geo.boundingBox, dim = byHeight ? bb.max.y - bb.min.y : Math.max(bb.max.x - bb.min.x, bb.max.z - bb.min.z), s = size / (dim || 1);
  geo.translate(-(bb.min.x + bb.max.x) / 2, -bb.min.y, -(bb.min.z + bb.max.z) / 2); geo.scale(s, s, s);
  if (trim) trim(geo, size);
  fixMat(mesh.material);
  const hi = Array.isArray(counts) ? counts[0] : counts, lo = Array.isArray(counts) ? counts[1] : counts;
  const im = new THREE.InstancedMesh(geo, mesh.material, hi); im.frustumCulled = false; im.castShadow = shadow; im.receiveShadow = true; scene.add(im);
  DENS.push({ im, hi, lo }); return im;
}
function billboards(name, counts, w, h, tint = 1) {
  const hw = w / 2, g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([-hw, 0, 0, hw, 0, 0, hw, h, 0, -hw, h, 0, 0, 0, -hw, 0, 0, hw, 0, h, hw, 0, h, -hw], 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1], 2));
  g.setAttribute('normal', new THREE.Float32BufferAttribute([0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0], 3));
  g.setIndex([0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7]);
  const mat = new THREE.MeshStandardMaterial({ map: tex(name, null, 'png'), alphaTest: 0.5, side: THREE.DoubleSide, roughness: 1, metalness: 0 }); mat.color.setRGB(tint, tint, tint * 0.94);
  mat.onBeforeCompile = (sh) => { sh.fragmentShader = sh.fragmentShader.replace('#include <normal_fragment_begin>', '#include <normal_fragment_begin>\nnormal = normalize(vNormal);'); }; // both faces take the light from above
  const im = new THREE.InstancedMesh(g, mat, counts[0]);
  im.frustumCulled = false; scene.add(im); DENS.push({ im, hi: counts[0], lo: counts[1] }); return im;
}
function put(im, list) { // list rows: [x, z, rotY, scale, y]
  if (!im) return;
  for (let i = 0; i < im.count; i++) { const p = list[i]; if (p) { dummy.position.set(p[0], (p[5] ? lowY(p[0], p[1], p[5]) : groundY(p[0], p[1])) + (p[4] || 0), p[1]); dummy.rotation.set(0, p[2], 0); dummy.scale.setScalar(p[3]); } else { dummy.position.set(0, -50, 0); dummy.scale.setScalar(0.0001); } dummy.updateMatrix(); im.setMatrixAt(i, dummy.matrix); }
  im.instanceMatrix.needsUpdate = true;
}
function okSpot(x, z, pad) {
  if (Math.hypot(x - CFG.cx, z - CFG.cz) < CFG.beaconR + 4 + pad) return false;
  if (Math.abs(x) < 7 + pad) return false;
  if (z > CFG.riverZ0 - 2.5 - pad && z < CFG.riverZ1 + 2.5 + pad) return false;
  return Math.hypot(x, z - CFG.wz) < CFG.wr - 4;
}
function spots(n, rMin, rMax, pad, extra) {
  const out = []; let guard = 0;
  while (out.length < n && guard++ < n * 60) {
    const a = R() * TAU, r = rMin + R() * (rMax - rMin), x = CFG.cx + Math.sin(a) * r, z = CFG.cz + Math.cos(a) * r;
    if (!okSpot(x, z, pad) || (extra && !extra(x, z)) || out.some((o) => Math.hypot(o[0] - x, o[1] - z) < pad * 2 + 1.5)) continue;
    out.push([x, z]);
  }
  return out;
}
function bloomSet(n) { return { n, x: new Float32Array(n), y: new Float32Array(n), z: new Float32Array(n), ry: new Float32Array(n), s: new Float32Array(n), start: new Float32Array(n).fill(Infinity), done: new Uint8Array(n) }; }
const FL = bloomSet(CFG.n.flowers[0]), RB = bloomSet(CFG.n.rubble[0]);
const M = {}; // instanced meshes by name
function writeBloom(im, D, i, k) { dummy.position.set(D.x[i], D.y[i], D.z[i]); dummy.rotation.set(0, D.ry[i], 0); dummy.scale.setScalar(Math.max(D.s[i] * k, 1e-4)); dummy.updateMatrix(); im.setMatrixAt(i, dummy.matrix); }
function updateBloom(im, D) {
  if (!im) return; let dirty = false;
  for (let i = 0; i < D.n; i++) { if (D.done[i]) continue; const t = (G.now - D.start[i]) / 1.5; if (!(t > 0)) continue; writeBloom(im, D, i, t >= 1 ? 1 : easeOutBack(t)); if (t >= 1) D.done[i] = 1; dirty = true; }
  if (dirty) im.instanceMatrix.needsUpdate = true;
}
function layoutScenery() {
  const awayFromCamp = (x, z) => !(Math.abs(x) < 26 && z > 70);
  const ring = (r) => { const a = R() * TAU; return [CFG.cx + Math.sin(a) * r, CFG.cz + Math.cos(a) * r]; };
  // flowers: 0-6 at the seven days, 7-16 around the cairn, the rest across the ruins
  for (let i = 0; i < FL.n; i++) {
    let x, z; const f = (i - 17) / Math.max(1, FL.n - 17);
    if (i < 7) { const b = beaconPos(i + 1), a = Math.atan2(b.x - CFG.cx, b.z - CFG.cz); x = b.x + Math.sin(a) * 3.6; z = b.z + Math.cos(a) * 3.6; }
    else if (i < 17) { const a = ((i - 7) / 10) * TAU + 0.3; x = CFG.cx + Math.sin(a) * 3.5; z = CFG.cz + Math.cos(a) * 3.5; }
    else if (f < 0.34) [x, z] = ring(CFG.wallR - 4 + R() * 13);
    else if (f < 0.62) [x, z] = ring(5.5 + R() * (CFG.wallR - 10));
    else if (f < 0.8) { x = CFG.cx + (R() < 0.5 ? -1 : 1) * (3.1 + R() * 1.6); z = CFG.cz - (CFG.wallR + 18) + R() * (2 * CFG.wallR + 34); }
    else [x, z] = ring(CFG.keepOut + 2 + R() * 14);
    FL.x[i] = x; FL.z[i] = z; FL.y[i] = groundY(x, z) - 0.05; FL.ry[i] = R() * TAU; FL.s[i] = i < 17 ? 0.8 + R() * 0.3 : 0.7 + R() * 0.75;
  }
  for (let i = 0; i < RB.n; i++) {
    let a = 0.42 + (i / RB.n) * (TAU - 0.84) + (R() - 0.5) * 0.2; if (Math.abs(a - Math.PI) < 0.32) a += 0.5;
    const r = CFG.wallR - 2 + R() * 7; RB.x[i] = CFG.cx + Math.sin(a) * r; RB.z[i] = CFG.cz + Math.cos(a) * r; RB.y[i] = groundY(RB.x[i], RB.z[i]) - 0.25; RB.ry[i] = R() * TAU; RB.s[i] = 0.8 + R() * 0.6;
  }
  for (const [im, D] of [[M.flower, FL], [M.rubble, RB]]) if (im) { for (let i = 0; i < D.n; i++) writeBloom(im, D, i, 0); im.instanceMatrix.needsUpdate = true; }
  const palms = spots(CFG.n.palms[0] - 6, 52, 112, 2.2, awayFromCamp).map(([x, z]) => { const ry = R() * TAU, s = 0.8 + R() * 0.5; return [x, z, ry, s, -1.25 * s, 0.9]; });
  for (const [x, z] of [[-11, 45.6], [13, 46], [-23, 70.6], [20, 71], [-37, 45], [35, 70.4]]) { const ry = R() * TAU, s = 0.85 + R() * 0.4; palms.unshift([x, z, ry, s, -1.25 * s, 0.9]); }
  put(M.palm, palms); palms.forEach((p) => COL.push({ x: p[0], z: p[1], r: 0.7 }));
  const ac = spots(CFG.n.acacia[0], 56, 114, 4, awayFromCamp).map(([x, z]) => [x, z, R() * TAU, 0.8 + R() * 0.5, -0.1]);
  put(M.acacia, ac); ac.forEach((p) => COL.push({ x: p[0], z: p[1], r: 0.8 }));
  const big = spots(24, 51, 116, 1.4).map(([x, z]) => { const ry = R() * TAU, s = 0.6 + R() * 1.1; return [x, z, ry, s, -0.2 * s, 1.0 * s]; });
  big.forEach((p) => COL.push({ x: p[0], z: p[1], r: 1.15 * p[3] }));
  const bedStones = []; for (let i = 0; i < 16; i++) { const s = 0.1 + R() * 0.17, sd = i % 2 ? 1 : -1; bedStones.push([sd * (1.9 + R() * 1.9), CFG.riverZ0 + 0.6 + R() * (CFG.riverZ1 - CFG.riverZ0 - 1.2), R() * TAU, s, -0.5 * s]); }
  const rocks = []; for (let i = 0; i < 24; i++) { if (bedStones[i]) rocks.push(bedStones[i]); rocks.push(big[i] || bedStones[0]); }
  put(M.rock, rocks);
  const tents = [[-13.5, 90, 0], [14.5, 95, 0], [-11.5, 103, 0], [17, 81.5, 0]].map(([x, z]) => [x, z, Math.atan2(-x, 84 - z) + (WORLD.tentYaw || 0), 1, -0.04, 3.2]);
  put(M.tent, tents); tents.forEach((p) => COL.push({ x: p[0], z: p[1], r: 3.5 }));
  const jars = [[5.4, 88.6], [-7.6, 95.5], [10.6, 100.5]].map(([x, z]) => [x, z, R() * TAU, 1, -0.03, 1.1]);
  put(M.jars, jars); jars.forEach((p) => COL.push({ x: p[0], z: p[1], r: 1.25 }));
  WORLD.campfire = { x: jars[0][0], z: jars[0][1], y: lowY(jars[0][0], jars[0][1], 1.1) };
  const houses = [[32, 14], [112, 15.5], [205, 21], [292, 20], [70, 21], [248, 15], [148, 22], [330, 23], [20, 25.5], [226, 26]].map(([deg, r]) => { const a = (deg * Math.PI) / 180; return [CFG.cx + Math.sin(a) * r, CFG.cz + Math.cos(a) * r, R() * TAU, 0.85 + R() * 0.35, -0.1]; });
  put(M.house, houses); WORLD.houseSpots = houses; if (M.house) M.house.visible = false;
  put(M.cairn, [[CFG.cx, CFG.cz, 0.4, 1, 0]]); if (M.cairn) M.cairn.visible = false;
  const grass = spots(CFG.n.grass[0] - 26, 50, 118, 0.3).map(([x, z]) => [x, z, R() * TAU, 0.7 + R() * 0.9, 0]);
  for (let i = 0; i < 26; i++) { const [x, z] = ring(CFG.keepOut + 0.6 + R() * 3.2); if (Math.abs(x - CFG.cx) > 6) grass.unshift([x, z, R() * TAU, 0.6 + R() * 0.6, 0]); }
  put(M.grass, grass);
  const reeds = []; for (let i = 0; i < CFG.n.reeds[0]; i++) { const s = i % 2 ? 1 : -1, north = i % 4 < 2; reeds.push([s * (4.9 + R() * R() * 80), north ? CFG.riverZ0 - 0.2 - R() * 1.2 : CFG.riverZ1 + 0.2 + R() * 1.2, R() * TAU, 0.8 + R() * 0.7, 0]); }
  put(M.reeds, reeds);
}

// ── guidance: flowing chevrons on the ground toward the next light ────────
{
  const ct = canvasTex(64, 64, (c) => { c.clearRect(0, 0, 64, 64); c.lineJoin = 'round'; c.lineCap = 'round'; c.beginPath(); c.moveTo(12, 44); c.lineTo(32, 20); c.lineTo(52, 44); c.strokeStyle = 'rgba(60,40,10,.6)'; c.lineWidth = 14; c.stroke(); c.strokeStyle = '#ffd35e'; c.lineWidth = 8; c.stroke(); });
  const cg = new THREE.PlaneGeometry(1.5, 1.5); cg.rotateX(-Math.PI / 2);
  WORLD.chev = new THREE.InstancedMesh(cg, new THREE.MeshBasicMaterial({ map: ct, transparent: true, depthWrite: false, fog: false, polygonOffset: true, polygonOffsetFactor: -6, polygonOffsetUnits: -6 }), 12);
  WORLD.chev.frustumCulled = false; WORLD.chev.visible = false; WORLD.chev.renderOrder = 2; scene.add(WORLD.chev);
}
const WP = { x: 0, z: 0 }, GP = { x: 0, z: 0 };
const tilt = new THREE.Object3D(); tilt.rotation.order = 'YXZ';
function ringGuide() { // during the march the way bends with the wall
  const t = G.target; if (!t || G.stage !== 3 || G.collapsed) return null;
  const aP = Math.atan2(P.x - CFG.cx, P.z - CFG.cz), aT = Math.atan2(t.x - CFG.cx, t.z - CFG.cz);
  let d = aT - aP; while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU;
  return Math.abs(d) > 0.09 ? { aP, d, rP: Math.hypot(P.x - CFG.cx, P.z - CFG.cz) } : null;
}
function guidePoint(s, rg, out) { // the spot `s` metres ahead along the suggested way
  if (rg) { const a = rg.aP + Math.sign(rg.d) * Math.min(s / CFG.beaconR, Math.abs(rg.d)), r = lerp(rg.rP, CFG.beaconR, smooth(s / 7)); out.x = CFG.cx + Math.sin(a) * r; out.z = CFG.cz + Math.cos(a) * r; }
  else { const wp = waypoint(), dx = wp.x - P.x, dz = wp.z - P.z, d = Math.hypot(dx, dz) || 1; out.x = P.x + (dx / d) * s; out.z = P.z + (dz / d) * s; }
  return out;
}
function waypoint() { // where to walk next on the way to the target (roads first)
  const t = G.target; WP.x = t.x; WP.z = t.z;
  const rg = ringGuide(); if (rg) return guidePoint(3.4, rg, WP);
  if (t.z < CFG.riverZ0 && P.z > CFG.riverZ0 - 0.5) { WP.x = 0; WP.z = Math.abs(P.x) > 1.2 && P.z > CFG.riverZ1 ? CFG.riverZ1 + 1.2 : CFG.riverZ0 - 2; return WP; }
  if (G.collapsed) {
    const rP = Math.hypot(P.x - CFG.cx, P.z - CFG.cz), rT = Math.hypot(t.x - CFG.cx, t.z - CFG.cz), off = Math.abs(P.x - CFG.cx) > 1.6;
    const pOut = rP > CFG.wallR - 2, tOut = rT > CFG.wallR - 2;
    if (off && (pOut !== tOut || (pOut && tOut && (P.z - CFG.cz) * (t.z - CFG.cz) < 0))) { WP.x = CFG.cx; WP.z = pOut ? CFG.cz + Math.sign(P.z - CFG.cz || 1) * Math.max(Math.abs(P.z - CFG.cz), CFG.keepOut + 2) : P.z + Math.sign(t.z - P.z) * 3; }
    else if (Math.abs(t.x - CFG.cx) < 0.5 && Math.abs(P.x - CFG.cx) < 2.2 && (P.z - CFG.cz) * (t.z - CFG.cz) < 0 && Math.abs(P.z - CFG.cz) < 9) { WP.x = CFG.cx + (P.x >= CFG.cx ? 2.6 : -2.6); WP.z = CFG.cz; } // step around the cairn
  }
  return WP;
}
function updateChevrons() {
  const c = WORLD.chev, show = !!G.target && G.phase === 'play'; c.visible = show; if (!show) return;
  const rg = ringGuide(), wp = waypoint(), total = rg ? Math.abs(rg.d) * CFG.beaconR : Math.hypot(wp.x - P.x, wp.z - P.z), flow = (G.now * 2.6) % 2.2;
  for (let i = 0; i < 12; i++) {
    const s = 2 + i * 2.2 + flow, k = s > total - 1.2 ? 0 : Math.min(1, (s - 1.6) / 1.4) * Math.min(1, (27.5 - s) / 3);
    guidePoint(s, rg, GP); const qx = GP.x, qz = GP.z; guidePoint(s + 0.7, rg, GP);
    const ux = GP.x - qx, uz = GP.z - qz, ul = Math.hypot(ux, uz) || 1, vx = ux / ul, vz = uz / ul;
    const g0 = groundY(qx - vx * 0.7, qz - vz * 0.7), g1 = groundY(qx + vx * 0.7, qz + vz * 0.7);
    tilt.position.set(qx, Math.max(groundY(qx, qz), (g0 + g1) / 2) + 0.1, qz); tilt.rotation.set(Math.atan2(g1 - g0, 1.4), Math.atan2(-vx, -vz), 0); tilt.scale.setScalar(Math.max(k, 1e-4)); tilt.updateMatrix(); c.setMatrixAt(i, tilt.matrix);
  }
  c.instanceMatrix.needsUpdate = true;
}

// ── hero: clips, calibration, horn ─────────────────────────────────────────
const hero = new THREE.Group(); scene.add(hero);
const HERO = { mixer: null, act: {}, w: {}, bones: {}, hornT: 0, hornK: 0, kneelT: 0, kneelAt: 0, kneelGoal: 0, stride: 1, body: null };
{
  const blob = new THREE.Mesh(new THREE.CircleGeometry(0.7, 24), new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, opacity: 0.4, map: canvasTex(64, 64, (c) => { const g = c.createRadialGradient(32, 32, 2, 32, 32, 32); g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(0, 0, 64, 64); }) }));
  blob.rotation.x = -Math.PI / 2; blob.position.y = 0.05; blob.renderOrder = 1; hero.add(blob); HERO.blob = blob;
}
function stripRootMotion(clip) {
  for (const tr of clip.tracks) {
    if (!tr.name.endsWith('.position')) continue;
    const v = tr.values, a = [Infinity, Infinity, Infinity], b = [-Infinity, -Infinity, -Infinity];
    for (let i = 0; i < v.length; i += 3) for (let k = 0; k < 3; k++) { a[k] = Math.min(a[k], v[i + k]); b[k] = Math.max(b[k], v[i + k]); }
    const big = Math.max(b[0] - a[0], b[2] - a[2]);
    if (big > 1e-4 && big > 4 * Math.max(b[1] - a[1], 1e-5)) for (let i = 0; i < v.length; i += 3) { v[i] = v[0]; v[i + 2] = v[2]; }
  }
  return clip;
}
function poseClip(clip, t, name) {
  const tracks = clip.tracks.map((tr) => { const v = Array.from(tr.createInterpolant().evaluate(t)); return new tr.constructor(tr.name, [0, 1], v.concat(v)); });
  return new THREE.AnimationClip(name, 1, tracks);
}
function fitHuman(root, height) { // scale to height, feet on the ground, centred
  root.traverse((o) => { if (o.isMesh) { o.frustumCulled = false; o.castShadow = true; fixMat(o.material); } });
  root.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(root), s = height / (box.max.y - box.min.y || 1);
  root.scale.multiplyScalar(s); root.position.set(-((box.min.x + box.max.x) / 2) * s, -box.min.y * s, -((box.min.z + box.max.z) / 2) * s);
}
const CALMED = new WeakSet();
function calmGait(clip, root, kSway, kRoll, kYaw) { // tame the hip sway of a walk clip; the legs and the spine keep their world pose
  let hips = null; root.traverse((o) => { if (o.isBone && o.name === 'Hips') hips = o; });
  const find = (n) => clip.tracks.find((t) => t.name === n), tq = hips && find('Hips.quaternion');
  if (!tq || !root.parent || tq.values.length !== tq.times.length * 4 || CALMED.has(tq.values)) return; CALMED.add(tq.values);
  root.updateMatrixWorld(true);
  const Q = () => new THREE.Quaternion(), n = tq.times.length, q = Q(), w = Q(), mean = Q(), rel = Q(), D = [];
  const pr = root.parent.getWorldQuaternion(Q()).invert().multiply(hips.parent.getWorldQuaternion(Q())), pri = pr.clone().invert(); // bone parent, seen from the walker
  const W = []; for (let i = 0; i < n; i++) { q.fromArray(tq.values, i * 4); const wi = pr.clone().multiply(q); if (i && wi.dot(W[0]) < 0) wi.set(-wi.x, -wi.y, -wi.z, -wi.w); W.push(wi); mean.x += wi.x; mean.y += wi.y; mean.z += wi.z; mean.w += wi.w; }
  mean.w -= 1; mean.normalize(); const meanI = mean.clone().invert(); // Q() starts at w = 1
  for (let i = 0; i < n; i++) {
    rel.copy(W[i]).multiply(meanI); if (rel.w < 0) rel.set(-rel.x, -rel.y, -rel.z, -rel.w);
    const sn = Math.hypot(rel.x, rel.y, rel.z), ang = 2 * Math.atan2(sn, rel.w), f = sn > 1e-9 ? ang / sn : 2; // rotation vector: x pitch, y yaw, z roll
    const rx = rel.x * f, ry = rel.y * f * kYaw, rz = rel.z * f * kRoll, a2 = Math.hypot(rx, ry, rz), g = a2 > 1e-9 ? Math.sin(a2 / 2) / a2 : 0.5;
    w.set(rx * g, ry * g, rz * g, Math.cos(a2 / 2)).multiply(mean).premultiply(pri); // the calmer local rotation
    q.fromArray(tq.values, i * 4); D.push(w.clone().invert().multiply(q)); w.toArray(tq.values, i * 4);
  }
  const at = (t) => { let i = 0; while (i < n - 2 && tq.times[i + 1] < t) i++; const t0 = tq.times[i], t1 = tq.times[i + 1], k = t1 > t0 ? clamp((t - t0) / (t1 - t0), 0, 1) : 0; return rel.copy(D[i]).slerp(D[i + 1], k); };
  for (const c of hips.children) { // what was taken out of the pelvis goes back into its children
    const tc = c.isBone && find(c.name + '.quaternion'); if (!tc || tc.values.length !== tc.times.length * 4 || CALMED.has(tc.values)) continue; CALMED.add(tc.values);
    for (let j = 0; j < tc.times.length; j++) { q.fromArray(tc.values, j * 4); w.copy(tc.times.length === n ? D[j] : at(tc.times[j])).multiply(q).toArray(tc.values, j * 4); }
  }
  const tp = find('Hips.position');
  if (tp && tp.values.length === tp.times.length * 3 && !CALMED.has(tp.values)) { // sideways sway only
    CALMED.add(tp.values); const ax = new THREE.Vector3(1, 0, 0).applyQuaternion(pri), v = tp.values, m = tp.times.length; let mid = 0;
    for (let i = 0; i < m; i++) mid += (v[i * 3] * ax.x + v[i * 3 + 1] * ax.y + v[i * 3 + 2] * ax.z) / m;
    for (let i = 0; i < m; i++) { const k = (v[i * 3] * ax.x + v[i * 3 + 1] * ax.y + v[i * 3 + 2] * ax.z - mid) * (1 - kSway); v[i * 3] -= ax.x * k; v[i * 3 + 1] -= ax.y * k; v[i * 3 + 2] -= ax.z * k; }
  }
}
function walkPace(rig, root) { // metres per second the Walk clip really covers, so the feet slide as little as possible
  const a = rig.act.Walk; let foot = null; root.traverse((o) => { if (o.isBone && o.name === 'LeftFoot') foot = o; });
  if (!a || !foot || !root.parent) return 0;
  const d = a.getClip().duration, N = 96, zs = []; let lo = Infinity, hi = -Infinity, cycles = 0;
  for (const k in rig.act) rig.act[k].setEffectiveWeight(k === 'Walk' ? 1 : 0);
  for (let i = 0; i < N; i++) { a.time = (d * i) / N; rig.mixer.update(0); root.updateMatrixWorld(true); const z = root.parent.worldToLocal(foot.getWorldPosition(V1)).z; zs.push(z); lo = Math.min(lo, z); hi = Math.max(hi, z); }
  const mid = (lo + hi) / 2; for (let i = 0; i < N; i++) if (zs[i] < mid && zs[(i + 1) % N] >= mid) cycles++; // a clip can hold several strides
  a.time = 0; return (2 * (hi - lo) * Math.max(cycles, 1)) / d;
}
const paceFor = (natural) => clamp(CFG.speed / (natural || CFG.speed) / 1.25, 0.8, 1.6); // a brisk walk, never a sped-up waddle
function rigActions(g, root, names) { // one looping action per clip; driven clips stay paused
  const mixer = new THREE.AnimationMixer(root), act = {};
  for (const clip of g.animations) { stripRootMotion(clip); if (/walk|stroll/i.test(clip.name)) calmGait(clip, root, 0.5, 0.62, 0.85); const a = mixer.clipAction(clip); a.play(); a.setEffectiveWeight(0); act[clip.name] = a; }
  if (!act.Walk) { const first = g.animations[0]; if (first) act.Walk = act[first.name]; }
  if (!act.Idle && act.Walk) { const c = act.Walk.getClip(); const a = mixer.clipAction(poseClip(c, c.duration * 0.25, 'Idle')); a.play(); a.setEffectiveWeight(0); act.Idle = a; }
  for (const k of names) if (act[k]) act[k].paused = true;
  return { mixer, act };
}
function scan(H, name, score) { // sample a clip and return the time where score() is smallest
  const a = H.act[name]; if (!a) return 0; const d = a.getClip().duration; let best = 0, bv = Infinity;
  for (const k in H.act) H.act[k].setEffectiveWeight(k === name ? 1 : 0);
  for (let i = 0; i <= 48; i++) { a.time = (d * i) / 48; H.mixer.update(0); H.root.updateMatrixWorld(true); const v = score(); if (v < bv) { bv = v; best = a.time; } }
  a.time = 0; return best;
}
function setupHero(g) {
  if (!g) { const cap = new THREE.Mesh(new THREE.CapsuleGeometry(0.32, 1.05, 6, 12), new THREE.MeshStandardMaterial({ color: 0xe8dec8, roughness: 1 })); cap.position.y = 0.85; hero.add(cap); return; }
  const root = g.scene; fitHuman(root, 1.75); hero.add(root); HERO.root = root; HERO.body = root;
  root.traverse((o) => { if (o.isBone) HERO.bones[o.name] = o; });
  Object.assign(HERO, rigActions(g, root, ['Horn', 'Kneel']));
  { // the upright stroll reads better from behind than the brisk clip; drop the clips that are not used
    const A0 = HERO.act; if (A0.Stroll) { if (A0.Walk) A0.Walk.stop(); A0.Walk = A0.Stroll; delete A0.Stroll; }
    for (const k of Object.keys(A0)) if (k.includes('|')) { A0[k].stop(); delete A0[k]; }
  }
  const B = HERO.bones;
  if (HERO.act.Horn && B.Head && B.RightHand && B.LeftHand) HERO.hornT = scan(HERO, 'Horn', () => Math.min(B.RightHand.getWorldPosition(V1).distanceTo(B.Head.getWorldPosition(V2)), B.LeftHand.getWorldPosition(V3).distanceTo(V2)));
  if (HERO.act.Kneel && B.Hips) HERO.kneelT = scan(HERO, 'Kneel', () => B.Hips.getWorldPosition(V1).y);
  HERO.natural = walkPace(HERO, root); HERO.stride = paceFor(HERO.natural);
  for (const k in HERO.act) { HERO.w[k] = k === 'Idle' ? 1 : 0; HERO.act[k].setEffectiveWeight(HERO.w[k]); }
  HERO.mixer.update(0);
}
function heroAnim(dt) {
  if (!HERO.mixer) return; const A = HERO.act; let want = P.state; if (!A[want]) want = 'Idle';
  for (const k in A) { HERO.w[k] = damp(HERO.w[k] || 0, k === want ? 1 : 0, 8, dt); A[k].setEffectiveWeight(HERO.w[k]); }
  if (A.Walk) A.Walk.timeScale = HERO.stride;
  if (A.Horn) { HERO.hornK = damp(HERO.hornK, want === 'Horn' ? 1 : 0, 7, dt); A.Horn.time = HERO.hornT * HERO.hornK; }
  if (A.Kneel) { const d = HERO.kneelGoal - HERO.kneelAt; HERO.kneelAt += clamp(d, -dt * 1.1, dt * 1.1); A.Kneel.time = HERO.kneelAt; }
  HERO.mixer.update(dt);
}
let horn = null;
function setupHorn(g) {
  if (!g) return; let mesh = null; g.scene.updateMatrixWorld(true); g.scene.traverse((o) => { if (o.isMesh && !mesh) mesh = o; }); if (!mesh) return;
  fixMat(mesh.material); const geo = mesh.geometry.clone(); geo.applyMatrix4(mesh.matrixWorld); geo.computeBoundingBox();
  const p = geo.attributes.position, bb = geo.boundingBox, size = bb.getSize(new THREE.Vector3()), ax = size.x > size.y && size.x > size.z ? 'x' : size.y > size.z ? 'y' : 'z';
  const lo = bb.min[ax], len = size[ax], ends = [[new THREE.Vector3(), 0, 0], [new THREE.Vector3(), 0, 0]], mid = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) { V1.fromBufferAttribute(p, i); mid.add(V1); const f = (V1[ax] - lo) / len, e = f < 0.16 ? ends[0] : f > 0.84 ? ends[1] : null; if (e) { e[0].add(V1); e[1]++; } }
  mid.divideScalar(p.count); for (const e of ends) e[0].divideScalar(e[1] || 1);
  for (let i = 0; i < p.count; i++) { V1.fromBufferAttribute(p, i); const f = (V1[ax] - lo) / len, e = f < 0.16 ? ends[0] : f > 0.84 ? ends[1] : null; if (e) e[2] += V1.distanceTo(e[0]); }
  const narrow = ends[0][2] / (ends[0][1] || 1) < ends[1][2] / (ends[1][1] || 1) ? 0 : 1, mouth = ends[narrow][0], bell = ends[1 - narrow][0];
  const dir = bell.clone().sub(mouth), L = dir.length(); dir.normalize();
  const q = new THREE.Quaternion().setFromUnitVectors(dir, new THREE.Vector3(0, 0, 1));
  geo.translate(-mouth.x, -mouth.y, -mouth.z); geo.applyQuaternion(q); geo.scale(0.62 / L, 0.62 / L, 0.62 / L);
  const belly = mid.sub(mouth).applyQuaternion(q); geo.rotateZ(-Math.PI / 2 - Math.atan2(belly.y, belly.x)); // the curve hangs down
  horn = new THREE.Mesh(geo, mesh.material); horn.castShadow = true; horn.visible = false; scene.add(horn);
}

// ── companions: the ones who were walking with you all along ──────────────
const COMP = [];
const TRAIL = [];
function addCompanions(list) { // list of [gltf, height]
  let idx = 0;
  for (let round = 0; round < 2; round++) for (const [g, height] of list) {
    if (!g) continue;
    const root = round === 0 ? g.scene : cloneSkinned(g.scene);
    if (round === 0) fitHuman(root, height); // the clone copies the fitted transform
    const holder = new THREE.Group(); holder.add(root); holder.visible = false; scene.add(holder);
    const { mixer, act } = rigActions(g, root, []);
    if (act.Cheer) act.Cheer.setLoop(THREE.LoopRepeat);
    const natural = walkPace({ mixer, act }, root);
    for (const k in act) act[k].time = R() * 2;
    COMP.push({ holder, mixer, act, w: {}, x: 0, z: 0, heading: 0, lag: 2.6 + idx * 1.5, side: (idx % 2 ? 1 : -1) * (0.75 + R() * 0.85), state: 'Idle', on: false, natural, stride: paceFor(natural) * (0.95 + R() * 0.08) });
    idx++;
  }
}
function trailPoint(lag, side, out) { // a spot `lag` metres back along the player's path
  let acc = 0, ax = P.x, az = P.z;
  for (let i = TRAIL.length - 1; i >= 0; i--) {
    const t = TRAIL[i], d = Math.hypot(ax - t.x, az - t.z);
    if (acc + d >= lag) { const k = (lag - acc) / (d || 1), nx = (az - t.z) / (d || 1), nz = -(ax - t.x) / (d || 1); out.x = ax + (t.x - ax) * k + nx * side; out.z = az + (t.z - az) * k + nz * side; return out; }
    acc += d; ax = t.x; az = t.z;
  }
  out.x = ax - Math.sin(P.heading) * (lag - acc) + Math.cos(P.heading) * side; out.z = az - Math.cos(P.heading) * (lag - acc) - Math.sin(P.heading) * side; return out;
}
function showCompanions(snap) {
  const n = QL.tier === 'high' ? CFG.n.comp[0] : CFG.n.comp[1];
  COMP.forEach((c, i) => { c.on = i < n; c.holder.visible = c.on; if (c.on && snap) { trailPoint(c.lag, c.side, WP); c.x = WP.x; c.z = WP.z; c.y = groundY(c.x, c.z); c.heading = P.heading; } });
}
function updateCompanions(dt) {
  if (P.moving && (!TRAIL.length || Math.hypot(P.x - TRAIL[TRAIL.length - 1].x, P.z - TRAIL[TRAIL.length - 1].z) > 0.6)) { TRAIL.push({ x: P.x, z: P.z }); if (TRAIL.length > 260) TRAIL.shift(); }
  for (const c of COMP) {
    if (!c.on) continue;
    let want = 'Idle';
    if (G.cheer && c.act.Cheer) want = 'Cheer';
    else {
      trailPoint(c.lag, c.side, WP); const dx = WP.x - c.x, dz = WP.z - c.z, d = Math.hypot(dx, dz);
      if (d > 0.35) { const sp = Math.min(CFG.speed * 1.2, d * 2.2 + 0.4), k = Math.min(1, (sp * dt) / d); c.x += dx * k; c.z += dz * k; c.heading = lerpAngle(c.heading, Math.atan2(dx, dz), 1 - Math.exp(-8 * dt)); want = 'Walk'; }
      else if (G.stage === 4 || G.cheer) c.heading = lerpAngle(c.heading, Math.atan2(CFG.cx - c.x, CFG.cz - c.z), 1 - Math.exp(-3 * dt));
      else c.heading = lerpAngle(c.heading, Math.atan2(P.x - c.x, P.z - c.z), 1 - Math.exp(-1.5 * dt));
    }
    if (G.cheer) c.heading = lerpAngle(c.heading, Math.atan2(CFG.cx - c.x, CFG.cz - c.z), 1 - Math.exp(-3 * dt));
    for (const k in c.act) { c.w[k] = damp(c.w[k] || 0, k === want ? 1 : 0, 7, dt); c.act[k].setEffectiveWeight(c.w[k]); }
    if (c.act.Walk) c.act.Walk.timeScale = c.stride;
    c.mixer.update(dt); c.y = damp(c.y || 0, groundY(c.x, c.z), 14, dt); c.holder.position.set(c.x, c.y, c.z); c.holder.rotation.y = c.heading;
  }
}
