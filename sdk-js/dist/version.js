/**
 * Released SDK version. scripts/check-sdk-version-identity.sh asserts it equals
 * VERSION and scripts/bump-version.sh updates it, so a release cannot leave it
 * behind.
 */
export const SDK_VERSION = "2.3.0";
/** Product named in X-Custd-Sdk, so Custd can report which callers use which release. */
export const SDK_PRODUCT = "js";
/** Value sent in the X-Custd-Sdk header. */
export const SDK_IDENTITY = `${SDK_PRODUCT}/${SDK_VERSION}`;
