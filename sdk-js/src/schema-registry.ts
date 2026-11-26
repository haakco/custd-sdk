/**
 * The tenant's event schema collection in the schema registry (/api/v1/schemas). The credential names
 * the tenant, so no call takes a slug.
 */

/** One event type the tenant can send. */
export type RegisteredEventType = { slug: string; name: string; enabled: boolean };

export type RegisteredEventTypeList = { eventTypes: RegisteredEventType[] };

/** One stored version of an event type's schema. `jsonSchema` is the schema document as text. */
export type EventSchemaVersion = { version: string; jsonSchema: string; isActive: boolean; enabled: boolean };

export type EventSchemaVersionList = { versions: EventSchemaVersion[] };

/** One version's JSON Schema document exactly as stored. */
export type EventSchemaDocument = { schema: unknown };

/**
 * Registers a schema version, creating the event type when it is new. `jsonSchema` is the schema
 * document as text.
 */
export type EventSchemaRegisterRequest = {
  slug: string;
  name: string;
  version: string;
  jsonSchema: string;
  enabled: boolean;
  isActive: boolean;
};

/** Confirms a state change. */
export type EventSchemaStateResult = { updated: boolean };

export const schemaRegistryPath = "/schemas";

export function eventSchemaPath(eventType: string, version?: string): string {
  const base = `${schemaRegistryPath}/${encodeURIComponent(eventType)}`;
  return version === undefined ? base : `${base}/${encodeURIComponent(version)}`;
}
