"""Released SDK version.

scripts/check-sdk-version-identity.sh asserts VERSION equals the repository
VERSION file and scripts/bump-version.sh updates it, so a release cannot leave
it behind.
"""

VERSION = "2.3.0"

#: Product named in X-Custd-Sdk, so Custd can report which callers use which release.
PRODUCT = "python"

#: Value sent in the X-Custd-Sdk header.
IDENTITY = f"{PRODUCT}/{VERSION}"
