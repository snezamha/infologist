import assert from "node:assert/strict";
import test from "node:test";

import { compareSemanticVersions, parseSemanticVersion } from "./semver.ts";

test("semantic versions reject invalid identifiers", () => {
  assert.equal(parseSemanticVersion("1.0"), null);
  assert.equal(parseSemanticVersion("01.0.0"), null);
  assert.equal(parseSemanticVersion("1.0.0-01"), null);
});

test("stable versions sort after prereleases", () => {
  assert.ok(compareSemanticVersions("1.0.0", "1.0.0-rc.1") > 0);
  assert.ok(compareSemanticVersions("1.0.0-beta.11", "1.0.0-beta.2") > 0);
});

test("core semantic versions sort numerically", () => {
  assert.ok(compareSemanticVersions("2.0.0", "1.99.99") > 0);
  assert.equal(compareSemanticVersions("1.2.3", "1.2.3"), 0);
});
