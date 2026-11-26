/** Whether a parsed URL hostname is a local development host. IPv6 hostnames keep their brackets. */
export declare function isLocalHostname(hostname: string): boolean;
/** The parsed URL when it follows the rule, otherwise undefined. */
export declare function secureOrLocalUrl(raw: string): URL | undefined;
