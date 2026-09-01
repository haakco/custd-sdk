import { createHash } from "node:crypto";
import { gzipSync } from "node:zlib";
import { readdir, readFile, unlink, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { build } from "vite";

const sdkRoot = fileURLToPath(new URL("../", import.meta.url));
const distDirectory = fileURLToPath(new URL("../dist/", import.meta.url));
const entrypoint = "src/browser-script.ts";
const manifestName = "browser-manifest.json";
const generatedArtifactPattern = /^browser-script-[A-Za-z0-9_-]+\.js$/;

const packageJson = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));
const output = await build({
  root: sdkRoot,
  configFile: false,
  logLevel: "error",
  build: {
    write: false,
    minify: true,
    sourcemap: false,
    lib: {
      entry: entrypoint,
      formats: ["es"],
    },
    rollupOptions: {
      output: {
        entryFileNames: "browser-script-[hash].js",
        chunkFileNames: "browser-script-[hash].js",
        assetFileNames: "[name]-[hash][extname]",
      },
    },
  },
});

const chunks = (Array.isArray(output) ? output : [output]).flatMap((bundle) => bundle.output ?? []).filter(isChunk);
if (chunks.length !== 1) {
  throw new Error(`custd: browser build must emit one JavaScript chunk, got ${chunks.length}`);
}

const [chunk] = chunks;
if (chunk.imports.length > 0 || chunk.dynamicImports.length > 0) {
  throw new Error("custd: browser build must not emit static or dynamic imports");
}

const artifact = Buffer.from(chunk.code);
const artifactName = chunk.fileName;
if (!generatedArtifactPattern.test(artifactName)) {
  throw new Error(`custd: browser build emitted an invalid artifact filename: ${artifactName}`);
}

for (const name of await readdir(distDirectory)) {
  if (generatedArtifactPattern.test(name) || name === manifestName) {
    await unlink(new URL(`../dist/${name}`, import.meta.url));
  }
}

await writeFile(new URL(`../dist/${artifactName}`, import.meta.url), artifact);
const manifest = {
  file: artifactName,
  sha256: createHash("sha256").update(artifact).digest("hex"),
  bytes: artifact.byteLength,
  gzipBytes: gzipSync(artifact, { mtime: 0 }).byteLength,
  sdkVersion: packageJson.version,
};
await writeFile(new URL(`../dist/${manifestName}`, import.meta.url), `${JSON.stringify(manifest, null, 2)}\n`);

function isChunk(outputFile) {
  return outputFile.type === "chunk";
}
