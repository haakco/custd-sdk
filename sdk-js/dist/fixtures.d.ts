/**
 * readLifecycleFixture loads a shared lifecycle contract fixture under
 * contract-fixtures/lifecycle/{namespace}/{name}. Tests resolve the same
 * fixtures used by the Go SDK's matrix; the fixture paths are the canonical
 * wire-format contracts.
 *
 * Throws when the fixture is missing so a miss fails loudly rather than
 * silently producing an empty body.
 */
export declare function readLifecycleFixture(namespace: string, name: string): unknown;
