declare module "node:fs" {
  export function existsSync(path: URL): boolean;
  export function readFileSync(path: URL, encoding: string): string;
}
