import type { RequestOptions } from "./index.js";

export type DataLabelSensitivity = "public" | "internal" | "personal" | "restricted";
export type DataLabelPropagationPolicy = "none" | "event_type_to_event" | "pack_selected";

export type DataLabelValue = {
  uuid: string;
  value: string;
  displayName: string;
  description: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
};
export type DataLabelDefinition = {
  uuid: string;
  authority: string;
  key: string;
  displayName: string;
  description: string;
  allowedScopes: string[];
  sensitivity: DataLabelSensitivity;
  intendedUse: string;
  synonyms: string[];
  propagationPolicy: DataLabelPropagationPolicy;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
  values: DataLabelValue[];
};
export type DataLabelDefinitionCreateRequest = Omit<
  DataLabelDefinition,
  "uuid" | "authority" | "enabled" | "createdAt" | "updatedAt" | "values"
>;
export type DataLabelDefinitionUpdateRequest = Omit<DataLabelDefinitionCreateRequest, "key">;
export type DataLabelValueCreateRequest = Pick<DataLabelValue, "value" | "displayName" | "description">;
export type DataLabelValueUpdateRequest = Pick<DataLabelValue, "displayName" | "description">;
export type DataLabelDefinitionListResponse = { definitions: DataLabelDefinition[] };
export type DataLabelUsage = {
  definitionUuid: string;
  valueUuid: string;
  eventTypeDefaults: number;
  schemaFieldAssignments: number;
  total: number;
};
export type DataLabelUsageListResponse = { usage: DataLabelUsage[] };
export type EventTypeDataLabelDefault = { eventTypeSlug: string; definitionUuid: string; valueUuid: string };
export type EventTypeDataLabelDefaultRequest = { valueUuid: string };
export type SchemaFieldDataLabelAssignment = {
  assignmentUuid: string;
  schemaUuid: string;
  fieldPath: string;
  definitionUuid: string;
  valueUuid: string;
};
export type SchemaFieldDataLabelAssignmentRequest = Omit<
  SchemaFieldDataLabelAssignment,
  "assignmentUuid" | "schemaUuid"
>;
export type DataLabelAssignmentListResponse = {
  eventTypeDefaults: EventTypeDataLabelDefault[];
  schemaFieldAssignments: SchemaFieldDataLabelAssignment[];
};
export type DescriptiveDataLabel = {
  definitionUuid: string;
  key: string;
  displayName: string;
  description?: string;
  sensitivity?: DataLabelSensitivity;
  intendedUse?: string;
  synonyms?: string[];
  enabled: boolean;
};
export type DataLabelCatalogue = { labels: DescriptiveDataLabel[] };
export type DataLabelCatalogueAssignment = {
  scope: string;
  eventTypeSlug?: string;
  schemaUuid?: string;
  fieldPath?: string;
  definitionUuid: string;
  valueUuid: string;
};
export type DataLabelCatalogueDataset = {
  displayName: string;
  unit?: string;
  definitionUuid?: string;
  valueUuids?: string[];
};
export type DataLabelCataloguePack = {
  displayName: string;
  enabled: boolean;
  datasets: DataLabelCatalogueDataset[];
};
export type DataLabelCatalogueResponse = {
  catalogue: DataLabelCatalogue;
  assignments: DataLabelCatalogueAssignment[];
  reportingPacks: DataLabelCataloguePack[];
  fingerprint: string;
};

type AdminRequester = <T>(method: string, path: string, body?: unknown, options?: RequestOptions) => Promise<T>;
const includeDisabledQuery = (include: boolean): string => (include ? "?includeDisabled=true" : "");

export class DataLabelAdminClient {
  constructor(private readonly request: AdminRequester) {}
  list(includeDisabled = false): Promise<DataLabelDefinitionListResponse> {
    return this.request("GET", `/data-labels${includeDisabledQuery(includeDisabled)}`);
  }
  catalogue(includeDisabled = false): Promise<DataLabelCatalogueResponse> {
    return this.request("GET", `/data-labels/catalogue${includeDisabledQuery(includeDisabled)}`);
  }
  get(uuid: string, includeDisabled = false): Promise<DataLabelDefinition> {
    return this.request("GET", `/data-labels/${encodeURIComponent(uuid)}${includeDisabledQuery(includeDisabled)}`);
  }
  create(body: DataLabelDefinitionCreateRequest): Promise<DataLabelDefinition> {
    return this.request("POST", "/data-labels", body);
  }
  update(uuid: string, body: DataLabelDefinitionUpdateRequest): Promise<DataLabelDefinition> {
    return this.request("PATCH", `/data-labels/${encodeURIComponent(uuid)}`, body);
  }
  disable(uuid: string): Promise<void> {
    return this.request("POST", `/data-labels/${encodeURIComponent(uuid)}/disable`);
  }
  createValue(uuid: string, body: DataLabelValueCreateRequest): Promise<DataLabelValue> {
    return this.request("POST", `/data-labels/${encodeURIComponent(uuid)}/values`, body);
  }
  updateValue(uuid: string, body: DataLabelValueUpdateRequest): Promise<DataLabelValue> {
    return this.request("PATCH", `/data-label-values/${encodeURIComponent(uuid)}`, body);
  }
  disableValue(uuid: string): Promise<void> {
    return this.request("POST", `/data-label-values/${encodeURIComponent(uuid)}/disable`);
  }
  listUsage(): Promise<DataLabelUsageListResponse> {
    return this.request("GET", "/data-labels/usage");
  }
  listAssignments(): Promise<DataLabelAssignmentListResponse> {
    return this.request("GET", "/data-label-assignments");
  }
  setEventTypeDefault(slug: string, definitionUuid: string, body: EventTypeDataLabelDefaultRequest): Promise<void> {
    return this.request(
      "PUT",
      `/event-types/${encodeURIComponent(slug)}/data-label-defaults/${encodeURIComponent(definitionUuid)}`,
      body,
    );
  }
  removeEventTypeDefault(slug: string, definitionUuid: string): Promise<void> {
    return this.request(
      "DELETE",
      `/event-types/${encodeURIComponent(slug)}/data-label-defaults/${encodeURIComponent(definitionUuid)}`,
    );
  }
  setSchemaFieldAssignment(schemaUuid: string, body: SchemaFieldDataLabelAssignmentRequest): Promise<void> {
    return this.request("PUT", `/event-schemas/${encodeURIComponent(schemaUuid)}/field-data-labels`, body);
  }
  removeSchemaFieldAssignment(assignmentUuid: string): Promise<void> {
    return this.request("DELETE", `/data-label-assignments/schema-fields/${encodeURIComponent(assignmentUuid)}`);
  }
}
