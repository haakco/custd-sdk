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

```bash
just test
```

Run a single SDK:

```bash
just test-go
just test-js
just test-python
just test-php
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
