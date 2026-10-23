import assert from "node:assert/strict";
import { test } from "node:test";

import { DEFAULTS, isValidDelay, isValidPattern, originOf, parsePatterns } from "../../tab-auto-closer/settings.js";

test("default patterns are valid and leave Slack's web client alone", () => {
  for (const pattern of DEFAULTS.patterns) {
    assert.ok(isValidPattern(pattern), pattern);
    assert.ok(!pattern.includes("/client"), pattern);
  }
});

test("isValidPattern accepts http and https match patterns", () => {
  for (const pattern of [
    "https://*.slack.com/archives/*",
    "*://teams.microsoft.com/l/*",
    "http://localhost:8080/*",
    "https://*/*",
  ]) {
    assert.ok(isValidPattern(pattern), pattern);
  }
});

test("isValidPattern rejects what Chrome or the manifest's permissions wouldn't take", () => {
  for (const pattern of [
    "slack.com/archives/*",
    "https://slack.com",
    "file:///tmp/*",
    "<all_urls>",
    "https://sl*ck.com/*",
    "https://*slack.com/*",
  ]) {
    assert.ok(!isValidPattern(pattern), pattern);
  }
});

test("originOf drops the path", () => {
  assert.equal(originOf("https://*.slack.com/archives/*"), "https://*.slack.com/*");
  assert.equal(originOf("*://zoom.us/j/*"), "*://zoom.us/*");
  assert.equal(originOf("http://localhost:8080/x"), "http://localhost:8080/*");
  assert.throws(() => originOf("slack.com"));
});

test("parsePatterns trims, skips blanks and duplicates, and reports invalid lines", () => {
  const { patterns, invalid } = parsePatterns(
    " https://*.slack.com/archives/*\n\nhttps://*.slack.com/archives/*\r\nnot a pattern\nhttps://zoom.us/j/*\n",
  );
  assert.deepEqual(patterns, ["https://*.slack.com/archives/*", "https://zoom.us/j/*"]);
  assert.deepEqual(invalid, ["not a pattern"]);
});

test("isValidDelay takes whole seconds from 0 to 600", () => {
  for (const seconds of [0, 3, 600]) {
    assert.ok(isValidDelay(seconds), String(seconds));
  }
  for (const seconds of [-1, 1.5, 601, NaN]) {
    assert.ok(!isValidDelay(seconds), String(seconds));
  }
});
