/**
 * List fields per operation, keyed by "METHOD /api/v1/path/{param}". A field path is dotted; a `[]`
 * segment means every item of the list before it, and a path of only `[]` is a list body.
 */
export type ResponseListTable = Readonly<Record<string, readonly string[]>>;
/**
 * Returns the decode step for one table: it takes the request method, the request path from /api/v1
 * (a query is ignored) and the decoded body. The table's routes compile on the first response.
 */
export declare function responseListNormaliser(table: ResponseListTable): <T>(method: string, requestPath: string, body: T) => T;
/** CustdClient's decode step. Each is pure, so a bundle that never uses one drops its table. */
export declare const emptyApiNullLists: <T>(method: string, requestPath: string, body: T) => T;
/** AppItemsClient's decode step. */
export declare const emptyAppNullLists: <T>(method: string, requestPath: string, body: T) => T;
/** fetchBrowserSiteConfig's decode step. */
export declare const emptySiteConfigNullLists: <T>(method: string, requestPath: string, body: T) => T;
