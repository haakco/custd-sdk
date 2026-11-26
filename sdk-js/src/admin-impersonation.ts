/**
 * Operator impersonation sessions. A session lets a system administrator act as a named user for a
 * bounded window. Consent is server-owned: the returned `consentState` is the answer, so a caller
 * must not assume a session is usable because the start call returned.
 */

import type { RequestOptions } from "./index.js";

/** Asks for a session. The operator is taken from the credential, never from the request. */
export type ImpersonationSessionCreateRequest = {
  companySlug: string;
  targetUserUuid: string;
  reason: string;
  /** RFC3339 end of the window. */
  expiresAt: string;
};

/** One operator acting as one user. `stoppedAt` is null while the session is live. */
export type ImpersonationSession = {
  sessionUuid: string;
  companySlug: string;
  targetUserUuid: string;
  targetUserEmail?: string;
  reason: string;
  consentState: string;
  startedAt: string;
  expiresAt: string;
  stoppedAt: string | null;
  stopReason?: string;
};

export type ImpersonationSessionListResponse = { sessions: ImpersonationSession[] };

/** The state a stop or terminate left the session in. */
export type ImpersonationSessionEnded = { sessionUuid: string; state: "stopped" | "terminated" };

type AdminRequester = <T>(method: string, path: string, body?: unknown, options?: RequestOptions) => Promise<T>;

const sessionsPath = "/impersonation-sessions";

export class ImpersonationAdminClient {
  constructor(private readonly request: AdminRequester) {}

  start(body: ImpersonationSessionCreateRequest, options?: RequestOptions): Promise<ImpersonationSession> {
    return this.request("POST", sessionsPath, body, options);
  }

  /** The caller's most recent sessions. */
  async list(options?: RequestOptions): Promise<ImpersonationSessionListResponse> {
    const list = await this.request<ImpersonationSessionListResponse>("GET", sessionsPath, undefined, options);
    return { sessions: list.sessions ?? [] };
  }

  /** Ends the session as its holder. */
  stop(sessionUuid: string, options?: RequestOptions): Promise<ImpersonationSessionEnded> {
    return this.request("POST", `${sessionsPath}/${encodeURIComponent(sessionUuid)}/stop`, undefined, options);
  }

  /** Ends the session as an operator action, recorded distinctly from a stop. */
  terminate(sessionUuid: string, options?: RequestOptions): Promise<ImpersonationSessionEnded> {
    return this.request("POST", `${sessionsPath}/${encodeURIComponent(sessionUuid)}/terminate`, undefined, options);
  }
}
