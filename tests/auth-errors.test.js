import { test } from "node:test";
import assert from "node:assert/strict";
import { authErrorKey, validateCredentials } from "../public/auth-errors.js";

test("authErrorKey returns the code itself for known codes", () => {
  assert.equal(authErrorKey("auth/wrong-password"), "auth/wrong-password");
  assert.equal(authErrorKey("auth/email-already-in-use"), "auth/email-already-in-use");
  assert.equal(authErrorKey("auth/weak-password"), "auth/weak-password");
});

test("authErrorKey falls back to err.generic for unknown codes", () => {
  assert.equal(authErrorKey("auth/something-new"), "err.generic");
  assert.equal(authErrorKey(undefined), "err.generic");
});

test("validateCredentials accepts a valid email + 6+ char password", () => {
  assert.equal(validateCredentials("a@b.com", "secret"), null);
});

test("validateCredentials rejects a bad email", () => {
  assert.equal(validateCredentials("not-an-email", "secret"), "err.invalidEmail");
});

test("validateCredentials rejects a short password", () => {
  assert.equal(validateCredentials("a@b.com", "123"), "err.weakPasswordInput");
});
