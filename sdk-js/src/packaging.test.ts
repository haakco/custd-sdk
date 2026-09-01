import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { basename } from "node:path";
import { gzipSync } from "node:zlib";
import { describe, expect, it, vi } from "vitest";

type BrowserManifest = {
  file: string;
  sha256: string;
  bytes: number;
  gzipBytes: number;
  sdkVersion: string;
};

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

  it("ships a hashed browser artifact with a matching minimal manifest", () => {
    const pkg = readJson("../package.json");
    const manifest = readJson("../dist/browser-manifest.json") as unknown as BrowserManifest;
    const artifact = readFileSync(new URL(`../dist/${manifest.file}`, import.meta.url));

    expect((pkg.devDependencies as Record<string, unknown>).vite).toBe("8.1.2");
    expect(Object.keys(manifest).sort()).toEqual(["bytes", "file", "gzipBytes", "sdkVersion", "sha256"]);
    expect(manifest.file).toBe(basename(manifest.file));
    expect(manifest.file).toMatch(/^browser-script-[A-Za-z0-9_-]+\.js$/);
    expect(manifest.sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(manifest.bytes).toBe(artifact.byteLength);
    expect(manifest.gzipBytes).toBe(gzipSync(artifact, { mtime: 0 }).byteLength);
    expect(manifest.sha256).toBe(createHash("sha256").update(artifact).digest("hex"));
    expect(manifest.sdkVersion).toBe(pkg.version);
  });

  it("keeps the browser artifact self-contained and browser-only", () => {
    const manifest = readJson("../dist/browser-manifest.json") as unknown as BrowserManifest;
    const artifact = readFileSync(new URL(`../dist/${manifest.file}`, import.meta.url), "utf8");

    expect(artifact).not.toMatch(/(?:^|\n)\s*(?:import|export)\b/m);
    expect(artifact).not.toMatch(/\bimport\s*\(/);
    for (const marker of [
      "admin-client-setup",
      "admin-data-labels",
      "admin-offboarding",
      "admin-predictions",
      "admin-privacy-erasures",
      "admin-retention",
      "admin-subject-exports",
      "admin-tenant-storage",
      "backend-lifecycle",
      "mobile-adapter",
      "mobile-context",
      "mobile-queue",
      "reporting-state",
      "runtime-readiness",
    ]) {
      expect(artifact).not.toContain(marker);
    }
  });

  it("executes the browser artifact without loading sibling modules", async () => {
    const manifest = readJson("../dist/browser-manifest.json") as unknown as BrowserManifest;
    const artifactURL = new URL(`../dist/${manifest.file}?execution-test`, import.meta.url);
    const scriptElement = {
      src: artifactURL.href,
      dataset: { siteUuid: "site-123", writeKey: "site_pk_test", baseUrl: "https://example.com" },
    };
    const fetchMock = vi.fn(async (url: string) => {
      if (url.endsWith("/config")) {
        return new Response(JSON.stringify({ identityMode: "cookieless", allowedOrigins: ["https://example.com"] }), {
          status: 200,
        });
      }
      return new Response(JSON.stringify({ success: true }), { status: 202 });
    });
    const listeners = new Map<string, Array<() => void>>();
    const windowValue = {
      location: { href: "https://example.com/start", origin: "https://example.com", pathname: "/start" },
      history: { pushState: () => undefined, replaceState: () => undefined },
      addEventListener: (type: string, listener: () => void) => {
        listeners.set(type, [...(listeners.get(type) ?? []), listener]);
      },
      removeEventListener: () => undefined,
    };

    try {
      vi.stubGlobal("fetch", fetchMock);
      vi.stubGlobal("window", windowValue);
      vi.stubGlobal("document", {
        scripts: [scriptElement],
        currentScript: scriptElement,
        title: "Start",
        referrer: "",
      });
      vi.stubGlobal("navigator", {
        language: "en-US",
        userAgent: "",
        doNotTrack: "0",
        onLine: true,
      });

      await import(/* @vite-ignore */ artifactURL.href);
      await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
      expect(fetchMock.mock.calls[0][0]).toBe("https://example.com/api/v1/sites/site-123/config");
      expect(fetchMock.mock.calls[1][0]).toBe("https://example.com/api/v1/collect/events");
      expect(listeners.has("online")).toBe(true);
    } finally {
      vi.unstubAllGlobals();
    }
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
