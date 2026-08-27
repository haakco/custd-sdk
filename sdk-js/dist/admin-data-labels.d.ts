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
export type DataLabelDefinitionCreateRequest = Omit<DataLabelDefinition, "uuid" | "authority" | "enabled" | "createdAt" | "updatedAt" | "values">;
export type DataLabelDefinitionUpdateRequest = Omit<DataLabelDefinitionCreateRequest, "key">;
export type DataLabelValueCreateRequest = Pick<DataLabelValue, "value" | "displayName" | "description">;
export type DataLabelValueUpdateRequest = Pick<DataLabelValue, "displayName" | "description">;
export type DataLabelDefinitionListResponse = {
    definitions: DataLabelDefinition[];
};
export type DataLabelUsage = {
    definitionUuid: string;
    valueUuid: string;
    eventTypeDefaults: number;
    schemaFieldAssignments: number;
    total: number;
};
export type DataLabelUsageListResponse = {
    usage: DataLabelUsage[];
};
export type EventTypeDataLabelDefault = {
    eventTypeSlug: string;
    definitionUuid: string;
    valueUuid: string;
};
export type EventTypeDataLabelDefaultRequest = {
    valueUuid: string;
};
export type SchemaFieldDataLabelAssignment = {
    assignmentUuid: string;
    schemaUuid: string;
    fieldPath: string;
    definitionUuid: string;
    valueUuid: string;
};
export type SchemaFieldDataLabelAssignmentRequest = Omit<SchemaFieldDataLabelAssignment, "assignmentUuid" | "schemaUuid">;
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
export type DataLabelCatalogue = {
    labels: DescriptiveDataLabel[];
};
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
export declare class DataLabelAdminClient {
    private readonly request;
    constructor(request: AdminRequester);
    list(includeDisabled?: boolean): Promise<DataLabelDefinitionListResponse>;
    catalogue(includeDisabled?: boolean): Promise<DataLabelCatalogueResponse>;
    get(uuid: string, includeDisabled?: boolean): Promise<DataLabelDefinition>;
    create(body: DataLabelDefinitionCreateRequest): Promise<DataLabelDefinition>;
    update(uuid: string, body: DataLabelDefinitionUpdateRequest): Promise<DataLabelDefinition>;
    disable(uuid: string): Promise<void>;
    createValue(uuid: string, body: DataLabelValueCreateRequest): Promise<DataLabelValue>;
    updateValue(uuid: string, body: DataLabelValueUpdateRequest): Promise<DataLabelValue>;
    disableValue(uuid: string): Promise<void>;
    listUsage(): Promise<DataLabelUsageListResponse>;
    listAssignments(): Promise<DataLabelAssignmentListResponse>;
    setEventTypeDefault(slug: string, definitionUuid: string, body: EventTypeDataLabelDefaultRequest): Promise<void>;
    removeEventTypeDefault(slug: string, definitionUuid: string): Promise<void>;
    setSchemaFieldAssignment(schemaUuid: string, body: SchemaFieldDataLabelAssignmentRequest): Promise<void>;
    removeSchemaFieldAssignment(assignmentUuid: string): Promise<void>;
}
export {};
