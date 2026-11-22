/**
 * 그럼에도, 사랑하시기에 — single-player progress rules.
 * The 3D walk itself runs in the browser; this file is the authoritative record
 * of how far the pilgrim has come (six scenes, one chosen fear, seven days).
 * Pure functions only: no imports, no timers, no randomness.
 */

export const meta = {
  game: "그럼에도, 사랑하시기에",
  minPlayers: 1,
  maxPlayers: 1,
};

const FEARS = ["anxiety", "loneliness", "failure", "tomorrow"];
const LAST_STAGE = 6;

export function setup(players) {
  return { player: players[0], stage: 1, fear: null, days: 0, noted: false };
}

export function validateAction(state, playerId, action) {
  if (playerId !== state.player) return { ok: false, error: "not your journey" };
  if (!action || typeof action.type !== "string") return { ok: false, error: "bad action" };
  if (state.stage >= LAST_STAGE) return { ok: false, error: "journey complete" };
  if (action.type === "fear") {
    if (state.stage !== 2) return { ok: false, error: "not facing the wall yet" };
    if (state.fear !== null) return { ok: false, error: "already chosen" };
    if (!FEARS.includes(action.value)) return { ok: false, error: "unknown fear" };
    return { ok: true };
  }
  if (action.type === "day") {
    if (state.stage !== 3) return { ok: false, error: "not marching" };
    if (action.n !== state.days + 1 || action.n > 7) return { ok: false, error: "days go in order" };
    return { ok: true };
  }
  if (action.type === "note") {
    if (state.stage !== 5) return { ok: false, error: "not time to look back" };
    if (state.noted) return { ok: false, error: "already written" };
    return { ok: true };
  }
  if (action.type === "advance") {
    if (action.to !== state.stage + 1) return { ok: false, error: "scenes go in order" };
    if (action.to === 3 && state.fear === null) return { ok: false, error: "face your wall first" };
    if (action.to === 4 && state.days !== 7) return { ok: false, error: "walk all seven days" };
    return { ok: true };
  }
  return { ok: false, error: "unknown action" };
}

export function applyAction(state, playerId, action) {
  if (action.type === "fear") return { ...state, fear: action.value };
  if (action.type === "day") return { ...state, days: action.n };
  if (action.type === "note") return { ...state, noted: true };
  return { ...state, stage: action.to };
}

export function isGameOver(state) {
  if (state.stage >= LAST_STAGE) return { over: true, winner: state.player };
  return { over: false };
}

export function viewFor(state, playerId) {
  return {
    stage: state.stage,
    fear: state.fear,
    days: state.days,
    noted: state.noted,
    yours: state.player === playerId,
  };
}
