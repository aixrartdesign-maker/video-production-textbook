
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
