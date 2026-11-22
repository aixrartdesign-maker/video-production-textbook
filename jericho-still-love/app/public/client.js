/**
 * 그럼에도, 사랑하시기에 — a six-scene 3D walk around Jericho.
 * Rendering, input, audio and scene flow run here; src/logic.js keeps the
 * authoritative progress record on the server (one private room per player).
 */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone as cloneSkinned } from 'three/addons/utils/SkeletonUtils.js';

const $ = (s) => document.querySelector(s);
const qs = new URLSearchParams(location.search);
const DEBUG = qs.has('debug');
const LAB = qs.has('lab');
const TS = Math.max(1, Math.min(60, Math.round(Number(qs.get("ts")) || 1)));
const COARSE = matchMedia('(pointer: coarse)').matches;
const CALM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const TAU = Math.PI * 2;
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const damp = (a, b, k, dt) => lerp(a, b, 1 - Math.exp(-k * dt));
const smooth = (t) => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
function lerpAngle(a, b, t) { let d = (b - a) % TAU; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; return a + d * t; }
function easeOutBack(t) { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); }
function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const R = rng(20261207);
const store = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* private mode */ } };
const load = (k) => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch { return null; } };
const drop = (k) => { try { localStorage.removeItem(k); } catch { /* ignore */ } };
const SET = Object.assign({ sound: true, voice: true, haptics: true, big: false, fp: false, quality: 'auto' }, load('jericho:set') || {});
if (qs.get('q')) SET.quality = qs.get('q');
const buzz = (p) => { if (SET.haptics && navigator.vibrate) { try { navigator.vibrate(p); } catch { /* ignore */ } } };

// ── strings: every player-visible line lives here ──────────────────────────
const STR = {
  lead: '여리고 앞에 선 순례자가 되어 여섯 장면을 걷습니다. 두려움을 마주하고, 그저 걷고, 나팔을 불어 보세요.',
  verse0: '여호와께서 여호수아에게 이르시되\n보라 내가 여리고와 그 왕과 용사들을 네 손에 붙였으니', ref0: '여호수아 6:2 · 개역한글',
  verse1: '내가 네게 명한 것이 아니냐 마음을 강하게 하고 담대히 하라\n두려워 말며 놀라지 말라\n네가 어디로 가든지 네 하나님 여호와가 너와 함께 하느니라 하시니라', ref1: '여호수아 1:9 · 개역한글',
  tips: ['이어폰을 끼면 더 깊이 들립니다', '자동 걷기 버튼으로 한 손으로도 걸을 수 있어요', '끝까지 걷는 데 6분쯤 걸립니다'],
  easy: '편하게 걷기', easySub: '자동으로 길을 따라 걷습니다', manual: '직접 걷기', manualSub: '손가락으로 방향을 정합니다', resume: '이어서 걷기',
  skip: '화면을 누르면 건너뜁니다',
  hintTouch: '왼쪽을 끌어 걷기 · 오른쪽을 끌어 둘러보기', hintKeys: 'WASD · 방향키로 걷기 · 드래그로 둘러보기',
  hintEasyTouch: '자동으로 걷는 중 · 화면을 끌어 둘러보기', hintEasyKeys: '자동으로 걷는 중 · 드래그로 둘러보기 · F 키로 끄기',
  turn: '이쪽으로', close: '닫기', optView: '시점', v3: '3인칭', v1: '1인칭',
  auto: '자동 걷기',
  stages: [null,
    { no: '01', name: '건너다', goal: '물이 멈춘 요단강, 마른 강바닥을 걸어 건너세요' },
    { no: '02', name: '마주하다', goal: '빛기둥까지 걸어가 여리고 성을 마주하세요' },
    { no: '03', name: '나아가다', goal: '빛을 따라 성 둘레를 걸으세요' },
    { no: '04', name: '무너지다', goal: COARSE ? '화면의 나팔을 눌러 불어 주세요' : '나팔을 누르거나 스페이스 키를 눌러 불어 주세요' },
    { no: '05', name: '돌아보다', goal: '무너진 성 한가운데, 돌무더기까지 걸어가세요' },
    { no: '06', name: '다시, 나아가다', goal: '해가 뜨는 쪽으로, 다시 걸어 나가세요' }],
  lines: {
    intro: '강 앞에 섰습니다.\n물이 갈라진 길로, 한 걸음 내디뎌 보세요.',
    crossed: '건넜습니다.\n들어선 것만으로, 이미 두려움을 한 번 이겨낸 것입니다.',
    face: '높고 견고한 성이 앞을 막고 있습니다.\n피하지 말고, 가까이 가서 마주해 보세요.',
    choose: '당신 앞의 여리고는, 무엇인가요?',
    march: '무너뜨리려 애쓰지 않아도 됩니다.\n빛을 따라, 그저 성 둘레를 걸으세요.',
    d1: '첫째 날.\n아무 일도 일어나지 않았습니다.',
    d2: '둘째 날.\n그래도, 걸었습니다.',
    d3: '셋째 날.\n성은 여전히 높습니다.',
    d4: '넷째 날.\n돌아보니, 혼자 걷는 길이 아니었습니다.',
    d5: '다섯째 날.\n침묵 속에서도, 약속은 그대로입니다.',
    d6: '여섯째 날.\n오늘도, 한 걸음이면 충분합니다.',
    d7: '일곱째 날.\n이제, 나팔을 들 시간입니다.',
    fallen1: '여리고가, 무너졌습니다.',
    fallen2: '두려움 그 자체였던 성.\n그 잔해 사이로, 꽃이 피어납니다.',
    reflect: '무너진 성 한가운데로 걸어가,\n지나온 길을 돌아보세요.',
    cairn: '이 자리에, 오늘의 마음을\n돌 하나로 남겨 두세요.',
    again: '이제 다시, 일상으로 걸어갈 시간입니다.\n해가 뜨는 쪽으로 나아가세요.',
    ending: '두려움을 마주한 것이 끝이 아닙니다.\n일상에서도, 함께 걷는 분이 계십니다.',
    gauto: '자동으로 길을 따라 걷습니다.\n화면을 끌면, 주변을 둘러볼 수 있어요.',
    guide: '바닥의 금색 화살표를 따라,\n빛기둥까지 걸어가 보세요.',
    lost: '길을 찾기 어려우시면,\n아래의 자동 걷기 버튼을 눌러 주세요.',
    blow: '화면의 나팔을 눌러, 힘껏 불어 주세요.',
  },
  dayNames: ['첫째 날', '둘째 날', '셋째 날', '넷째 날', '다섯째 날', '여섯째 날', '일곱째 날'],
  chooseH: '당신 앞의 여리고는 무엇인가요?',
  chooseP: '지금 가장 높게 느껴지는 벽 하나를 골라 주세요. 성문 위에 새겨집니다.',
  blow: '나팔\n불기',
  writeH: '돌 하나를 남기다',
  writeP: '나의 여리고 앞에서 느낀 마음을 한 줄 적어 보세요. 이 기기에만 남습니다.',
  notePh: '예) 무서웠지만, 그래도 한 걸음 걸었다.',
  skipWrite: '말없이 놓기', keep: '돌 놓기',
  save: '카드 저장', roam: '다시, 나아가기', again: '메시지 카드', replay: '처음부터 다시',
  pauseH: '잠시 멈춤', cont: '계속 걷기', restart: '처음부터',
  optSound: '소리', optVoice: '내레이션 음성', optHaptic: '진동', optBig: '큰 글씨', optQuality: '화질', optFull: '전체 화면',
  on: '켬', off: '끔', qauto: '자동', qhigh: '높음', qlow: '낮음', open: '열기',
  lost: '화면 연결이 끊겼습니다.', reload: '다시 불러오기',
  cardTop: 'JERICHO  ·  STILL, HIS LOVE',
  cardTitle: ['그럼에도,', '사랑하시기에'],
  cardMine: '나의 여리고',
  cardCore: '그럼에도 우리를 사랑하시고, 선한 길로 이끄시는 하나님',
  cardWho: '광림교회 청년선교국 달레트팀 × 미술인선교회',
};
const FEARS = [
  { id: 'anxiety', label: '불안', msg: '염려가 가득한 날에도, 함께 걷는 분이 계십니다.', ref: '여호수아 1:9' },
  { id: 'loneliness', label: '외로움', msg: '혼자 도는 길이 아니었습니다. 처음부터 함께였습니다.', ref: '이사야 41:10' },
  { id: 'failure', label: '실패', msg: '무너진 자리는 끝이 아니라, 꽃이 피는 자리입니다.', ref: '예레미야애가 3:22–23' },
  { id: 'tomorrow', label: '내일', msg: '보이지 않는 내일도, 선한 길 위에 놓여 있습니다.', ref: '예레미야 29:11' },
];

// ── tuning numbers ─────────────────────────────────────────────────────────
const CFG = {
  speed: 1.9, cx: 0, cz: -30, wallR: 32, keepOut: 40.6, blockH: 2, blockD: 2.6, beaconR: 47, reach: 3.0, wz: 3, wr: 112,
  riverZ0: 50, riverZ1: 66, pathHalf: 3.4, startZ: 84, blowSeconds: 1.3, gravity: -18,
  camDist: 6.8, camPitch: 0.3, endZ: -92,
  // instance counts: [high, low]
  n: { flowers: [150, 90], rubble: [12, 8], palms: [20, 11], acacia: [9, 5], rocks: [40, 22], grass: [170, 80], reeds: [46, 22], houses: [10, 6], comp: [6, 3] },
};

// ── state ──────────────────────────────────────────────────────────────────
const G = { phase: 'title', stage: 0, now: 0, slow: 1, paused: false, collapsed: false, hope: 0, hopeStart: Infinity, day: 0, fear: null, note: '', target: null, shake: 0, camDist: CFG.camDist, lookY: 2, ov: null, intro: 0, kneel: false, ended: false, frames: 0 };
const P = { x: 0, y: 0, z: CFG.startZ, heading: Math.PI, moving: false, state: 'Idle', step: 0, foot: 1 };
const CAM = { yaw: 0, pitch: CFG.camPitch };
const AUTO = { on: false };
const COL = [];
const timers = [];
const later = (sec, fn) => timers.push({ t: G.now + sec, fn });

// ── renderer / scene / light ───────────────────────────────────────────────
const canvas = $('#c');
let renderer;
try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' }); }
catch (e) { $('#nogl').hidden = false; $('#title').hidden = true; throw e; }
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); $('#lost').hidden = false; });
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(58, 1, 0.3, 700);
const MOOD = {
  fogA: new THREE.Color(0x8d8a86), fogB: new THREE.Color(0xf1d6a4),
  bgA: new THREE.Color(0x6e6f73), bgB: new THREE.Color(0xf3c58f),
  hemiSkyA: new THREE.Color(0xbfc3cc), hemiSkyB: new THREE.Color(0xffe8c2),
  hemiGndA: new THREE.Color(0x6b655c), hemiGndB: new THREE.Color(0x94703f),
  sunA: new THREE.Color(0xd4d7dd), sunB: new THREE.Color(0xffc56e),
  wA1: new THREE.Color(0x3d5f6e), wA2: new THREE.Color(0x6a5a40), wB1: new THREE.Color(0x7fa2af), wB2: new THREE.Color(0xe9bd7c),
  moteA: new THREE.Color(0xc9bea6), moteB: new THREE.Color(0xfff0c4),
  ridgeFarA: new THREE.Color(0x7f8187), ridgeFarB: new THREE.Color(0xe0b48a), ridgeNearA: new THREE.Color(0x6c6c70), ridgeNearB: new THREE.Color(0xc79368),
  dirA: new THREE.Vector3(-0.35, 0.8, 0.45).normalize(), dirB: new THREE.Vector3(-0.14, 0.3, -0.94).normalize(),
};
const SUNDIR = MOOD.dirA.clone(), WHITE = new THREE.Color(0xffffff);
scene.background = MOOD.bgA.clone();
scene.fog = new THREE.FogExp2(MOOD.fogA.getHex(), 0.0105);
const hemi = new THREE.HemisphereLight(0xbfc3cc, 0x6b655c, 1.7);
const sun = new THREE.DirectionalLight(0xd4d7dd, 1.5);
sun.shadow.mapSize.set(2048, 2048);
{ const sc = sun.shadow.camera; sc.left = -46; sc.right = 46; sc.top = 46; sc.bottom = -46; sc.near = 1; sc.far = 260; }
sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.6;
scene.add(hemi, sun, sun.target);
const WORLD = { mouth: [0.75, 0.45, 0.03, -0.03], citadelYaw: 0, tentYaw: 0, fireOff: [0, 0] }; // things applyMood and the frame loop reach into once built
function applyMood(h) {
  scene.fog.color.lerpColors(MOOD.fogA, MOOD.fogB, h);
  scene.fog.density = lerp(0.0105, 0.0052, h);
  scene.background.lerpColors(MOOD.bgA, MOOD.bgB, h);
  hemi.color.lerpColors(MOOD.hemiSkyA, MOOD.hemiSkyB, h);
  hemi.groundColor.lerpColors(MOOD.hemiGndA, MOOD.hemiGndB, h);
  hemi.intensity = lerp(1.7, 2.0, h);
  sun.color.lerpColors(MOOD.sunA, MOOD.sunB, h);
  sun.intensity = lerp(1.5, 2.9, h);
  sun.shadow.intensity = lerp(0.42, 0.8, h);
  SUNDIR.lerpVectors(MOOD.dirA, MOOD.dirB, h).normalize();
  if (WORLD.skyHope) {
    WORLD.skyHope.material.opacity = h; WORLD.skyFear.visible = h < 1;
    if (h >= 1 && WORLD.skyHope.material.transparent) { WORLD.skyHope.material.transparent = false; WORLD.skyHope.material.needsUpdate = true; WORLD.skyHope.renderOrder = -11; }
  }
  if (WORLD.waterU) { WORLD.waterU.cA.value.lerpColors(MOOD.wA1, MOOD.wA2, h); WORLD.waterU.cB.value.lerpColors(MOOD.wB1, MOOD.wB2, h); if (WORLD.wallMat) WORLD.wallMat.color.copy(WORLD.waterU.cB.value).lerp(WHITE, 0.25); }
  if (WORLD.sunSprite) WORLD.sunSprite.material.opacity = h * 0.95;
  if (WORLD.ridges) for (const r of WORLD.ridges) r.material.color.lerpColors(r.userData.near ? MOOD.ridgeNearA : MOOD.ridgeFarA, r.userData.near ? MOOD.ridgeNearB : MOOD.ridgeFarB, h);
  if (WORLD.fires) for (const f of WORLD.fires) if (f.userData.wall) f.visible = !G.collapsed;
  if (WORLD.motes) { const m = WORLD.motes.material; m.color.lerpColors(MOOD.moteA, MOOD.moteB, h); m.opacity = lerp(0.28, 0.9, h); m.size = lerp(0.2, 0.34, h); }
}

// ── loading helpers ────────────────────────────────────────────────────────
const manager = new THREE.LoadingManager();
manager.onProgress = (_u, done, total) => { $('#bar i').style.width = Math.round((done / total) * 100) + '%'; };
const texLoader = new THREE.TextureLoader(manager);
const gltfLoader = new GLTFLoader(manager);
function tex(name, repeat, ext = 'jpg') {
  const t = texLoader.load(`/assets/tex/${name}.${ext}`);
  t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); }
  t.anisotropy = 4;
  return t;
}
const glb = (name) => new Promise((res) => gltfLoader.load(`/assets/models/${name}.glb`, res, undefined, () => res(null)));
function canvasTex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function fixMat(m) { if (!m) return; m.metalness = 0; m.roughness = 0.95; m.side = THREE.DoubleSide; }
const dummy = new THREE.Object3D();
const V1 = new THREE.Vector3(), V2 = new THREE.Vector3(), V3 = new THREE.Vector3();

// ── terrain: one height field for the ground mesh and everything standing on it ──
const TER = { n: 210, cell: 1.6, x0: -168, z0: CFG.wz - 168 }; // a 336 m square centred on the middle of the world
const RIV = { z0: 48.2, z1: 67.8, slope: 3.2, bar: 0.95, deep: 1.95, level: -1.3 }; // the dry bar you cross lies higher than the pools left on either side
function hash2(ix, iz) { let h = (Math.imul(ix, 374761393) + Math.imul(iz, 668265263)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
function vnoise(x, z) {
  const ix = Math.floor(x), iz = Math.floor(z), fx = x - ix, fz = z - iz, u = fx * fx * (3 - 2 * fx), v = fz * fz * (3 - 2 * fz);
  const a = hash2(ix, iz), b = hash2(ix + 1, iz), c = hash2(ix, iz + 1), d = hash2(ix + 1, iz + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
const riverMask = (z) => smooth((z - RIV.z0) / RIV.slope) * smooth((RIV.z1 - z) / RIV.slope);
function terrainH(x, z) {
  const dC = Math.hypot(x - CFG.cx, z - CFG.cz), dW = Math.hypot(x, z - CFG.wz), dR = Math.abs(z - 58);
  const flat = smooth((dC - (CFG.wallR + 6.8)) / 6.5);                              // the fortress stands on a level pad
  const camp = 0.3 + 0.7 * smooth((Math.hypot(x - 2, z - 92) - 20) / 12); // the camp is pitched on calmer ground
  const road = 0.5 + 0.5 * smooth((Math.abs(x) - 5) / 14);           // the trodden way is gentler than the open sand
  const micro = vnoise(x * 0.11 + 7.3, z * 0.11 - 2.1) * 0.6 + vnoise(x * 0.19 - 11, z * 0.19 + 5.5) * 0.4;
  const meso = vnoise(x * 0.034 + 3.7, z * 0.034 + 9.2);
  const dune = vnoise(x * 0.018 - 4.2, z * 0.018 + 1.1) * 0.7 + vnoise(x * 0.041 + 8.8, z * 0.041 - 6.3) * 0.3;
  const far = smooth((dC - (CFG.beaconR + 10)) / 45) * smooth((dR - 11) / 16);
  let h = ((micro * 0.52 + meso * 1.15 * road * (0.45 + 0.55 * smooth((dR - 10) / 10))) + dune * far * road * 6.4) * camp * flat;
  const rm = riverMask(z); if (rm > 0) h = lerp(h, -RIV.bar - (RIV.deep - RIV.bar) * smooth((Math.abs(x) - 4.5) / 6) + micro * 0.2, rm);
  return lerp(h, -5, smooth((dW - 134) / 22));                          // slips under the far dunes
}
{
  const s = TER.n + 1; TER.h = new Float32Array(s * s);
  for (let j = 0; j < s; j++) for (let i = 0; i < s; i++) TER.h[j * s + i] = terrainH(TER.x0 + i * TER.cell, TER.z0 + j * TER.cell);
}
function groundY(x, z) { // exactly the surface of the mesh below
  const fx = (x - TER.x0) / TER.cell, fz = (z - TER.z0) / TER.cell, n = TER.n;
  if (!(fx >= 0 && fz >= 0 && fx < n && fz < n)) return -5;
  const i = fx | 0, j = fz | 0, u = fx - i, v = fz - j, s = n + 1, a = TER.h[j * s + i], b = TER.h[j * s + i + 1], c = TER.h[(j + 1) * s + i], d = TER.h[(j + 1) * s + i + 1];
  return u + v <= 1 ? a + (b - a) * u + (c - a) * v : d + (c - d) * (1 - u) + (b - d) * (1 - v);
}
function lowY(x, z, r) { return Math.min(groundY(x, z), groundY(x + r, z), groundY(x - r, z), groundY(x, z + r), groundY(x, z - r)); }

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
  LOOPS.fear = mkLoop('m_fear', 0.8, SND.music); LOOPS.steps = mkLoop('steps', 0); LOOPS.river = mkLoop('river', 0); LOOPS.fire = mkLoop('fire', 0);
  if (save) resumeAt(save); else { drop('jericho:save'); G.phase = 'intro'; G.intro = 0; cine(true); $('#skipHint').hidden = false; later(1.3, () => { if (G.phase === 'intro') say('intro', 6); }); }
  netConnect();
}
function skipIntro() { if (G.phase === 'intro' && G.intro > 0.7) G.intro = 99; }
function endIntro() {
  cine(false); $('#skipHint').hidden = true; G.phase = 'play'; setStage(1); setTarget({ x: 0, z: CFG.riverZ0 - 6 });
  if (AUTO.easy) later(1.4, () => { setAuto(true); say('gauto', 5); showHint(COARSE ? STR.hintEasyTouch : STR.hintEasyKeys); later(10, hideHint); });
  else { showHint(COARSE ? STR.hintTouch : STR.hintKeys); later(4.5, () => { if (!G.movedOnce && G.phase === 'play') say('guide', 5); }); }
}
function onReach() {
  if (G.stage === 1) { say('crossed', 6); setStage(2); setTarget({ x: CFG.cx, z: CFG.cz + CFG.beaconR }); later(7.4, () => { if (G.stage === 2 && G.phase === 'play') say('face', 7); }); }
  else if (G.stage === 2) { G.phase = 'modal'; dropInput(); setTarget(null); $('#choose').hidden = false; say('choose', 4); }
  else if (G.stage === 3) reachDay();
  else if (G.stage === 5) atCairn();
  else if (G.stage === 6) ending();
}
function pickFear(f) {
  G.fear = f; netSend({ type: 'fear', value: f.id }); drawWord(f.label); $('#choose').hidden = true;
  G.day = 0; TRAIL.length = 0; setStage(3); setLamps(); resumePlay(); setTarget(beaconPos(1)); say('march', 8);
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
      P.step += Math.hypot(P.x - px, P.z - pz); if (P.step > 0.74) { P.step = 0; stampFoot(); }
      if (!G.movedOnce) { G.movedOnce = true; later(3, hideHint); }
    }
    if (G.target) {
      const dx = G.target.x - P.x, dz = G.target.z - P.z, d = Math.hypot(dx, dz);
      if (G.frames % 5 === 0) {
        const ang = Math.atan2(dx * rx + dz * rz, dx * fx + dz * fz), off = !AUTO.on && Math.abs(ang) > 1.05, tn = $('#turn');
        $('#dist').textContent = Math.round(d) + ' m'; $('#needle svg').style.transform = `rotate(${ang}rad)`;
        tn.hidden = !off; if (off) tn.className = ang > 0 ? 'right' : 'left';
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
  T('#skipWrite', STR.skipWrite); T('#keep', STR.keep); T('#save', STR.save); T('#roam', STR.roam); T('#autoLabel', STR.auto); T('#actLabel', STR.blow); T('#skipHint', STR.skip);
  T('#pauseH', STR.pauseH); T('#cont', STR.cont); T('#restart', STR.restart); T('#endLine', STR.lines.ending); V('#endMeet', STR.verse1); T('#endInfo', STR.ref1); T('#endWho', STR.cardWho);
  T('#endCard', STR.again); T('#endReplay', STR.replay); T('#lostText', STR.lost); T('#reload', STR.reload); T('#turnText', STR.turn);
  for (const f of FEARS) { const b = document.createElement('button'); b.type = 'button'; b.textContent = f.label; b.addEventListener('click', () => pickFear(f)); $('#fears').append(b); }
  $('#easy').addEventListener('click', () => begin('easy')); $('#manual').addEventListener('click', () => begin('manual')); $('#resume').addEventListener('click', () => begin('resume'));
  $('#skipWrite').addEventListener('click', () => closeWrite('')); $('#keep').addEventListener('click', () => closeWrite($('#note').value));
  $('#save').addEventListener('click', saveCard); $('#roam').addEventListener('click', goOn);
  $('#auto').addEventListener('click', () => setAuto(!AUTO.on, true)); $('#act').addEventListener('click', pressAction);
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
  window.__g = { G, P, CAM, AUTO, HERO, COMP, W, SET, QL, FEARS, WORLD, begin, pickFear, pressAction, startCollapse, closeWrite, goOn, renderer };
  if (qs.get('stage') && SAVE) begin('resume');
});
requestAnimationFrame(frame);
