/**
 * The journey rules: six scenes in order, one chosen fear, seven days in order.
 * The client is untrusted, so every shortcut must be refused here.
 */
import { describe, expect, it } from "vitest";

import * as logic from "../src/logic.js";

type Any = Record<string, unknown>;
const L = logic as unknown as {
  setup(p: string[]): Any;
  validateAction(s: Any, p: string, a: unknown): { ok: boolean; error?: string };
  applyAction(s: Any, p: string, a: unknown): Any;
  isGameOver(s: Any): { over: boolean };
  viewFor(s: Any, p: string): Any;
};

function play(state: Any, action: unknown): Any {
  expect(L.validateAction(state, "me", action).ok).toBe(true);
  return L.applyAction(state, "me", action);
}

describe("journey rules", () => {
  it("starts at scene one with nothing chosen", () => {
    expect(L.setup(["me"])).toEqual({ player: "me", stage: 1, fear: null, days: 0, noted: false });
  });

  it("refuses skipping scenes, strangers and unknown fears", () => {
    const s = L.setup(["me"]);
    expect(L.validateAction(s, "me", { type: "advance", to: 3 }).ok).toBe(false);
    expect(L.validateAction(s, "other", { type: "advance", to: 2 }).ok).toBe(false);
    const s2 = play(s, { type: "advance", to: 2 });
    expect(L.validateAction(s2, "me", { type: "fear", value: "nope" }).ok).toBe(false);
    expect(L.validateAction(s2, "me", { type: "advance", to: 3 }).ok).toBe(false);
  });

  it("needs all seven days, in order, before the wall can fall", () => {
    let s = play(L.setup(["me"]), { type: "advance", to: 2 });
    s = play(s, { type: "fear", value: "anxiety" });
    s = play(s, { type: "advance", to: 3 });
    expect(L.validateAction(s, "me", { type: "day", n: 2 }).ok).toBe(false);
    expect(L.validateAction(s, "me", { type: "advance", to: 4 }).ok).toBe(false);
    for (let n = 1; n <= 7; n++) s = play(s, { type: "day", n });
    expect(L.validateAction(s, "me", { type: "day", n: 8 }).ok).toBe(false);
    s = play(s, { type: "advance", to: 4 });
    s = play(s, { type: "advance", to: 5 });
    s = play(s, { type: "note" });
    expect(L.isGameOver(s).over).toBe(false);
    s = play(s, { type: "advance", to: 6 });
    expect(L.isGameOver(s).over).toBe(true);
    expect(L.viewFor(s, "me")).toMatchObject({ stage: 6, fear: "anxiety", days: 7, noted: true, yours: true });
    expect(L.validateAction(s, "me", { type: "advance", to: 7 }).ok).toBe(false);
  });
});
