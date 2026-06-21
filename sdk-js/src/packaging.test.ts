import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * Guards the published artifact. The package ships `files: ["dist"]`, so the
 * build must not emit test files into `dist` — otherwise consumers receive
 * compiled `*.test.js` that import `vitest`, a devDependency they don't have.
 */
describe("published package integrity", () => {
  const readJson = (relative: string): Record<string, unknown> =>
    JSON.parse(readFileSync(new URL(relative, import.meta.url), "utf8"));

  it("keeps the JS SDK available in GitHub source archives", () => {
    const gitattributes = readFileSync(new URL("../../.gitattributes", import.meta.url), "utf8");

    expect(gitattributes).not.toMatch(/^\/sdk-js\s+export-ignore$/m);
  });

  it("ships only the dist directory", () => {
    const pkg = readJson("../package.json");
    expect(pkg.files).toEqual(["dist"]);
  });

  it("ships committed dist entrypoints for GitHub installs", () => {
    expect(existsSync(new URL("../dist/index.js", import.meta.url))).toBe(true);
    expect(existsSync(new URL("../dist/browser.js", import.meta.url))).toBe(true);
    expect(existsSync(new URL("../dist/browser-script.js", import.meta.url))).toBe(true);
    expect(existsSync(new URL("../dist/index.d.ts", import.meta.url))).toBe(true);
    expect(existsSync(new URL("../dist/browser.d.ts", import.meta.url))).toBe(true);
    expect(existsSync(new URL("../dist/browser-script.d.ts", import.meta.url))).toBe(true);
  });

  it("keeps Verdaccio publishing configured during the GitHub install transition", () => {
    const pkg = readJson("../package.json");

    expect(pkg.publishConfig).toEqual({ registry: "https://verdaccio.k8.haak.co/" });
  });

  it("does not require GitHub install consumers to allow package build scripts", () => {
    const pkg = readJson("../package.json");
    const scripts = pkg.scripts as Record<string, string>;

    expect(scripts.prepare).toBeUndefined();
  });

  it("does not ship committed npm registry config with GitHub installs", () => {
    expect(existsSync(new URL("../.npmrc", import.meta.url))).toBe(false);
  });

  it("excludes test files from the emitted build", () => {
    const buildConfig = readJson("../tsconfig.build.json");
    expect(buildConfig.exclude).toContain("src/**/*.test.ts");
  });
});
