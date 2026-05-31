import { test } from "node:test";
import assert from "node:assert/strict";
import { resolveTheme, nextTheme } from "../public/theme.js";

test("resolveTheme defaults to light for missing/invalid input", () => {
  assert.equal(resolveTheme(null), "light");
  assert.equal(resolveTheme(undefined), "light");
  assert.equal(resolveTheme(""), "light");
  assert.equal(resolveTheme("garbage"), "light");
});

test("resolveTheme passes through valid themes", () => {
  assert.equal(resolveTheme("light"), "light");
  assert.equal(resolveTheme("dark"), "dark");
});

test("nextTheme flips the theme", () => {
  assert.equal(nextTheme("light"), "dark");
  assert.equal(nextTheme("dark"), "light");
});
