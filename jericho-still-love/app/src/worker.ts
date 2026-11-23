/**
 * The Worker entry — everything that is not a static file lands here.
 *
 * Its whole job is routing a WebSocket upgrade to the right room. Static files
 * (`dist/client`) are served by the platform BEFORE this runs, so `/`,
 * `/client.js` and friends never reach this code.
 *
 * The `Room` re-export is required: a Durable Object class must be exported from
 * the Worker's entry module or the class does not ship and the deploy fails.
 */

import type { Env } from "./env";
import { Room } from "./room";

export { Room };

/** `/ws` and `/ws/<room>` — the only server-side route a game has by default. */
const WS_PREFIX = "/ws";

/**
 * A room name comes from the URL, so it is untrusted: it is used as a Durable
 * Object name, and an unbounded or exotic value would let anyone mint unlimited
 * rooms with unreadable ids. Restrict it to a short, boring label.
 */
const ROOM_RE = /^[A-Za-z0-9_-]{1,64}$/;
const DEFAULT_ROOM = "main";

/**
 * Digital Asset Links for the Android app (a Trusted Web Activity). It lets the app open
 * this site full screen, without a browser bar. The first fingerprint is the app's upload
 * key; when the app is published with Play App Signing, add the fingerprint Play Console
 * shows under "App signing key certificate".
 */
const ASSET_LINKS = JSON.stringify([
  {
    relation: ["delegate_permission/common.handle_all_urls"],
    target: {
      namespace: "android_app",
      package_name: "app.higgsfield.jericho_still_love.twa",
      sha256_cert_fingerprints: [
        "16:1F:58:ED:3D:AB:39:73:47:E0:1E:CC:59:03:59:56:9D:1B:EE:7D:80:0D:4A:87:9E:32:7C:BC:93:18:F1:EE",
      ],
    },
  },
]);

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/.well-known/assetlinks.json") {
      return new Response(ASSET_LINKS, { headers: { "content-type": "application/json", "cache-control": "public, max-age=3600" } });
    }

    if (url.pathname === WS_PREFIX || url.pathname.startsWith(WS_PREFIX + "/")) {
      // Reject non-upgrade traffic here rather than paying for a DO wake-up.
      if (request.headers.get("Upgrade") !== "websocket") {
        return new Response("expected a websocket upgrade", { status: 426 });
      }
      const raw = url.pathname.slice(WS_PREFIX.length).replace(/^\/+/, "");
      // Trailing-slash and bare `/ws` both mean the default room, matching the
      // previous engine's shard naming.
      const room = raw === "" ? DEFAULT_ROOM : raw;
      if (!ROOM_RE.test(room)) {
        return new Response("invalid room name", { status: 400 });
      }
      // One DO instance per room name. Same name anywhere in the world = same
      // room, so all its players share one authoritative state.
      const id = env.ROOMS.idFromName(room);
      return env.ROOMS.get(id).fetch(request);
    }

    // A path that is neither a static file nor /ws. `not_found_handling: "none"`
    // means the platform already tried the assets, so this is a real 404 —
    // except for client-side routes, which want the app shell back.
    if (request.method === "GET" && request.headers.get("Accept")?.includes("text/html")) {
      return env.ASSETS.fetch(new Request(new URL("/", url), request));
    }
    return new Response("not found", { status: 404 });
  },
} satisfies ExportedHandler<Env>;
