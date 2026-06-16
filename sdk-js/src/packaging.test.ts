import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

/**
 * Guards the published artifact. The package ships `files: ["dist"]`, so the
 * build must not emit test files into `dist` — otherwise consumers receive
 * compiled `*.test.js` that import `vitest`, a devDependency they don't have.
 */
describe("published package integrity", () => {
  const readJson = (relative: string): Record<string, unknown> =>
    JSON.parse(readFileSync(new URL(relative, import.meta.url), "utf8"));

  it("ships only the dist directory", () => {
    const pkg = readJson("../package.json");
    expect(pkg.files).toEqual(["dist"]);
  });

  it("excludes test files from the emitted build", () => {
    const buildConfig = readJson("../tsconfig.build.json");
    expect(buildConfig.exclude).toContain("src/**/*.test.ts");
  });
});
