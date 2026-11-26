// Custd's Go services send a nil list as JSON null. Every SDK result shows it as an empty list, so
// each transport passes the decoded body through one normaliser built from the generated table of
// list fields per operation. Only those fields change: a nullable field that is not a list stays null.
import { API_RESPONSE_LISTS, APP_RESPONSE_LISTS, SITE_CONFIG_RESPONSE_LISTS } from "./response-lists.generated.js";
/**
 * Returns the decode step for one table: it takes the request method, the request path from /api/v1
 * (a query is ignored) and the decoded body. The table's routes compile on the first response.
 */
export function responseListNormaliser(table) {
    let routes;
    return function emptyNullListsOf(method, requestPath, body) {
        routes ?? (routes = compileRoutes(table));
        const [path = ""] = requestPath.split("?", 1);
        const route = routes.find((candidate) => (candidate.method === method || candidate.method === "ANY") && candidate.pattern.test(path));
        if (body === null && route?.fields.some((field) => field.length === 1 && field[0] === "[]"))
            return [];
        for (const field of route?.fields ?? [])
            emptyNullLists(body, field, 0);
        return body;
    };
}
/** CustdClient's decode step. Each is pure, so a bundle that never uses one drops its table. */
export const emptyApiNullLists = /* @__PURE__ */ responseListNormaliser(API_RESPONSE_LISTS);
/** AppItemsClient's decode step. */
export const emptyAppNullLists = /* @__PURE__ */ responseListNormaliser(APP_RESPONSE_LISTS);
/** fetchBrowserSiteConfig's decode step. */
export const emptySiteConfigNullLists = /* @__PURE__ */ responseListNormaliser(SITE_CONFIG_RESPONSE_LISTS);
// A literal segment outranks a parameter, so /site-domains/keyword-lists is not read as a domain UUID.
function compileRoutes(table) {
    return Object.entries(table)
        .map(([operation, fields]) => {
        const [method = "", template = ""] = operation.split(" ");
        const segments = template
            .split("/")
            .map((segment) => (/^\{[^}]+\}$/.test(segment) ? "[^/]+" : escapeLiteral(segment)));
        return {
            method,
            pattern: new RegExp(`^${segments.join("/")}$`),
            parameters: segments.filter((segment) => segment === "[^/]+").length,
            fields: fields.map((field) => field.split(".").flatMap(listSegments)),
        };
    })
        .sort((left, right) => left.parameters - right.parameters);
}
function listSegments(segment) {
    const name = segment.replace(/(\[\])+$/, "");
    const items = (segment.length - name.length) / 2;
    return [...(name ? [name] : []), ...Array(items).fill("[]")];
}
function escapeLiteral(segment) {
    return segment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function emptyNullLists(node, field, index) {
    const segment = field[index];
    if (segment === "[]") {
        if (Array.isArray(node))
            for (const item of node)
                emptyNullLists(item, field, index + 1);
        return;
    }
    if (segment === undefined || typeof node !== "object" || node === null || Array.isArray(node))
        return;
    const record = node;
    if (index === field.length - 1) {
        if (record[segment] === null)
            record[segment] = [];
        return;
    }
    emptyNullLists(record[segment], field, index + 1);
}
