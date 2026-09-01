declare module "node:fs" {
  export function existsSync(path: string): boolean;
  export function existsSync(path: URL): boolean;
  export function readFileSync(path: URL): Buffer;
  export function readFileSync(path: URL, encoding: string): string;
  export function readFileSync(path: string, encoding: string): string;
  export function readFileSync(path: string): Buffer;
}

declare module "node:path" {
  export function basename(path: string): string;
  export function dirname(path: string): string;
  export function resolve(...paths: string[]): string;
}

declare module "node:crypto" {
  export function createHash(algorithm: string): {
    update(data: Uint8Array): { digest(encoding: "hex"): string };
  };
}

declare module "node:zlib" {
  export function gzipSync(data: Uint8Array, options?: { mtime?: number }): Uint8Array;
}

declare module "node:url" {
  export function fileURLToPath(url: string | URL): string;
}
