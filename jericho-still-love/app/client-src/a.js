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
  tips: ['이어폰을 끼면 더 깊이 들립니다', '자동 걷기 버튼으로 한 손으로도 걸을 수 있어요', '멀리 있는 빛을 누르면 그 자리로 바로 갈 수 있어요', '끝까지 걷는 데 6분쯤 걸립니다'],
  easy: '편하게 걷기', easySub: '자동으로 길을 따라 걷습니다', manual: '직접 걷기', manualSub: '손가락으로 방향을 정합니다', resume: '이어서 걷기',
  skip: '화면을 누르면 건너뜁니다',
  hintTouch: '왼쪽을 끌어 걷기 · 오른쪽을 끌어 둘러보기', hintKeys: 'WASD · 방향키로 걷기 · 드래그로 둘러보기',
  hintEasyTouch: '자동으로 걷는 중 · 화면을 끌어 둘러보기', hintEasyKeys: '자동으로 걷는 중 · 드래그로 둘러보기 · F 키로 끄기',
  turn: '이쪽으로', close: '닫기', optView: '시점', v3: '3인칭', v1: '1인칭',
  auto: '자동 걷기', warp: '빛으로\n바로 가기', hintWarp: '빛을 누르면 그 자리로 바로 갑니다',
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
  speed: 2.25, cx: 0, cz: -30, wallR: 32, keepOut: 40.6, blockH: 2, blockD: 2.6, beaconR: 47, reach: 3.0, wz: 3, wr: 112,
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
