// The minimal browser globals the browser tracker reads, stubbed for Node test runs.
import { vi } from "vitest";

export function installBrowserGlobals(): void {
  const listeners = new Map<string, Array<(event: Event) => void>>();
  const location = { href: "https://example.com/start", origin: "https://example.com", pathname: "/start" };
  const history = {
    pushState: (_state: unknown, _title: string, url?: string | URL | null) => {
      if (url) setLocation(location, url);
    },
    replaceState: (_state: unknown, _title: string, url?: string | URL | null) => {
      if (url) setLocation(location, url);
    },
  };
  const windowValue = {
    location,
    history,
    addEventListener: (type: string, listener: (event: Event) => void) => {
      listeners.set(type, [...(listeners.get(type) ?? []), listener]);
    },
    removeEventListener: (type: string, listener: (event: Event) => void) => {
      listeners.set(
        type,
        (listeners.get(type) ?? []).filter((item) => item !== listener),
      );
    },
    dispatchEvent: (event: Event) => {
      for (const listener of listeners.get(event.type) ?? []) {
        listener(event);
      }
      return true;
    },
  };

  vi.stubGlobal("window", windowValue);
  vi.stubGlobal("document", { title: "", referrer: "", currentScript: null });
  vi.stubGlobal("navigator", {
    language: "en-US",
    userAgent: "Mozilla/5.0",
    onLine: true,
    doNotTrack: "0",
  });
  vi.stubGlobal("localStorage", memoryStorage());
  vi.stubGlobal("sessionStorage", memoryStorage());
}

function setLocation(location: { href: string; origin: string; pathname: string }, url: string | URL): void {
  const next = new URL(String(url), location.href);
  location.href = next.href;
  location.origin = next.origin;
  location.pathname = next.pathname;
}

function memoryStorage(): Storage {
  const values = new Map<string, string>();
  return {
    get length() {
      return values.size;
    },
    clear: () => values.clear(),
    getItem: (key: string) => values.get(key) ?? null,
    key: (index: number) => Array.from(values.keys())[index] ?? null,
    removeItem: (key: string) => {
      values.delete(key);
    },
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
  };
}
