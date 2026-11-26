/**
 * Managed audit producer provisioning: the provisioning broker mints a producer credential for a
 * managed-audit tenant. The request and the returned bundle are the producer-provisioning contract.
 */

import type { ProducerProvisionCreate, ProvisionedProducerCredentials, RequestOptions } from "./index.js";

type NonAdminRequester = <T>(method: string, path: string, body?: unknown, options?: RequestOptions) => Promise<T>;

export class ManagedAuditAdminClient {
  constructor(private readonly request: NonAdminRequester) {}

  /** The returned bundle holds the client secret; it is shown only once. */
  provisionProducer(body: ProducerProvisionCreate, options?: RequestOptions): Promise<ProvisionedProducerCredentials> {
    return this.request("POST", "/managed-audit/provision", body, options);
  }
}
