# Custd SDK

Public SDKs for sending events to Custd.

## Packages

- `sdk-go` — Go ingestion, admin, OAuth2 producer auth, batching, retry, queueing, and dogfood helpers.
- `sdk-js` — TypeScript ingestion SDK.
- `sdk-python` — Python ingestion SDK.
- `sdk-php` — PHP ingestion SDK.
- `contract-fixtures` — shared event fixtures used by every SDK test suite.

## Rule

SDK functionality belongs in this repository. Product repositories must consume released SDK versions instead of creating one-off clients or committing local filesystem replacements.

Local path replacements are allowed only for uncommitted experiments while actively changing the SDK. They must not be committed to downstream projects.

## Validation

Install the pinned local toolchain:

```bash
mise install
```

```bash
mise exec -- just check
```

Run a single SDK:

```bash
mise exec -- just test-go
mise exec -- just test-js
mise exec -- just test-python
mise exec -- just test-php
```

## Go Usage

```go
client := custd.NewClient(&custd.ClientConfig{
    BaseURL:      "https://ingest.example.com",
    ClientID:     "producer-client",
    ClientSecret: os.Getenv("CUSTD_CLIENT_SECRET"),
    TokenURL:     "https://auth.example.com/oauth2/token",
    Audience:     "custd",
    Scopes:       []string{"events.write"},
})
```

Go module:

```bash
go get github.com/haakco/custd-sdk/sdk-go@latest
```

## Producer Setup Helper

Use the SDK-owned setup CLI to create a tenant-bound OAuth2 producer client and
print the env vars each consumer needs. The CLI calls Custd admin APIs through
the Go SDK; it does not maintain a separate HTTP client.

```bash
go run github.com/haakco/custd-sdk/sdk-go/cmd/custd-sdk-setup@latest \
  --base-url=https://custd.k8.haak.co \
  --admin-url=https://custd.k8.haak.co \
  --admin-token="$CUSTD_ADMIN_TOKEN" \
  --token-url=https://custd-auth.k8.haak.co/oauth2/token \
  --tenant=vorrent \
  --company-name="Vorrent" \
  --client-id=vorrent-media-cache \
  --scope=events.write \
  --environment=production \
  --env-prefix=VORRENT_MEDIA_CACHE
```

Output includes env blocks for:

- Generic SDK consumers.
- Go / TypeScript / Python / PHP SDK usage.
- Laravel package config.
- WordPress plugin config.

Required admin input:

- `--admin-token` or `CUSTD_ADMIN_TOKEN`: bearer token with permission to create
  tenants and OAuth clients.
- `--base-url`: Custd API base URL used by producers.
- `--token-url`: OAuth2 token endpoint producers use for `client_credentials`.
- `--tenant`: tenant/company slug.
- `--client-id`: producer OAuth client ID.
