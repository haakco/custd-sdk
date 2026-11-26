/**
 * A tenant's outbound email relay. Without an enabled, complete relay the tenant's mail goes through
 * Custd's shared relay. The password is write-only: reads report only whether one is stored.
 */
import type { RequestOptions } from "./index.js";
type AdminRequester = <T>(method: string, path: string, body?: unknown, options?: RequestOptions) => Promise<T>;
export type EmailRelayTlsMode = "starttls" | "implicit" | "none";
/** Which relay the next message would use: the tenant's own, or Custd's shared relay. */
export type EmailRelayKind = "client" | "custd";
export type EmailRelay = {
    host: string;
    port: number;
    tlsMode: EmailRelayTlsMode;
    username: string;
    fromAddress: string;
    fromDisplayName: string;
    enabled: boolean;
    hasCredential: boolean;
    createdAt: string;
    updatedAt: string;
};
export type EmailRelayEffectiveSender = {
    relay: EmailRelayKind;
    fromAddress: string;
    fromDisplayName: string;
    hasCredential: boolean;
};
/** The tenant's relay and the sender the next message would use. `relay` is null when the tenant uses Custd's relay. */
export type EmailRelayView = {
    relay: EmailRelay | null;
    effective: EmailRelayEffectiveSender;
};
export type EmailRelayWriteRequest = {
    host: string;
    port: number;
    tlsMode: EmailRelayTlsMode;
    username: string;
    password: string;
    fromAddress: string;
    fromDisplayName: string;
    enabled: boolean;
};
/** A published campaign revision and the slot values to render it with. */
export type CampaignEmailSelection = {
    revision: string;
    values: Record<string, string>;
};
export type EmailRelayTestSendRequest = {
    recipient: string;
    campaign?: CampaignEmailSelection;
};
export type EmailRelayTestSendResult = {
    accepted: boolean;
    messageUuid: string;
    deliveryUuids: string[];
    sender: EmailRelayEffectiveSender;
};
export declare class EmailRelayAdminClient {
    private readonly request;
    constructor(request: AdminRequester);
    get(tenantSlug: string): Promise<EmailRelayView>;
    put(tenantSlug: string, body: EmailRelayWriteRequest): Promise<EmailRelay>;
    delete(tenantSlug: string): Promise<void>;
    testSend(tenantSlug: string, body: EmailRelayTestSendRequest): Promise<EmailRelayTestSendResult>;
}
export {};
