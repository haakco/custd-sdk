// Shared contract fixture loader for tests.
//
// The TypeScript SDK ships inside the custd-sdk monorepo. The shared lifecycle
// fixtures live at <monorepo>/contract-fixtures/lifecycle/{namespace}/{name},
// and the monorepo also resolves to a standalone release where the fixtures
// are vendored at <module>/contract-fixtures/lifecycle/{namespace}/{name}.
//
// Tests resolve fixtures via either path so the same fixtures work under both
// layouts. The standalone-release layout is the typical npm install; the
// monorepo layout is the typical local-development layout.

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// findFixtureRoot walks upward from the current module to find the monorepo
// root that contains the contract-fixtures directory. When the SDK is running
// inside the standalone release split, fixtures live at <module>/contract-fixtures.
function findFixtureRoot(): string {
  // node:url import.meta.url is available in both ESM and Node test contexts.
  const modulePath = fileURLToPath(import.meta.url);
  let cursor = dirname(modulePath);
  for (let depth = 0; depth < 8; depth++) {
    const candidate = resolve(cursor, "contract-fixtures");
    try {
      // Cheap probe: if the file exists, we landed at the correct root.
      readFileSync(resolve(candidate, "lifecycle", "matrix.json"));
      return candidate;
    } catch {
      const parent = dirname(cursor);
      if (parent === cursor) {
        break;
      }
      cursor = parent;
    }
  }
  throw new Error("custd-sdk: contract-fixtures root not found");
}

const fixtureRoot = findFixtureRoot();

/**
 * readLifecycleFixture loads a shared lifecycle contract fixture under
 * contract-fixtures/lifecycle/{namespace}/{name}. Tests resolve the same
 * fixtures used by the Go SDK's matrix; the fixture paths are the canonical
 * wire-format contracts.
 *
 * Throws when the fixture is missing so a miss fails loudly rather than
 * silently producing an empty body.
 */
export function readLifecycleFixture(namespace: string, name: string): unknown {
  const relPath = `lifecycle/${namespace}/${name}`;
  try {
    const text = readFileSync(resolve(fixtureRoot, relPath), "utf8");
    return JSON.parse(text);
  } catch (err) {
    throw new Error(`custd-sdk: lifecycle fixture ${namespace}/${name} not found: ${(err as Error).message}`);
  }
}
