declare module "node:fs" {
  export function readFileSync(path: URL, encoding: string): string;
}
