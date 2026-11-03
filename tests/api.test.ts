// Integration tests against a running server (default http://localhost:3100).
//   TEST_ADMIN_EMAIL=... TEST_ADMIN_PASSWORD=... npm test
// Skipped automatically when the server or credentials are not available.
import assert from "node:assert/strict";
import { before, describe, test } from "node:test";

const BASE = process.env.TEST_BASE_URL ?? "http://localhost:3100";
const EMAIL = process.env.TEST_ADMIN_EMAIL;
const PASSWORD = process.env.TEST_ADMIN_PASSWORD;

let up = false;
let cookie = "";
let csrf = "";

const hdr = (extra: Record<string, string> = {}) => ({ Origin: BASE, Host: new URL(BASE).host, ...extra });

async function reachable() {
  try {
    return (await fetch(`${BASE}/robots.txt`, { signal: AbortSignal.timeout(5000) })).ok;
  } catch {
    return false;
  }
}

// A valid 1x1 PNG
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");

describe("api", () => {
  before(async () => {
    up = await reachable();
  });

  test("public routes respond", async (t) => {
    if (!up) return t.skip("server not running");
    for (const p of ["/", "/about", "/activities", "/posters", "/gallery", "/videos", "/contact", "/sources", "/sitemap.xml", "/robots.txt"]) {
      const res = await fetch(`${BASE}${p}`);
      assert.equal(res.status, 200, `${p} -> ${res.status}`);
    }
    assert.equal((await fetch(`${BASE}/does-not-exist`)).status, 404);
    assert.equal((await fetch(`${BASE}/posters/nope`)).status, 404);
  });

  test("language cookie switches server-rendered language without changing the URL", async (t) => {
    if (!up) return t.skip("server not running");
    const en = await (await fetch(`${BASE}/about`)).text();
    const te = await (await fetch(`${BASE}/about`, { headers: { Cookie: "ps_lang=te" } })).text();
    assert.match(en, /<html lang="en"/);
    assert.match(te, /<html lang="te"/);
    assert.match(te, /పరిచయం/);
  });

  test("SEO: canonical, Open Graph, JSON-LD, sitemap, robots", async (t) => {
    if (!up) return t.skip("server not running");
    const html = await (await fetch(`${BASE}/about`)).text();
    assert.match(html, /rel="canonical"/);
    assert.match(html, /property="og:title"/);
    assert.match(html, /name="twitter:card"/);
    const home = await (await fetch(`${BASE}/`)).text();
    assert.match(home, /application\/ld\+json/);
    const robots = await (await fetch(`${BASE}/robots.txt`)).text();
    assert.match(robots, /Disallow: \/admin/);
    assert.match(await (await fetch(`${BASE}/sitemap.xml`)).text(), /<urlset/);
  });

  test("unauthenticated access to every admin API is rejected", async (t) => {
    if (!up) return t.skip("server not running");
    const cases: [string, string][] = [
      ["GET", "/api/admin/session"],
      ["GET", "/api/admin/stats"],
      ["GET", "/api/admin/c/posters"],
      ["POST", "/api/admin/c/posters"],
      ["PUT", "/api/admin/c/posters/x"],
      ["DELETE", "/api/admin/c/posters/x"],
      ["POST", "/api/admin/c/posters/reorder"],
      ["GET", "/api/admin/settings/site"],
      ["PUT", "/api/admin/settings/site"],
      ["POST", "/api/admin/upload"],
      ["POST", "/api/admin/logout"],
    ];
    for (const [method, path] of cases) {
      const res = await fetch(`${BASE}${path}`, { method, headers: hdr({ "Content-Type": "application/json" }), body: method === "GET" ? undefined : "{}" });
      assert.equal(res.status, 401, `${method} ${path} -> ${res.status}`);
    }
  });

  test("admin pages redirect to login when signed out", async (t) => {
    if (!up) return t.skip("server not running");
    for (const p of ["/admin", "/admin/posters", "/admin/designer"]) {
      const res = await fetch(`${BASE}${p}`, { redirect: "manual" });
      assert.ok([307, 308].includes(res.status), `${p} -> ${res.status}`);
      assert.match(res.headers.get("location") ?? "", /\/admin\/login/);
    }
    assert.equal((await fetch(`${BASE}/admin/login`)).status, 200);
  });

  test("login rejects bad credentials and cross-origin attempts", async (t) => {
    if (!up) return t.skip("server not running");
    const bad = await fetch(`${BASE}/api/admin/login`, { method: "POST", headers: hdr({ "Content-Type": "application/json" }), body: JSON.stringify({ email: "nobody@example.test", password: "wrong-password" }) });
    assert.equal(bad.status, 401);
    assert.equal(bad.headers.get("set-cookie"), null);
    const cross = await fetch(`${BASE}/api/admin/login`, { method: "POST", headers: { "Content-Type": "application/json", Origin: "https://evil.example" }, body: JSON.stringify({ email: "a@b.co", password: "x" }) });
    assert.equal(cross.status, 403);
  });

  describe("authenticated", () => {
    before(async () => {
      if (!up || !EMAIL || !PASSWORD) return;
      const res = await fetch(`${BASE}/api/admin/login`, { method: "POST", headers: hdr({ "Content-Type": "application/json" }), body: JSON.stringify({ email: EMAIL, password: PASSWORD }) });
      assert.equal(res.status, 200, "login failed");
      const set = res.headers.get("set-cookie") ?? "";
      assert.match(set, /HttpOnly/i);
      assert.match(set, /SameSite=Strict/i);
      cookie = set.split(";")[0];
      const session = await (await fetch(`${BASE}/api/admin/session`, { headers: { Cookie: cookie } })).json();
      csrf = session.csrf;
    });

    const auth = (extra: Record<string, string> = {}) => hdr({ Cookie: cookie, "x-csrf-token": csrf, ...extra });
    const ready = (t: { skip: (m: string) => void }) => {
      if (!up || !cookie) {
        t.skip("server or admin credentials unavailable");
        return false;
      }
      return true;
    };

    test("state-changing request without CSRF token or with a foreign origin is refused", async (t) => {
      if (!ready(t)) return;
      const noCsrf = await fetch(`${BASE}/api/admin/c/updates`, { method: "POST", headers: hdr({ Cookie: cookie, "Content-Type": "application/json" }), body: "{}" });
      assert.equal(noCsrf.status, 403);
      const badOrigin = await fetch(`${BASE}/api/admin/c/updates`, { method: "POST", headers: { Cookie: cookie, "x-csrf-token": csrf, Origin: "https://evil.example", "Content-Type": "application/json" }, body: "{}" });
      assert.equal(badOrigin.status, 403);
    });

    test("tampered session cookie is rejected", async (t) => {
      if (!ready(t)) return;
      const res = await fetch(`${BASE}/api/admin/session`, { headers: { Cookie: `${cookie}x` } });
      assert.equal(res.status, 401);
    });

    test("validation rejects bad input", async (t) => {
      if (!ready(t)) return;
      const post = (body: unknown) => fetch(`${BASE}/api/admin/c/instagram`, { method: "POST", headers: auth({ "Content-Type": "application/json" }), body: JSON.stringify(body) });
      assert.equal((await post({ url: "https://evil.com/p/abc/", published: true })).status, 422);
      assert.equal((await post({ url: "javascript:alert(1)" })).status, 422);
      const poster = await fetch(`${BASE}/api/admin/c/posters`, { method: "POST", headers: auth({ "Content-Type": "application/json" }), body: JSON.stringify({ title: { en: "x", te: "" }, category: "general", image: "https://evil.com/x.png" }) });
      assert.equal(poster.status, 422);
      assert.equal((await fetch(`${BASE}/api/admin/c/not-a-collection`, { headers: auth() })).status, 404);
    });

    test("upload rejects invalid files", async (t) => {
      if (!ready(t)) return;
      const send = (file: File, folder = "gallery") => {
        const form = new FormData();
        form.set("file", file);
        form.set("folder", folder);
        return fetch(`${BASE}/api/admin/upload`, { method: "POST", headers: auth(), body: form });
      };
      assert.equal((await send(new File(["<svg onload=alert(1)></svg>"], "x.svg", { type: "image/svg+xml" }))).status, 400);
      assert.equal((await send(new File(["<?php echo 1;"], "x.png", { type: "image/png" }))).status, 400, "fake png must be rejected by magic bytes");
      assert.equal((await send(new File([new Uint8Array(9 * 1024 * 1024)], "big.png", { type: "image/png" }))).status, 400);
      assert.equal((await send(new File([PNG], "ok.png", { type: "image/png" }), "../../etc")).status, 400);
    });

    test("poster lifecycle: upload, create, publish, public view, download, reorder, delete", async (t) => {
      if (!ready(t)) return;
      const form = new FormData();
      form.set("file", new File([PNG], "poster.png", { type: "image/png" }));
      form.set("folder", "posters");
      const up1 = await fetch(`${BASE}/api/admin/upload`, { method: "POST", headers: auth(), body: form });
      assert.equal(up1.status, 201);
      const { url } = await up1.json();

      const created = await fetch(`${BASE}/api/admin/c/posters`, { method: "POST", headers: auth({ "Content-Type": "application/json" }), body: JSON.stringify({ title: { en: "Test poster", te: "పరీక్ష పోస్టర్" }, category: "general", image: url, tags: ["test"], published: true }) });
      assert.equal(created.status, 201);
      const { item } = await created.json();

      try {
        const pub = await (await fetch(`${BASE}/posters/${item.id}`)).text();
        assert.match(pub, /Test poster/);

        const dl = await fetch(`${BASE}/api/posters/${item.id}/download`);
        assert.equal(dl.status, 200);
        assert.match(dl.headers.get("content-disposition") ?? "", /attachment/);
        assert.equal(dl.headers.get("content-type"), "image/png");

        // unpublish -> public 404
        const { id, ...rest } = item;
        void id;
        const upd = await fetch(`${BASE}/api/admin/c/posters/${item.id}`, { method: "PUT", headers: auth({ "Content-Type": "application/json" }), body: JSON.stringify({ ...rest, published: false }) });
        assert.equal(upd.status, 200);
        assert.equal((await fetch(`${BASE}/posters/${item.id}`)).status, 404);
        assert.equal((await fetch(`${BASE}/api/posters/${item.id}/download`)).status, 404);

        const list = await (await fetch(`${BASE}/api/admin/c/posters`, { headers: auth() })).json();
        const ids = list.items.map((i: { id: string }) => i.id);
        const reorder = await fetch(`${BASE}/api/admin/c/posters/reorder`, { method: "POST", headers: auth({ "Content-Type": "application/json" }), body: JSON.stringify({ ids: [...ids].reverse() }) });
        assert.equal(reorder.status, 200);
      } finally {
        const del = await fetch(`${BASE}/api/admin/c/posters/${item.id}`, { method: "DELETE", headers: auth() });
        assert.ok([200, 404].includes(del.status));
      }
      assert.equal((await fetch(`${BASE}/api/admin/c/posters/${item.id}`, { method: "DELETE", headers: auth() })).status, 404);
    });

    test("gallery lifecycle: upload, dedupe, permission gate, publish, public view, download, delete", async (t) => {
      if (!ready(t)) return;
      const { readFile } = await import("node:fs/promises");
      const bytes = await readFile(new URL("../public/images/portraits/paritala-sreeram-official-portrait.webp", import.meta.url));
      const upload = async () => {
        const form = new FormData();
        form.set("file", new File([bytes], "portrait.webp", { type: "image/webp" }));
        form.set("folder", "gallery");
        form.set("category", "portraits");
        form.set("name", "Test Portrait Upload");
        return fetch(`${BASE}/api/admin/upload`, { method: "POST", headers: auth(), body: form });
      };
      const json = { "Content-Type": "application/json" };

      const first = await upload();
      assert.equal(first.status, 201);
      const stored = await first.json();
      assert.equal(stored.width, 1500);
      assert.equal(stored.height, 844);
      assert.match(stored.url, /portraits-test-portrait-upload-[0-9a-f]{16}\.webp$/);
      const second = await (await upload()).json();
      assert.equal(second.duplicate, true, "identical bytes must not be stored twice");
      assert.equal(second.url, stored.url);

      const body = {
        title: { en: "Gallery test photograph", te: "" },
        caption: { en: "", te: "" },
        category: "portraits",
        image: stored.url,
        width: stored.width,
        height: stored.height,
        alt: { en: "A test photograph alt text", te: "" },
        date: "",
        sourceUrl: "",
        credit: "Test",
        permission: "pending",
        allowDownload: false,
        featured: false,
        published: true,
      };
      const post = (b: unknown) => fetch(`${BASE}/api/admin/c/gallery`, { method: "POST", headers: auth(json), body: JSON.stringify(b) });
      assert.equal((await post(body)).status, 422, "pending photographs cannot be published");
      assert.equal((await post({ ...body, permission: "authorised", alt: { en: "", te: "" } })).status, 422, "alt text is required to publish");
      assert.equal((await post({ ...body, category: "not-a-category", permission: "authorised" })).status, 422);

      const created = await post({ ...body, published: false });
      assert.equal(created.status, 201);
      const { item } = await created.json();
      try {
        assert.doesNotMatch(await (await fetch(`${BASE}/gallery`)).text(), /A test photograph alt text/, "drafts are not public");

        const put = (b: unknown) => fetch(`${BASE}/api/admin/c/gallery/${item.id}`, { method: "PUT", headers: auth(json), body: JSON.stringify(b) });
        assert.equal((await put({ ...body, published: true })).status, 422, "still pending");
        assert.equal((await put({ ...body, permission: "authorised", published: true })).status, 200);
        const page = await (await fetch(`${BASE}/gallery`)).text();
        assert.match(page, /A test photograph alt text/);
        assert.doesNotMatch(page, /instagram\.com\/embed|instagram-media/, "gallery shows photographs, not Instagram embeds");

        assert.equal((await fetch(`${BASE}/api/gallery/${item.id}/download`)).status, 404, "download is off by default");
        assert.equal((await put({ ...body, permission: "authorised", published: true, allowDownload: true })).status, 200);
        const dl = await fetch(`${BASE}/api/gallery/${item.id}/download`);
        assert.equal(dl.status, 200);
        assert.equal(dl.headers.get("content-type"), "image/webp");
        assert.match(dl.headers.get("content-disposition") ?? "", /attachment; filename="gallery-test-photograph\.webp"/);

        assert.equal((await put({ ...body, permission: "authorised", published: false })).status, 200);
        assert.equal((await fetch(`${BASE}/api/gallery/${item.id}/download`)).status, 404, "unpublished photographs cannot be downloaded");
      } finally {
        assert.ok([200, 404].includes((await fetch(`${BASE}/api/admin/c/gallery/${item.id}`, { method: "DELETE", headers: auth() })).status));
      }
      assert.equal((await fetch(`${BASE}${stored.url}`)).status, 404, "stored file is removed with its last record");
    });

    test("instagram: add normalises URL, then removes", async (t) => {
      if (!ready(t)) return;
      const res = await fetch(`${BASE}/api/admin/c/instagram`, { method: "POST", headers: auth({ "Content-Type": "application/json" }), body: JSON.stringify({ url: "https://www.instagram.com/paritalasreeramofficial/reel/ZZtest123/?igsh=1", published: true }) });
      assert.equal(res.status, 201);
      const { item } = await res.json();
      assert.equal(item.url, "https://www.instagram.com/reel/ZZtest123/");
      assert.equal((await fetch(`${BASE}/api/admin/c/instagram/${item.id}`, { method: "DELETE", headers: auth() })).status, 200);
    });

    test("settings: save and read back; invalid values rejected", async (t) => {
      if (!ready(t)) return;
      const cur = await (await fetch(`${BASE}/api/admin/settings/social`, { headers: auth() })).json();
      const bad = await fetch(`${BASE}/api/admin/settings/social`, { method: "PUT", headers: auth({ "Content-Type": "application/json" }), body: JSON.stringify({ ...cur.value, instagram: "javascript:alert(1)" }) });
      assert.equal(bad.status, 422);
      const ok = await fetch(`${BASE}/api/admin/settings/social`, { method: "PUT", headers: auth({ "Content-Type": "application/json" }), body: JSON.stringify(cur.value) });
      assert.equal(ok.status, 200);
    });

    test("stats endpoint returns counts", async (t) => {
      if (!ready(t)) return;
      const stats = await (await fetch(`${BASE}/api/admin/stats`, { headers: auth() })).json();
      assert.ok(stats.counts.timeline.total >= 5);
      assert.ok("postersByCategory" in stats);
    });

    test("logout invalidates the server-side session", async (t) => {
      if (!ready(t)) return;
      const out = await fetch(`${BASE}/api/admin/logout`, { method: "POST", headers: auth() });
      assert.equal(out.status, 200);
      assert.equal((await fetch(`${BASE}/api/admin/session`, { headers: { Cookie: cookie } })).status, 401);
      cookie = "";
    });
  });
});
