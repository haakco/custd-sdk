/**
 * The tenant's event schema collection in the schema registry (/api/v1/schemas). The credential names
 * the tenant, so no call takes a slug.
 */
export const schemaRegistryPath = "/schemas";
export function eventSchemaPath(eventType, version) {
    const base = `${schemaRegistryPath}/${encodeURIComponent(eventType)}`;
    return version === undefined ? base : `${base}/${encodeURIComponent(version)}`;
}
