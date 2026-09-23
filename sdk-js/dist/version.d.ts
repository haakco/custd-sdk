/**
 * Released SDK version. scripts/check-sdk-version-identity.sh asserts it equals
 * VERSION and scripts/bump-version.sh updates it, so a release cannot leave it
 * behind.
 */
export declare const SDK_VERSION = "2.4.0";
/** Product named in X-Custd-Sdk, so Custd can report which callers use which release. */
export declare const SDK_PRODUCT = "js";
/** Value sent in the X-Custd-Sdk header. */
export declare const SDK_IDENTITY = "js/2.4.0";
