import assert from "node:assert/strict";
import { test } from "node:test";
import { hashPassword, validatePasswordStrength, verifyPassword } from "../lib/auth/password.ts";
import { sniffImageType } from "../lib/storage/images.ts";
import { isAllowedAssetUrl, isHttpsUrl, normalizeInstagramUrl, parseYoutubeId } from "../lib/validation/urls.ts";

test("password hashing: verifies correct password, rejects wrong, never stores plaintext", async () => {
  const hash = await hashPassword("Correct-Horse-9");
  assert.ok(hash.startsWith("scrypt$"));
  assert.ok(!hash.includes("Correct-Horse-9"));
  assert.equal(await verifyPassword("Correct-Horse-9", hash), true);
  assert.equal(await verifyPassword("correct-horse-9", hash), false);
  assert.equal(await verifyPassword("x", "not-a-hash"), false);
});

test("password strength rules", () => {
  assert.ok(validatePasswordStrength("short1A"));
  assert.ok(validatePasswordStrength("alllowercase12345"));
  assert.equal(validatePasswordStrength("GoodPassw0rd-long"), null);
});

test("image sniffing recognises real images and rejects fakes", () => {
  assert.equal(sniffImageType(new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0])), "image/jpeg");
  assert.equal(sniffImageType(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0])), "image/png");
  const webp = new Uint8Array([...Buffer.from("RIFF"), 0, 0, 0, 0, ...Buffer.from("WEBPVP8 ")]);
  assert.equal(sniffImageType(webp), "image/webp");
  assert.equal(sniffImageType(new TextEncoder().encode("<svg onload=alert(1)></svg>")), null);
  assert.equal(sniffImageType(new TextEncoder().encode("<?php echo 1; ?>")), null);
});

test("instagram URL normalisation", () => {
  assert.equal(normalizeInstagramUrl("https://www.instagram.com/paritalasreeramofficial/reel/DYud-a9Nx-7/?igsh=abc"), "https://www.instagram.com/reel/DYud-a9Nx-7/");
  assert.equal(normalizeInstagramUrl("https://instagram.com/p/DfPsAk6Eyrj"), "https://www.instagram.com/p/DfPsAk6Eyrj/");
  assert.equal(normalizeInstagramUrl("https://evil.com/p/abc/"), null);
  assert.equal(normalizeInstagramUrl("javascript:alert(1)"), null);
  assert.equal(normalizeInstagramUrl("https://www.instagram.com/paritalasreeramofficial/"), null);
});

test("youtube id parsing", () => {
  assert.equal(parseYoutubeId("https://www.youtube.com/watch?v=dQw4w9WgXcQ"), "dQw4w9WgXcQ");
  assert.equal(parseYoutubeId("https://youtu.be/dQw4w9WgXcQ"), "dQw4w9WgXcQ");
  assert.equal(parseYoutubeId("https://www.youtube.com/shorts/dQw4w9WgXcQ"), "dQw4w9WgXcQ");
  assert.equal(parseYoutubeId("http://www.youtube.com/watch?v=dQw4w9WgXcQ"), null);
  assert.equal(parseYoutubeId("https://example.com/watch?v=dQw4w9WgXcQ"), null);
});

test("asset URL allow-list blocks arbitrary hosts and traversal", () => {
  assert.equal(isAllowedAssetUrl("https://abc123.public.blob.vercel-storage.com/posters/x.png"), true);
  assert.equal(isAllowedAssetUrl("/api/dev-uploads/aaaa.png"), true);
  assert.equal(isAllowedAssetUrl("https://evil.com/x.png"), false);
  assert.equal(isAllowedAssetUrl("https://public.blob.vercel-storage.com.evil.com/x.png"), false);
  assert.equal(isAllowedAssetUrl("javascript:alert(1)"), false);
  assert.equal(isAllowedAssetUrl("/logos/../../etc/passwd"), false);
  assert.equal(isHttpsUrl("http://x.com"), false);
});
