# Custd WordPress Plugin

First-party WordPress integration for Custd. The plugin uses the shared PHP SDK
client and does not maintain a private HTTP emitter.

## Install

`haakco/custd-wordpress` ships from its own public mirror repo
(`haakco/custd-sdk-wordpress`), split from this monorepo on each release. Install via Composer VCS (no Packagist, no auth — the
repos are public). Add the mirror **and** the SDK repo so the transitive
`haakco/custd-sdk` dependency resolves:

```json
{
  "repositories": [
    { "type": "vcs", "url": "https://github.com/haakco/custd-sdk-wordpress" },
    { "type": "vcs", "url": "https://github.com/haakco/custd-sdk" }
  ],
  "require": {
    "haakco/custd-wordpress": "^1.3"
  }
}
```

```bash
composer require haakco/custd-wordpress:^1.3
```

For WordPress activation, symlink the installed package
(`vendor/haakco/custd-wordpress/`) into `wp-content/plugins/custd/` so the
plugin can reach the project's `vendor/autoload.php`. Raw GitHub source ZIPs are
not standalone plugin artifacts (no `vendor/`); use a Composer install or a
built release artifact that includes `vendor/`.

## Setup

Create a tenant-bound producer client with the SDK-owned setup helper:

```bash
go run github.com/haakco/custd-sdk-go/cmd/custd-sdk-setup@latest \
  --base-url=https://custd.com \
  --admin-url=https://custd.com \
  --admin-token="$CUSTD_ADMIN_TOKEN" \
  --token-url=https://auth.custd.com/oauth2/token \
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
