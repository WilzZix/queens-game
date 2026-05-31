import { test } from "node:test";
import assert from "node:assert/strict";
import { t, normalizeLang, LANGS, DEFAULT_LANG } from "../public/i18n.js";

test("DEFAULT_LANG is english and LANGS lists the three supported languages", () => {
  assert.equal(DEFAULT_LANG, "en");
  assert.deepEqual(LANGS, ["en", "uz", "ru"]);
});

test("normalizeLang keeps supported languages and falls back to default", () => {
  assert.equal(normalizeLang("uz"), "uz");
  assert.equal(normalizeLang("ru"), "ru");
  assert.equal(normalizeLang("fr"), "en");
  assert.equal(normalizeLang(null), "en");
  assert.equal(normalizeLang(undefined), "en");
});

test("t returns the string for the requested language", () => {
  assert.equal(t("auth.login", "en"), "Sign in");
  assert.equal(t("auth.login", "uz"), "Kirish");
  assert.equal(t("auth.login", "ru"), "Войти");
});

test("t falls back to english for an unknown language", () => {
  assert.equal(t("game.win", "fr"), t("game.win", "en"));
});

test("t returns the key itself when the key is unknown", () => {
  assert.equal(t("does.not.exist", "en"), "does.not.exist");
});

test("every key present in english exists in uz and ru", () => {
  const keys = ["auth.login", "game.win", "stats.title", "save.prompt", "auth/invalid-credential"];
  for (const k of keys) {
    assert.notEqual(t(k, "uz"), k, `uz missing ${k}`);
    assert.notEqual(t(k, "ru"), k, `ru missing ${k}`);
  }
});
