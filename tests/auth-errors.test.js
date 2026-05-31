import { test } from "node:test";
import assert from "node:assert/strict";
import { authErrorMessage, validateCredentials } from "../public/auth-errors.js";

test("authErrorMessage maps known codes to friendly text", () => {
  assert.equal(authErrorMessage("auth/wrong-password"), "Parol noto'g'ri.");
  assert.equal(authErrorMessage("auth/email-already-in-use"), "Bu email allaqachon ro'yxatdan o'tgan.");
  assert.equal(authErrorMessage("auth/weak-password"), "Parol juda zaif (kamida 6 ta belgi).");
});

test("authErrorMessage falls back for unknown codes", () => {
  assert.equal(authErrorMessage("auth/something-new"), "Xatolik yuz berdi. Qayta urinib ko'ring.");
  assert.equal(authErrorMessage(undefined), "Xatolik yuz berdi. Qayta urinib ko'ring.");
});

test("validateCredentials accepts a valid email + 6+ char password", () => {
  assert.equal(validateCredentials("a@b.com", "secret"), null);
});

test("validateCredentials rejects a bad email", () => {
  assert.equal(validateCredentials("not-an-email", "secret"), "Email manzil noto'g'ri.");
});

test("validateCredentials rejects a short password", () => {
  assert.equal(validateCredentials("a@b.com", "123"), "Parol kamida 6 ta belgidan iborat bo'lishi kerak.");
});
