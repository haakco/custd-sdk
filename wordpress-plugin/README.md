# Custd WordPress Plugin

First-party WordPress integration for Custd. The plugin uses the shared PHP SDK
client and does not maintain a private HTTP emitter.

## Install

Install the root SDK package through Composer VCS. Composer discovers the root
package from this repository, and the WordPress plugin is included under
`vendor/haakco/custd-sdk/wordpress-plugin/`:

```json
{
  "repositories": [
    {
      "type": "vcs",
      "url": "https://github.com/haakco/custd-sdk"
    }
  ],
  "require": {
    "haakco/custd-sdk": "^1.1"
  }
}
```

For WordPress activation from a Composer install, symlink
`vendor/haakco/custd-sdk/wordpress-plugin/` into `wp-content/plugins/custd/`
so the plugin can still reach the root `vendor/autoload.php`.
The nested `wordpress-plugin/composer.json` is package metadata for built or
subtree plugin artifacts. Composer VCS installs from this monorepo should
require the root `haakco/custd-sdk` package shown above.
Raw GitHub source ZIPs are not standalone plugin artifacts because they do not
include Composer dependencies; ZIP installs should use a built release artifact
that includes `vendor/`. Do not copy only the source directory from the
Composer vendor tree.

## Setup

Create a tenant-bound producer client with the SDK-owned setup helper:

```bash
go run github.com/haakco/custd-sdk/sdk-go/cmd/custd-sdk-setup@latest \
  --base-url=https://custd.k8.haak.co \
  --admin-url=https://custd.k8.haak.co \
  --admin-token="$CUSTD_ADMIN_TOKEN" \
  --token-url=https://custd-auth.k8.haak.co/oauth2/token \
  --tenant=my-wordpress-site \
  --company-name="My WordPress Site" \
  --client-id=my-wordpress-site \
  --scope=events.write \
  --environment=production
```

Use the generated `CUSTD_WP_*` env block, or store matching values in the
`custd_settings` WordPress option.

## Events

The plugin records:

- `wordpress.user_login`
- `wordpress.user_register`
- `wordpress.post_status_transition`
- `wordpress.plugin_heartbeat`

Payloads include WordPress IDs, roles, post status/type, and environment.
Emails and login-derived identifiers are not sent.

## Authy Boundary

Authy/WPAuth managed audit reporting is owned by the Authy export subsystem and
the SDK Awthy DTOs in `sdk-php/src/Awthy/`. This generic WordPress plugin does
not implement Authy paid gates, audit export destinations, privacy-erasure
propagation, or Awthy audit-event mapping.
