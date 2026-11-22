
// ── ground, far dunes, sky ─────────────────────────────────────────────────
{
  const n = TER.n, s = n + 1, pos = new Float32Array(s * s * 3), uv = new Float32Array(s * s * 2), idx = new Uint16Array(n * n * 6);
  for (let j = 0, k = 0; j < s; j++) for (let i = 0; i < s; i++, k++) { const x = TER.x0 + i * TER.cell, z = TER.z0 + j * TER.cell; pos[k * 3] = x; pos[k * 3 + 1] = TER.h[k]; pos[k * 3 + 2] = z; uv[k * 2] = x / 6.33; uv[k * 2 + 1] = z / 6.33; }
  for (let j = 0, q = 0; j < n; j++) for (let i = 0; i < n; i++) { const a = j * s + i, b = a + 1, c = a + s, d = c + 1; idx[q++] = a; idx[q++] = c; idx[q++] = b; idx[q++] = b; idx[q++] = c; idx[q++] = d; }
  const tg = new THREE.BufferGeometry(); tg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); tg.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); tg.setIndex(new THREE.BufferAttribute(idx, 1)); tg.computeVertexNormals();
  const sandN = texLoader.load('/assets/tex/sand_n.jpg'); sandN.wrapS = sandN.wrapT = THREE.RepeatWrapping;
  const pathT = tex('path', [1, 1]);
  const groundMat = new THREE.MeshStandardMaterial({ map: tex('sand', [1, 1]), normalMap: sandN, normalScale: new THREE.Vector2(1.1, 1.1), roughness: 1, metalness: 0 });
  groundMat.onBeforeCompile = (sh) => { // slow colour drift, the trodden ways, and the wet river bed — all painted into the sand
    sh.uniforms.pathMap = { value: pathT };
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWp;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvWp = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vWp;\nuniform sampler2D pathMap;\nfloat gPath = 0.0;\nfloat gWet = 0.0;')
      .replace('#include <map_fragment>', [
        '#include <map_fragment>',
        'float mv = sin(vWp.x * 0.043 + 1.7) * sin(vWp.z * 0.037) + 0.6 * sin(vWp.x * 0.011 - vWp.z * 0.017 + 0.5) + 0.35 * sin(vWp.x * 0.19 + vWp.z * 0.23);',
        'diffuseColor.rgb *= 0.9 + 0.085 * mv;',
        'float wob = 0.55 * sin(vWp.x * 0.61 + vWp.z * 0.27) + 0.45 * sin(vWp.z * 0.83 - vWp.x * 0.33 + 1.9);',
        'float road = (1.0 - smoothstep(1.3, 3.3, abs(vWp.x) + wob * 0.6)) * step(' + (CFG.endZ - 10).toFixed(1) + ', vWp.z) * step(vWp.z, 106.0);',
        `float ringD = abs(length(vWp.xz - vec2(${CFG.cx.toFixed(1)}, ${CFG.cz.toFixed(1)})) - ${CFG.beaconR.toFixed(1)});`,
        'float ring = 1.0 - smoothstep(1.2, 3.1, ringD + wob * 0.55);',
        'gPath = max(road, ring);',
        'gWet = 1.0 - smoothstep(-0.8, -0.1, vWp.y);',
        'vec3 pcol = texture2D(pathMap, vWp.xz * 0.21).rgb;',
        'diffuseColor.rgb = mix(diffuseColor.rgb, pcol * vec3(1.9, 1.74, 1.5), gPath * 0.62 * (1.0 - gWet));',
        'diffuseColor.rgb = mix(diffuseColor.rgb, pcol * vec3(0.8, 0.74, 0.66), gWet * 0.92);',
      ].join('\n'))
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = mix(roughnessFactor, 0.4, gWet);')
      .replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>\nnormal = normalize(mix(normal, nonPerturbedNormal, gPath * 0.5));');
  };
  const ground = new THREE.Mesh(tg, groundMat); ground.receiveShadow = true; ground.frustumCulled = false; scene.add(ground);
  const under = new THREE.Mesh(new THREE.PlaneGeometry(900, 900), new THREE.MeshStandardMaterial({ map: tex('sand', [140, 140]), roughness: 1, metalness: 0, color: 0xd9cbb0 }));
  under.rotation.x = -Math.PI / 2; under.position.set(0, -5.3, CFG.wz); scene.add(under);
  const seg = 120, rings = [128, 150, 174, 202], hs = [0, 0.8, 1.3, 0.5], dp = [], du = [], di = [];
  for (let r = 0; r < rings.length; r++) for (let i = 0; i <= seg; i++) {
    const a = (i / seg) * TAU, nn = (Math.sin(a * 3 + 1.3) * 0.5 + Math.sin(a * 7 + 0.4) * 0.3 + Math.sin(a * 13 + 2.1) * 0.2) * 0.5 + 0.5;
    dp.push(Math.sin(a) * rings[r], hs[r] * (4 + nn * 15) - 0.4, CFG.wz + Math.cos(a) * rings[r]); du.push((i / seg) * 46, r * 4);
  }
  for (let r = 0; r < rings.length - 1; r++) for (let i = 0; i < seg; i++) { const a = r * (seg + 1) + i, b = a + 1, c = a + seg + 1, d = c + 1; di.push(a, c, b, b, c, d); }
  const dg = new THREE.BufferGeometry(); dg.setAttribute('position', new THREE.Float32BufferAttribute(dp, 3)); dg.setAttribute('uv', new THREE.Float32BufferAttribute(du, 2)); dg.setIndex(di); dg.computeVertexNormals();
  scene.add(new THREE.Mesh(dg, new THREE.MeshStandardMaterial({ map: tex('sand', [1, 1]), roughness: 1, metalness: 0, color: 0xe2d2b0, side: THREE.DoubleSide })));
  WORLD.ridges = [];
  for (const [rad, hMin, hMax, seed] of [[300, 26, 74, 3.1], [232, 14, 46, 7.7]]) {
    const rp = [], ri = [], nr = 150;
    for (let i = 0; i <= nr; i++) { const a = (i / nr) * TAU, k = Math.abs(Math.sin(a * 2.5 + seed)) * 0.5 + Math.abs(Math.sin(a * 6.3 + seed * 2)) * 0.3 + Math.abs(Math.sin(a * 17 + seed * 3)) * 0.2; rp.push(Math.sin(a) * rad, -6, CFG.wz + Math.cos(a) * rad, Math.sin(a) * rad, hMin + k * (hMax - hMin), CFG.wz + Math.cos(a) * rad); if (i < nr) { const v = i * 2; ri.push(v, v + 1, v + 2, v + 2, v + 1, v + 3); } }
    const rg = new THREE.BufferGeometry(); rg.setAttribute('position', new THREE.Float32BufferAttribute(rp, 3)); rg.setIndex(ri);
    const m = new THREE.Mesh(rg, new THREE.MeshBasicMaterial({ color: 0x777777, side: THREE.DoubleSide, fog: false })); m.userData.near = rad < 260; m.renderOrder = -9; scene.add(m); WORLD.ridges.push(m);
  }
  const makeSky = (name, opaque) => {
    const t = tex(name); t.wrapS = THREE.MirroredRepeatWrapping; t.repeat.x = 2;
    const m = new THREE.Mesh(new THREE.CylinderGeometry(520, 520, 600, 48, 1, true), new THREE.MeshBasicMaterial({ map: t, side: THREE.BackSide, fog: false, depthWrite: false, transparent: !opaque }));
    m.position.y = 274; m.renderOrder = opaque ? -11 : -10; m.frustumCulled = false; scene.add(m); return m;
  };
  WORLD.skyFear = makeSky('sky_fear', true); WORLD.skyHope = makeSky('sky_hope', false);
  WORLD.skyHope.material.opacity = 0; WORLD.skyHope.rotation.y = 1.19;
}

// ── the Jordan, stopped: a dry gravel bar across the bed, still pools lying lower on both sides ──
{
  const waterMat = new THREE.ShaderMaterial({
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { t: { value: 0 }, cA: { value: MOOD.wA1.clone() }, cB: { value: MOOD.wB1.clone() }, glint: { value: new THREE.Color(0xe8f3f6) } }]),
    fog: true, transparent: true,
    vertexShader: ['#include <common>', '#include <fog_pars_vertex>', 'varying vec2 vW;', 'void main() {', '  vec4 wp = modelMatrix * vec4(position, 1.0);', '  vW = wp.xz;', '  vec4 mvPosition = viewMatrix * wp;', '  gl_Position = projectionMatrix * mvPosition;', '  #include <fog_vertex>', '}'].join('\n'),
    fragmentShader: ['#include <common>', '#include <fog_pars_fragment>', 'uniform float t;', 'uniform vec3 cA;', 'uniform vec3 cB;', 'uniform vec3 glint;', 'varying vec2 vW;', 'void main() {',
      '  float n = sin(vW.x * 0.31 + t * 0.35) * sin(vW.y * 0.83 - t * 0.5) + 0.5 * sin(vW.x * 1.3 + vW.y * 1.9 + t * 0.9);',
      '  float s = smoothstep(0.8, 1.4, n);', '  vec3 col = mix(cA, cB, 0.5 + 0.3 * n) + glint * s * 0.3;',
      '  gl_FragColor = vec4(col, 0.95);', '  #include <colorspace_fragment>', '  #include <fog_fragment>', '}'].join('\n'),
  });
  WORLD.waterU = waterMat.uniforms;
  const w = new THREE.Mesh(new THREE.PlaneGeometry(880, RIV.z1 - RIV.z0 + 2), waterMat);
  w.rotation.x = -Math.PI / 2; w.position.set(0, RIV.level, (RIV.z0 + RIV.z1) / 2); w.renderOrder = 1; scene.add(w);
}

// ── the fortress of Jericho: an octagon of blocks, towers, buttresses, a gatehouse ──
const W = { n: 0, active: false, t: 0, settled: false };
const GATE = { t: -1 };
let wall, wordPlane;
function setBlock(i) {
  dummy.position.set(W.px[i], W.py[i], W.pz[i]); dummy.rotation.set(W.rx[i], W.ry[i], W.rz[i]); dummy.scale.set(W.sx[i], W.sy[i], W.sz[i]);
  dummy.updateMatrix(); wall.setMatrixAt(i, dummy.matrix);
}
function planFall(i) { // steer each block so the two roads and the plaza stay walkable
  const g = -CFG.gravity, h = Math.max(W.py[i] - W.rest[i], 0), tAir = (W.vy[i] + Math.sqrt(W.vy[i] * W.vy[i] + 2 * g * h)) / g;
  let lx = W.px[i] + W.vx[i] * tAir, lz = W.pz[i] + W.vz[i] * tAir;
  const dx = lx - CFG.cx, dz = lz - CFG.cz, rad = Math.hypot(dx, dz);
  if (Math.abs(dx) < 5.2 && Math.abs(dz) > 5 && Math.abs(dz) < CFG.wallR + 22) lx = CFG.cx + (dx >= 0 ? 1 : -1) * (5.8 + R() * 3.2);
  else if (rad < 10.5) { const k = (11.2 + R() * 3) / (rad || 1); lx = CFG.cx + dx * k; lz = CFG.cz + dz * k; }
  W.vx[i] = (lx - W.px[i]) / tAir; W.vz[i] = (lz - W.pz[i]) / tAir; W.lx[i] = lx; W.lz[i] = lz; W.rest[i] += Math.max(0, groundY(lx, lz));
}
{
  const SIDE = 2 * CFG.wallR * Math.tan(Math.PI / 8), COLS = 9, bw = SIDE / COLS, ROWS = 13, TOWER = 18, GROWS = 6, GT = 20, BD = CFG.blockD;
  const specs = []; // x, z, rotY, row, sx, sy, sz, outX, outZ, outSpeed
  for (let f = 0; f < 8; f++) {
    const phi = f * (Math.PI / 4), nx = Math.sin(phi), nz = Math.cos(phi), tx = Math.cos(phi), tz = -Math.sin(phi);
    const at = (off, rad) => [CFG.cx + nx * rad + tx * off * bw, CFG.cz + nz * rad + tz * off * bw];
    for (let r = 0; r <= ROWS; r++) for (let k = 0; k < COLS; k++) {
      const top = r === ROWS; if (top && k % 2) continue;
      let off = k - (COLS - 1) / 2 + (!top && r % 2 ? 0.5 : 0), sx = 1;
      if (f === 0 && r < GROWS && Math.abs(off) < 1.75) { if (Math.abs(off) <= 1.01) continue; off = Math.sign(off) * 1.75; sx = 0.5; }
      const cor = r === ROWS - 1, [x, z] = at(off, CFG.wallR + (cor ? 0.24 : 0)); // the last course steps out as a cornice
      specs.push([x, z, phi, r, sx, top ? 0.6 : 1, cor ? 1.18 : 1, nx, nz, 4.4]);
    }
    if (f !== 0) for (const off of [-2.5, 0, 2.5]) for (let r = 0; r <= 10; r++) { // buttresses give the long faces a rhythm
      const cap = r === 10, [x, z] = at(off, CFG.wallR + BD / 2 + (cap ? 0.36 : 0.6));
      specs.push([x, z, phi, r, 0.52, cap ? 0.5 : 1, cap ? 0.28 : 0.46, nx, nz, 3.4]);
    }
    if (f === 0) for (const side of [-1, 1]) for (let r = 0; r <= GT; r++) for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { // the gatehouse
      const top = r === GT, hh = top ? 0.74 : 0.5, sc = top ? 0.5 : 1, [x, z] = at(side * 2.75 + a * hh, CFG.wallR + 0.6 * bw + b * hh * bw);
      specs.push([x, z, phi, r, sc, top ? 0.6 : 1, (sc * bw) / BD, nx, nz, 3]);
    }
    const psi = phi + Math.PI / 8, cr = CFG.wallR / Math.cos(Math.PI / 8) + 0.6, ox = Math.sin(psi), oz = Math.cos(psi), qx = Math.cos(psi), qz = -Math.sin(psi);
    for (let r = 0; r <= TOWER; r++) for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      const top = r === TOWER, hh = top ? 0.74 : 0.5, sc = top ? 0.5 : 1;
      specs.push([CFG.cx + ox * (cr + b * hh * bw) + qx * a * hh * bw, CFG.cz + oz * (cr + b * hh * bw) + qz * a * hh * bw, psi, r, sc, top ? 0.6 : 1, (sc * bw) / BD, ox, oz, 3]);
    }
  }
  const n = specs.length; W.n = n;
  const stone = tex('stone', [0.62, 0.46]), stoneN = texLoader.load('/assets/tex/stone_n.jpg'); stoneN.wrapS = stoneN.wrapT = THREE.RepeatWrapping; stoneN.repeat.set(0.62, 0.46);
  const wallMat = new THREE.MeshStandardMaterial({ map: stone, normalMap: stoneN, normalScale: new THREE.Vector2(1.4, 1.4), roughness: 1, metalness: 0 });
  wallMat.onBeforeCompile = (sh) => { // centuries of dust: darker toward the foot of the wall
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying float vWy;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvec4 wq = vec4(transformed, 1.0);\n#ifdef USE_INSTANCING\nwq = instanceMatrix * wq;\n#endif\nvWy = (modelMatrix * wq).y;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying float vWy;').replace('#include <map_fragment>', '#include <map_fragment>\ndiffuseColor.rgb *= mix(0.66, 1.05, smoothstep(0.0, 9.0, vWy));');
  };
  wall = new THREE.InstancedMesh(new THREE.BoxGeometry(bw + 0.05, CFG.blockH, BD), wallMat, n);
  wall.frustumCulled = false; wall.castShadow = true; wall.receiveShadow = true;
  for (const k of ['px', 'py', 'pz', 'vx', 'vy', 'vz', 'rx', 'ry', 'rz', 'ax', 'ay', 'az', 'sx', 'sy', 'sz', 'delay', 'rest', 'lx', 'lz']) W[k] = new Float32Array(n);
  W.state = new Uint8Array(n);
  const col = new THREE.Color();
  specs.forEach(([x, z, ry, r, sx, sy, sz, ox, oz, spd], i) => {
    W.px[i] = x; W.pz[i] = z; W.ry[i] = ry; W.sx[i] = sx; W.sy[i] = sy; W.sz[i] = sz; W.py[i] = r * CFG.blockH + (CFG.blockH * sy) / 2;
    const sp = (1.2 + R() * spd) * (R() < 0.7 ? 1 : -0.55);
    W.vx[i] = ox * sp + (R() - 0.5) * 2; W.vz[i] = oz * sp + (R() - 0.5) * 2; W.vy[i] = R() * 3.5;
    W.ax[i] = (R() - 0.5) * 4; W.ay[i] = (R() - 0.5) * 2; W.az[i] = (R() - 0.5) * 4;
    W.delay[i] = (GT - r) * 0.085 + R() * 0.5 + (Math.abs(Math.atan2(x - CFG.cx, z - CFG.cz)) / Math.PI) * 1.7;
    W.rest[i] = 0.45 * sy + R() * R() * 2.4;
    planFall(i); setBlock(i);
    const v = 0.78 + R() * 0.2; wall.setColorAt(i, col.setRGB(v, v * 0.985, v * 0.95));
  });
  scene.add(wall);
  // battered stone base: stays after the fall, open where the gatehouse stands and where the north road leaves
  const gp = [], gu = [], gi = []; let vi = 0;
  const arc = (a0, a1) => {
    const steps = Math.round((a1 - a0) / 0.045);
    for (let s = 0; s <= steps; s++) {
      const a = a0 + ((a1 - a0) * s) / steps, loc = ((((a + Math.PI / 8) % (Math.PI / 4)) + Math.PI / 4) % (Math.PI / 4)) - Math.PI / 8, k = 1 / Math.cos(loc);
      const rt = (CFG.wallR + 1.36) * k, rb = (CFG.wallR + 5.0) * k;
      gp.push(CFG.cx + Math.sin(a) * rt, 5.2, CFG.cz + Math.cos(a) * rt, CFG.cx + Math.sin(a) * rb, -0.05, CFG.cz + Math.cos(a) * rb); gu.push(a * 8.8, 1.6, a * 8.8, 0);
      if (s < steps) gi.push(vi, vi + 1, vi + 2, vi + 2, vi + 1, vi + 3); vi += 2;
    }
  };
  arc(0.36, Math.PI - 0.2); arc(Math.PI + 0.2, TAU - 0.36);
  const gg = new THREE.BufferGeometry(); gg.setAttribute('position', new THREE.Float32BufferAttribute(gp, 3)); gg.setAttribute('uv', new THREE.Float32BufferAttribute(gu, 2)); gg.setIndex(gi); gg.computeVertexNormals();
  const glN = texLoader.load('/assets/tex/stone_n.jpg'); glN.wrapS = glN.wrapT = THREE.RepeatWrapping;
  const glacis = new THREE.Mesh(gg, new THREE.MeshStandardMaterial({ map: tex('stone', [1, 1]), normalMap: glN, roughness: 1, metalness: 0, color: 0xa39a8c, side: THREE.DoubleSide }));
  glacis.receiveShadow = true; scene.add(glacis);
  const gw = bw * 3 + 0.3, gh = GROWS * CFG.blockH;
  WORLD.gatePivot = new THREE.Group(); WORLD.gatePivot.position.set(CFG.cx, 0.02, CFG.cz + CFG.wallR - 0.45);
  const gate = new THREE.Mesh(new THREE.PlaneGeometry(gw, gh), new THREE.MeshStandardMaterial({ map: tex('gate'), roughness: 0.9, metalness: 0, side: THREE.DoubleSide }));
  gate.position.y = gh / 2; gate.castShadow = true; gate.receiveShadow = true; WORLD.gatePivot.add(gate); scene.add(WORLD.gatePivot);
  wordPlane = new THREE.Mesh(new THREE.PlaneGeometry(15.6, 3.9), new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false }));
  wordPlane.position.set(CFG.cx, gh + 5.6, CFG.cz + CFG.wallR + BD / 2 + 0.08); wordPlane.visible = false; scene.add(wordPlane);
  // watch-fires: on the gatehouse towers, and two braziers before the gate
  const flame = canvasTex(64, 64, (c) => { const g = c.createRadialGradient(32, 36, 0, 32, 32, 30); g.addColorStop(0, 'rgba(255,240,200,1)'); g.addColorStop(0.3, 'rgba(255,170,70,.85)'); g.addColorStop(1, 'rgba(255,90,20,0)'); c.fillStyle = g; c.fillRect(0, 0, 64, 64); });
  WORLD.flame = flame; WORLD.fires = []; WORLD.gateProps = new THREE.Group(); scene.add(WORLD.gateProps);
  const fire = (x, y, z, s) => { const f = new THREE.Sprite(new THREE.SpriteMaterial({ map: flame, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, transparent: true })); f.position.set(x, y, z); f.scale.setScalar(s); f.userData.s = s; f.userData.wall = true; scene.add(f); WORLD.fires.push(f); };
  const standMat = new THREE.MeshStandardMaterial({ map: tex('stone', [1, 1]), roughness: 1, metalness: 0, color: 0x8f8678 });
  for (const sd of [-1, 1]) {
    fire(CFG.cx + sd * 2.75 * bw, GT * CFG.blockH + 2.7, CFG.cz + CFG.wallR + 0.6 * bw, 4.6);
    const bx = CFG.cx + sd * 5.7, bz = CFG.cz + CFG.wallR + 6.9, by = groundY(bx, bz);
    const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.62, 1.5, 10), standMat); stand.position.set(bx, by + 0.7, bz); stand.castShadow = true; WORLD.gateProps.add(stand);
    const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.78, 0.4, 0.42, 12), standMat); bowl.position.set(bx, by + 1.62, bz); bowl.castShadow = true; WORLD.gateProps.add(bowl);
    fire(bx, by + 2.25, bz, 2.3);
  }
}
function updateWall(dt) {
  if (GATE.t >= 0 && GATE.t < 2) { GATE.t += dt; const k = clamp((GATE.t - 0.3) / 1.2, 0, 1); WORLD.gatePivot.rotation.x = k * k * (Math.PI / 2); if (k >= 1 && !GATE.thud) { GATE.thud = true; G.shake = Math.max(G.shake, 0.7); buzz(60); } }
  if (!W.active) return; W.t += dt; let busy = 0;
  for (let i = 0; i < W.n; i++) {
    if (W.state[i] === 2) continue; busy++;
    if (W.t < W.delay[i]) continue;
    W.vy[i] += CFG.gravity * dt; W.px[i] += W.vx[i] * dt; W.py[i] += W.vy[i] * dt; W.pz[i] += W.vz[i] * dt;
    W.rx[i] += W.ax[i] * dt; W.ry[i] += W.ay[i] * dt; W.rz[i] += W.az[i] * dt;
    if (W.py[i] <= W.rest[i]) { W.py[i] = W.rest[i]; W.px[i] = W.lx[i]; W.pz[i] = W.lz[i]; W.state[i] = 2; }
    setBlock(i);
  }
  wall.instanceMatrix.needsUpdate = true;
  if (!busy) { W.active = false; if (!W.settled) { W.settled = true; for (let i = 0; i < W.n; i++) COL.push({ x: W.px[i], z: W.pz[i], r: 1.5 * Math.max(W.sx[i], 0.6) }); } }
}
function drawWord(label) {
  const t = canvasTex(1024, 256, (c, w, h) => { c.clearRect(0, 0, w, h); c.font = '800 176px "JM","AppleMyungjo","Batang",serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = 'rgba(34,25,16,.82)'; c.fillText(label, w / 2, h / 2 + 8); });
  wordPlane.material.map = t; wordPlane.material.needsUpdate = true; wordPlane.visible = !G.collapsed;
}

// ── beacon (the light the player follows) ─────────────────────────────────
const beacon = new THREE.Group(); beacon.visible = false; scene.add(beacon);
{
  const alpha = canvasTex(8, 128, (c, w, h) => { const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#000'); g.addColorStop(1, '#fff'); c.fillStyle = g; c.fillRect(0, 0, w, h); });
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.62, 70, 24, 1, true), new THREE.MeshBasicMaterial({ color: 0xffe3a3, alphaMap: alpha, transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }));
  beam.position.y = 35; beacon.add(beam); beacon.userData.beam = beam;
  const ring = new THREE.Mesh(new THREE.RingGeometry(2.2, 2.75, 48), new THREE.MeshBasicMaterial({ color: 0xffd97a, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }));
  ring.rotation.x = -Math.PI / 2; ring.position.y = 0.32; beacon.add(ring); beacon.userData.ring = ring;
}
const beaconPos = (i) => { const a = (i * TAU) / 7; return { x: CFG.cx + Math.sin(a) * CFG.beaconR, z: CFG.cz + Math.cos(a) * CFG.beaconR }; };
function setTarget(t) {
  G.target = t; beacon.visible = !!t; $('#compass').hidden = !t; G.progT = G.now; G.progD = 1e9;
  if (t) { beacon.position.set(t.x, Math.max(groundY(t.x, t.z), 0), t.z); if (AUTO.want && G.phase === 'play') setAuto(true); } else { $('#turn').hidden = true; if (AUTO.on) setAuto(false); }
}
