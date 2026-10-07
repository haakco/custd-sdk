/** A decoded JSON object, keyed by string. */
export type JsonRecord = Record<string, unknown>;
export declare function requireRecord(value: unknown, context: string): JsonRecord;
export declare function requireString(record: JsonRecord, key: string, context: string): string;
export declare function requireInteger(record: JsonRecord, key: string, context: string): number;
export declare function requireBoolean(record: JsonRecord, key: string, context: string): boolean;
/**
 * Return the named list of JSON objects. A missing or non-list container, or a
 * scalar element, fails. An empty list is accepted because the service emits
 * `[]` for an empty collection.
 */
export declare function requireObjectList(record: JsonRecord, key: string, context: string): JsonRecord[];
/**
 * Validate an optional field only when it is present. An absent field (or an
 * explicitly `undefined` one) is valid; a present value must satisfy the
 * declared type, so a present `null` fails rather than being treated as absent.
 * Every producer of these DTOs omits an empty optional rather than sending null.
 */
export declare function optionalString(record: JsonRecord, key: string, context: string): void;
/**
 * Validate an optional integer field only when it is present. A present `null`
 * fails because the declared type is omitted-or-integer, not nullable.
 */
export declare function optionalInteger(record: JsonRecord, key: string, context: string): void;
/**
 * Validate an optional JSON-object field only when it is present. An absent
 * field is valid; a present value must be a JSON object, so a present `null` or
 * array fails against the declared `Record` type.
 */
export declare function optionalRecord(record: JsonRecord, key: string, context: string): void;
