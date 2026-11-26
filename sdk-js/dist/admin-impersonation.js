/**
 * Operator impersonation sessions. A session lets a system administrator act as a named user for a
 * bounded window. Consent is server-owned: the returned `consentState` is the answer, so a caller
 * must not assume a session is usable because the start call returned.
 */
const sessionsPath = "/impersonation-sessions";
export class ImpersonationAdminClient {
    constructor(request) {
        this.request = request;
    }
    start(body, options) {
        return this.request("POST", sessionsPath, body, options);
    }
    /** The caller's most recent sessions. */
    async list(options) {
        const list = await this.request("GET", sessionsPath, undefined, options);
        return { sessions: list.sessions ?? [] };
    }
    /** Ends the session as its holder. */
    stop(sessionUuid, options) {
        return this.request("POST", `${sessionsPath}/${encodeURIComponent(sessionUuid)}/stop`, undefined, options);
    }
    /** Ends the session as an operator action, recorded distinctly from a stop. */
    terminate(sessionUuid, options) {
        return this.request("POST", `${sessionsPath}/${encodeURIComponent(sessionUuid)}/terminate`, undefined, options);
    }
}
