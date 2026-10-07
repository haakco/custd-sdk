// Narrow runtime guards shared by the typed response boundaries.
//
// The TypeScript response types are erased at runtime, so a JSON success body
// that omits an owner-required field or carries the wrong shape would otherwise
// flow through a generic cast. These guards reject that body at the boundary.
// They are internal to the SDK and not re-exported from the package index.
export function requireRecord(value, context) {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
        throw new TypeError(`custd: ${context} must be a JSON object`);
    }
    return value;
}
function requireField(record, key, context) {
    const value = record[key];
    if (value === undefined || value === null) {
        throw new TypeError(`custd: ${context} field ${key} is required`);
    }
    return value;
}
export function requireString(record, key, context) {
    const value = requireField(record, key, context);
    if (typeof value !== "string") {
        throw new TypeError(`custd: ${context} field ${key} must be a string`);
    }
    return value;
}
export function requireInteger(record, key, context) {
    const value = requireField(record, key, context);
    if (typeof value !== "number" || !Number.isInteger(value)) {
        throw new TypeError(`custd: ${context} field ${key} must be an integer`);
    }
    return value;
}
export function requireBoolean(record, key, context) {
    const value = requireField(record, key, context);
    if (typeof value !== "boolean") {
        throw new TypeError(`custd: ${context} field ${key} must be a boolean`);
    }
    return value;
}
/**
 * Return the named list of JSON objects. A missing or non-list container, or a
 * scalar element, fails. An empty list is accepted because the service emits
 * `[]` for an empty collection.
 */
export function requireObjectList(record, key, context) {
    const value = requireField(record, key, context);
    if (!Array.isArray(value)) {
        throw new TypeError(`custd: ${context} field ${key} must be a list`);
    }
    return value.map((item, index) => requireRecord(item, `${context} ${key}[${index}]`));
}
/**
 * Validate an optional field only when it is present. An absent field (or an
 * explicitly `undefined` one) is valid; a present value must satisfy the
 * declared type, so a present `null` fails rather than being treated as absent.
 * Every producer of these DTOs omits an empty optional rather than sending null.
 */
export function optionalString(record, key, context) {
    const value = record[key];
    if (value === undefined) {
        return;
    }
    if (typeof value !== "string") {
        throw new TypeError(`custd: ${context} field ${key} must be a string`);
    }
}
/**
 * Validate an optional integer field only when it is present. A present `null`
 * fails because the declared type is omitted-or-integer, not nullable.
 */
export function optionalInteger(record, key, context) {
    const value = record[key];
    if (value === undefined) {
        return;
    }
    if (typeof value !== "number" || !Number.isInteger(value)) {
        throw new TypeError(`custd: ${context} field ${key} must be an integer`);
    }
}
/**
 * Validate an optional JSON-object field only when it is present. An absent
 * field is valid; a present value must be a JSON object, so a present `null` or
 * array fails against the declared `Record` type.
 */
export function optionalRecord(record, key, context) {
    const value = record[key];
    if (value === undefined) {
        return;
    }
    requireRecord(value, `${context} field ${key}`);
}
