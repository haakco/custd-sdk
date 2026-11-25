// A Site's public status page: chosen verified domains under customer-facing labels, and the
// reviewed updates published on it. SiteDomainAdminClient sends the calls, naming the Site by
// one of its domains.
/**
 * The link customers open, on the Custd panel origin (https://custd.com in production). The key
 * stays in the fragment, so it is never sent to a server or written to an access log.
 */
export function siteStatusPagePublicUrl(panelOrigin, publication) {
    return `${panelOrigin.replace(/\/+$/, "")}/status-page#${publication.publicKey}`;
}
