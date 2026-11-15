import { SDK_VERSION } from "./version.js";

/** A registered browser Site and a server-only Site must use different write keys. */
export interface ErrorCaptureConfig {
  baseUrl: string;
  writeKey: string;
  environment: string;
  release?: string;
  fetch?: typeof fetch;
}

export interface CaptureExceptionRequest {
  error: unknown;
  mode?: "handled" | "unhandled";
  /** Application-owned ULID; no user, account or request content. */
  correlationId?: string;
}

export interface ErrorCaptureResult {
  outcome: "accepted" | "unavailable" | "rejected" | "limited";
  status?: number;
}

export interface ErrorFrame {
  filename: string;
  lineno: number;
  colno?: number;
}

/** Sanitized app-to-server relay contract. Credentials and raw error content never enter it. */
export interface ErrorCaptureEvent {
  eventId?: string;
  platform: "javascript" | "go";
  exceptionType: string;
  frames: ErrorFrame[];
  mode: "handled" | "unhandled";
  environment: string;
  release?: string;
  correlationId?: string;
}

export interface ErrorCaptureEventConfig {
  environment: string;
  release?: string;
  eventId?: string;
}

/** Pure formatter for authenticated application relays, including Expo without browser globals. */
export function createErrorCaptureEvent(
  request: CaptureExceptionRequest,
  config: ErrorCaptureEventConfig,
): ErrorCaptureEvent {
  if (
    !/^[a-zA-Z0-9._-]{1,64}$/u.test(config.environment) ||
    (config.release !== undefined && !/^[a-zA-Z0-9@._+-]{1,200}$/u.test(config.release)) ||
    (config.eventId !== undefined && !/^[a-f0-9]{32}$/u.test(config.eventId))
  ) {
    throw new Error("custd: invalid error event configuration");
  }
  return {
    ...(config.eventId === undefined ? {} : { eventId: config.eventId }),
    platform: "javascript",
    exceptionType: safeExceptionType(request.error),
    frames: exceptionFrames(request.error),
    mode: request.mode === "unhandled" ? "unhandled" : "handled",
    environment: config.environment,
    ...(config.release === undefined ? {} : { release: config.release }),
    ...(request.correlationId && ulid.test(request.correlationId) ? { correlationId: request.correlationId } : {}),
  };
}

const maxCaptures = 20;
const maxConcurrent = 4;
const maxFrames = 24;
const maxEnvelopeBytes = 16_384;
const ulid = /^[0-7][0-9A-HJKMNP-TV-Z]{25}$/u;

/** Native Custd collector. No global scope, persisted queue, retries or third-party collector. */
export class ErrorCaptureClient {
  private readonly origin: string;
  private readonly send: typeof fetch;
  private captures = 0;
  private concurrent = 0;

  constructor(private readonly config: ErrorCaptureConfig) {
    const url = new URL(config.baseUrl);
    const local = ["localhost", "127.0.0.1", "[::1]", "host.docker.internal"].includes(url.hostname);
    if (
      (url.protocol !== "https:" && !(url.protocol === "http:" && local)) ||
      url.username ||
      url.password ||
      url.search ||
      url.hash ||
      url.pathname !== "/" ||
      !/^site_pk_[a-f0-9]{32,128}$/u.test(config.writeKey) ||
      !/^[a-zA-Z0-9._-]{1,64}$/u.test(config.environment) ||
      (config.release !== undefined && !/^[a-zA-Z0-9@._+-]{1,200}$/u.test(config.release))
    ) {
      throw new Error("custd: invalid error capture configuration");
    }
    this.origin = url.origin;
    this.send = config.fetch ?? globalThis.fetch.bind(globalThis);
  }

  /** Always resolves: optional diagnostics never changes the operation that failed. */
  async captureException(request: CaptureExceptionRequest): Promise<ErrorCaptureResult> {
    if (this.captures >= maxCaptures || this.concurrent >= maxConcurrent) return { outcome: "limited" };
    this.captures += 1;
    this.concurrent += 1;
    try {
      const id = crypto.randomUUID().replace(/-/gu, "");
      const capture = createErrorCaptureEvent(request, { ...this.config, eventId: id });
      const header = {
        event_id: id,
        dsn: `${this.origin.replace("://", `://${this.config.writeKey}@`)}/api/v1/errors/1`,
      };
      const event = {
        event_id: id,
        timestamp: new Date().toISOString(),
        platform: "javascript",
        level: "error",
        environment: capture.environment,
        release: capture.release,
        sdk: { name: "custd.javascript", version: SDK_VERSION },
        tags: capture.correlationId ? { correlation_id: capture.correlationId } : undefined,
        exception: {
          values: [
            {
              type: capture.exceptionType,
              mechanism: { handled: capture.mode !== "unhandled" },
              stacktrace: { frames: capture.frames },
            },
          ],
        },
      };
      const body = [JSON.stringify(header), '{"type":"event"}', JSON.stringify(event)].join("\n");
      if (new TextEncoder().encode(body).length > maxEnvelopeBytes) return { outcome: "limited" };
      const response = await this.send(`${this.origin}/api/v1/errors/api/1/envelope/`, {
        method: "POST",
        body,
        headers: { "Content-Type": "text/plain" },
        credentials: "omit",
        redirect: "error",
        referrerPolicy: "no-referrer",
        signal: AbortSignal.timeout(2000),
      });
      return { outcome: response.ok ? "accepted" : "rejected", status: response.status };
    } catch {
      return { outcome: "unavailable" };
    } finally {
      this.concurrent -= 1;
    }
  }
}

function safeExceptionType(error: unknown): string {
  return error instanceof Error && /^[A-Za-z_$][A-Za-z0-9_$.]{0,127}$/u.test(error.name) ? error.name : "Error";
}

/** Drop the message line and retain only bounded code locations, never full URLs or local paths. */
function exceptionFrames(error: unknown): ErrorFrame[] {
  if (!(error instanceof Error) || typeof error.stack !== "string") return [];
  return error.stack
    .slice(0, 32_768)
    .split("\n")
    .slice(1, maxFrames + 1)
    .flatMap((line) => {
      const location = line.match(/(?:\(|@|\s)((?:https?:\/\/|file:\/\/|\/)?[^\s()]+):(\d+):(\d+)\)?$/u);
      if (!location) return [];
      const path = location[1].replace(/[?#].*$/u, "");
      const filename = path.split(/[\\/]/u).pop();
      if (!filename || !/^[A-Za-z0-9_.-]{1,128}\.(?:[cm]?js|jsx|tsx?|bundle)$/u.test(filename)) return [];
      return [
        { filename, lineno: Math.min(Number(location[2]), 1_000_000), colno: Math.min(Number(location[3]), 1_000_000) },
      ];
    })
    .reverse();
}

/** Install once at the application boundary; close it when that application unmounts. */
export function installBrowserErrorCapture(client: ErrorCaptureClient): () => void {
  const onError = (event: ErrorEvent) => {
    void client.captureException({ error: event.error, mode: "unhandled" });
  };
  const onRejection = (event: PromiseRejectionEvent) => {
    void client.captureException({ error: event.reason, mode: "unhandled" });
  };
  window.addEventListener("error", onError);
  window.addEventListener("unhandledrejection", onRejection);
  return () => {
    window.removeEventListener("error", onError);
    window.removeEventListener("unhandledrejection", onRejection);
  };
}

export type NativeErrorHandler = (error: unknown, fatal?: boolean) => void;

/** React Native ErrorUtils-shaped seam; no native dependencies or global patching. */
export interface NativeErrorSource {
  getGlobalHandler(): NativeErrorHandler;
  setGlobalHandler(handler: NativeErrorHandler): void;
}

/** Capture delivery remains bounded by the caller; native error handling always runs. */
export function installNativeErrorCapture(
  source: NativeErrorSource,
  capture: (request: CaptureExceptionRequest) => unknown,
): () => void {
  const original = source.getGlobalHandler();
  const handler: NativeErrorHandler = (error, fatal) => {
    try {
      void Promise.resolve(capture({ error, mode: "unhandled" })).catch(() => undefined);
    } catch {
      // Optional capture cannot prevent the native handler from reporting the failure.
    }
    original(error, fatal);
  };
  source.setGlobalHandler(handler);
  return () => {
    if (source.getGlobalHandler() === handler) source.setGlobalHandler(original);
  };
}
