/**
 * Admin uncertainty models: named quantity models, their immutable versions and copies. Runs are
 * read and started through the analytics API (`CustdClient.measurement.uncertaintyModels`).
 */

import type {
  AppModelCopyRequest,
  AppModelCreate,
  AppModelQuantity,
  AppModelVersion,
  AppUncertaintyModel,
} from "./app-models.js";
import type { RequestOptions } from "./index.js";

type AdminRequester = <T>(method: string, path: string, body?: unknown, options?: RequestOptions) => Promise<T>;

/** Which models a list returns: those made in the admin console, by apps, or both. */
export type UncertaintyModelSource = "all" | "admin" | "app";

/** One model in a list, without its version. */
export type UncertaintyModelSummary = Omit<AppUncertaintyModel, "version" | "queuedRunFailure">;

export type UncertaintyModelList = { models: UncertaintyModelSummary[] };

/** A new immutable version: the whole quantity list. */
export type UncertaintyModelVersionCreate = { quantities: AppModelQuantity[]; note?: string };

export type UncertaintyModelVersionSummary = {
  versionUuid: string;
  versionNumber: number;
  note: string;
  quantityCount: number;
  createdAt: string;
};

export type UncertaintyModelVersionList = { versions: UncertaintyModelVersionSummary[] };

export class UncertaintyModelAdminClient {
  constructor(private readonly request: AdminRequester) {}

  async list(source?: UncertaintyModelSource, companySlug?: string): Promise<UncertaintyModelList> {
    const list = await this.request<{ models: UncertaintyModelSummary[] | null }>(
      "GET",
      modelPath("", companySlug, source),
    );
    return { models: list.models ?? [] };
  }

  async get(modelUuid: string, companySlug?: string): Promise<AppUncertaintyModel> {
    return model(await this.request("GET", modelPath(`/${encodeURIComponent(modelUuid)}`, companySlug)));
  }

  async create(body: AppModelCreate, companySlug?: string): Promise<AppUncertaintyModel> {
    return model(await this.request("POST", modelPath("", companySlug), body));
  }

  async copy(modelUuid: string, body: AppModelCopyRequest = {}, companySlug?: string): Promise<AppUncertaintyModel> {
    return model(await this.request("POST", modelPath(`/${encodeURIComponent(modelUuid)}/copy`, companySlug), body));
  }

  async delete(modelUuid: string, companySlug?: string): Promise<void> {
    await this.request("DELETE", modelPath(`/${encodeURIComponent(modelUuid)}`, companySlug));
  }

  async listVersions(modelUuid: string, companySlug?: string): Promise<UncertaintyModelVersionList> {
    const path = modelPath(`/${encodeURIComponent(modelUuid)}/versions`, companySlug);
    const list = await this.request<{ versions: UncertaintyModelVersionSummary[] | null }>("GET", path);
    return { versions: list.versions ?? [] };
  }

  async getVersion(modelUuid: string, versionNumber: number, companySlug?: string): Promise<AppModelVersion> {
    const path = modelPath(`/${encodeURIComponent(modelUuid)}/versions/${versionNumber}`, companySlug);
    return version(await this.request("GET", path));
  }

  async createVersion(
    modelUuid: string,
    body: UncertaintyModelVersionCreate,
    companySlug?: string,
  ): Promise<AppModelVersion> {
    const path = modelPath(`/${encodeURIComponent(modelUuid)}/versions`, companySlug);
    return version(await this.request("POST", path, body));
  }
}

function version(wire: AppModelVersion): AppModelVersion {
  return { ...wire, quantities: wire.quantities ?? [] };
}

function model(wire: AppUncertaintyModel): AppUncertaintyModel {
  return wire.version ? { ...wire, version: version(wire.version) } : wire;
}

function modelPath(path: string, companySlug?: string, source?: UncertaintyModelSource): string {
  const query = new URLSearchParams();
  if (companySlug) query.set("companySlug", companySlug);
  if (source) query.set("source", source);
  const encoded = query.toString();
  return `/uncertainty-models${path}${encoded ? `?${encoded}` : ""}`;
}
