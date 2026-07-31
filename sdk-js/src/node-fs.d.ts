declare module "node:fs" {
  export function existsSync(path: string): boolean;
  export function existsSync(path: URL): boolean;
  export function readFileSync(path: URL, encoding: string): string;
  export function readFileSync(path: string, encoding: string): string;
  export function readFileSync(path: string): Buffer;
}

declare module "node:path" {
  export function dirname(path: string): string;
  export function resolve(...paths: string[]): string;
}

declare module "node:url" {
  export function fileURLToPath(url: string | URL): string;
}
