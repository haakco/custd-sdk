// The URL rule for calls that carry a credential outside CustdClient: HTTPS, or plain HTTP only to a
// local development host, and never with embedded credentials, a query or a fragment.
const localHosts = ["localhost", "127.0.0.1", "[::1]", "host.docker.internal"];
/** Whether a parsed URL hostname is a local development host. IPv6 hostnames keep their brackets. */
export function isLocalHostname(hostname) {
    return localHosts.includes(hostname);
}
/** The parsed URL when it follows the rule, otherwise undefined. */
export function secureOrLocalUrl(raw) {
    let url;
    try {
        url = new URL(raw);
    }
    catch {
        return undefined;
    }
    const local = isLocalHostname(url.hostname);
    if (url.protocol !== "https:" && !(url.protocol === "http:" && local))
        return undefined;
    if (url.username || url.password || url.search || url.hash)
        return undefined;
    return url;
}
