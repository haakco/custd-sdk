# SDK compatibility materials: data scopes + raw source target

Materials for the Sol medium review of the next SDK release. **Not published:**
no version bump, tag, push, or package publish has been performed; this
summarizes the additive public API so a reviewer can confirm the semver call.

## Semver call

Every change is **additive** to the existing public surface. No exported
identifier is removed, renamed, or retyped, and no wire field changes meaning.
That is a **minor** release on the shared `VERSION` (next compatible public ref
`v2.8.0` from `v2.7.0`). The Go mirror tag must be `v2.x.y` and must equal
`VERSION` (`release-guard`), for module `github.com/haakco/custd-sdk-go/v2`.

## Added wire contracts (owned by the backend, mirrored by the SDKs)

### Data-scope management (`/api/v1/admin`, scope: `data_scopes.manage`)

| Method | Path | Body | Response |
| --- | --- | --- | --- |
| POST | `/data-scopes` | `{code,name}` | 201 `DataScope` |
| GET | `/data-scopes[?includeDisabled=true]` | – | `{scopes:[DataScope]}` |
| GET | `/data-scopes/{scopeUuid}` | – | `DataScope` |
| PATCH | `/data-scopes/{scopeUuid}` | `{name?,status?}` | `DataScope` |
| POST | `/data-scopes/{scopeUuid}/disable` | – | 204 |
| POST | `/data-scopes/{scopeUuid}/resources` | `{code,name}` | 201 `DataScopeResource` |
| GET | `/data-scopes/{scopeUuid}/resources[?includeDisabled=true]` | – | `{resources:[DataScopeResource]}` |
| GET | `/data-scopes/{scopeUuid}/resources/{resourceUuid}` | – | `DataScopeResource` |
| PATCH | `/data-scopes/{scopeUuid}/resources/{resourceUuid}` | `{name?,status?}` | `DataScopeResource` |
| POST | `/data-scopes/{scopeUuid}/resources/{resourceUuid}/disable` | – | 204 |
| GET | `/data-scope-grants?kind=&userUuid=\|clientId=` | – | `{grants:[Grant]}` |
| POST | `/data-scope-grants` | `{principal,target,action}` | 201 `Grant` |
| POST | `/data-scope-grants/revoke` | `{principal,target,action}` | 204 |

Closed unions: `status` active|disabled; `principal.kind` human|machine
(human = membership user UUID, machine = producer client ID); `target.kind`
parent|sub_client|resource (UUID-addressed); `action` read|write. Codes are
immutable selectors; UUIDs are configuration identities.

### Raw declarative source target (`POST /api/v1/raw`, ingest credential)

- Query options `subClient` and `resource` are appended **as a pair**. Both
  absent means no declared target; a single, unpaired, or malformed option is a
  400. The parser identifier binding (`X-Parser-UUID` header) is unchanged.
- The target is a **default**: it fills a record with no canonical
  `subClient`/`resource` selection and **must agree** with a record that carries
  one (a disagreement is a 400). Aliases never grant authority.
- Response is always **202** `{success,processed,failed}`; the status alone is
  not per-record success.

## Added public SDK identifiers

### Go (`github.com/haakco/custd-sdk-go/v2`)

New file `admin_data_scopes.go` on `CustdClient.Admin.DataScopes *DataScopeAdminClient`:
`CreateScope`, `ListScopes(includeDisabled bool)`, `GetScope`, `UpdateScope`,
`DisableScope`, `CreateResource`, `ListResources(includeDisabled bool)`,
`GetResource`, `UpdateResource`, `DisableResource`, `ListGrants`, `CreateGrant`,
`RevokeGrant`; types `DataScopeStatus`, `DataScope`, `DataScopeListResponse`,
`DataScopeResource`, `DataScopeResourceListResponse`, `DataScopePrincipalKind`,
`DataScopePrincipalRef`, `DataScopeGrantTargetKind`, `DataScopeGrantTarget`,
`DataScopeAction`, `DataScopeGrant`, `DataScopeGrantListResponse`,
`ValidDataScopeCode`, `ValidDataScopeName`.

New file `raw_ingest.go` on `CustdClient`:
`func (c *CustdClient) IngestRawLines(ctx context.Context, req RawIngestRequest) (*RawIngestResult, error)`;
types `RawSourceTarget{SubClient,Resource}`, `RawIngestRequest{Content,ParserUUID,Target *RawSourceTarget}`,
`RawIngestResult{Success,Processed,Failed}`, and the typed
`RawAcceptanceUnknownError` (non-retryable ambiguous acceptance, matched with `errors.As`).

Also (prior slice, same release): `CustdClient.Parsers *ParserClient` with
`ListPresets/List/Create/Update/Delete/Preview` and the `ParserFraming`/
`ParserFramingOutcome` types; `Analytics*Request` gained
`Severity/Service/SubClient/Resource`.

### JS (`@haakco/custd-sdk`)

`client.admin.dataScopes: DataScopeAdminClient` (methods `createScope`,
`listScopes`, `getScope`, `updateScope`, `disableScope`, `createResource`,
`listResources`, `getResource`, `updateResource`, `disableResource`,
`listGrants`, `createGrant`, `revokeGrant`) plus the exported DTO types.
`client.ingestRawLines(request: RawIngestRequest): Promise<RawIngestResult>`
plus `RawSourceTarget`/`RawIngestRequest`/`RawIngestResult` and the typed
`CustdRawAcceptanceUnknownError` (`retryability` `"none"`, no retry
`nextAction`). Prior slice: `client.parsers: ParserClient`, framing types,
analytics filter fields.

### Python (`custd-sdk`)

`client.admin.data_scopes: DataScopeAdminClient` (`create_scope`, `list_scopes`,
`get_scope`, `update_scope`, `disable_scope`, `create_resource`,
`list_resources`, `get_resource`, `update_resource`, `disable_resource`,
`list_grants`, `create_grant`, `revoke_grant`) plus TypedDicts.
`client.ingest_raw_lines(request: RawIngestRequest) -> RawIngestResult` plus the
raw TypedDicts and the typed `RawAcceptanceUnknownError` (non-retryable,
`unavailable` False). The `Transport` type widens from `EventEnvelope` to
`EventEnvelope | bytes` (raw uploads send verbatim bytes); `make_default_transport`
sends bytes raw and only gzip-compresses JSON events. Prior slice: `client.parsers`,
framing, analytics filters.

### PHP (`haakco/custd-sdk`)

`CustdClient::adminDataScopes(): Admin\DataScopeClient` (`createScope`,
`listScopes`, `getScope`, `updateScope`, `disableScope`, `createResource`,
`listResources`, `getResource`, `updateResource`, `disableResource`,
`listGrants`, `createGrant`, `revokeGrant`) with `Admin\DataScope\*` DTOs.
`CustdClient::ingestRawLines(RawIngest\RawIngestRequest): RawIngest\RawIngestResult`
with `RawIngest\*` DTOs and the typed `RawAcceptanceUnknownException`. The
`http_client` callback MAY declare a fourth `array<string,string> $headers`
argument; the raw upload passes it (including `X-Parser-UUID` and the raw
content type), so a three-parameter callback cannot observe the parser binding.
A custom raw transport that throws the documented `RetryableException` (its
transport-failure signal) is surfaced as `RawAcceptanceUnknownException` (no
replay); the non-raw request paths keep the retry semantics.
`Admin\DataScope\DataScopeValidation` gained `isValidCode`. Prior slice:
`CustdClient::parsers()`, framing, analytics filters.

## Compatibility notes for the reviewer

- No boolean "select mode" parameters and no bare map/array boundaries were
  added; each boundary is a named DTO. `ListScopes`/`ListResources` keep their
  existing optional `includeDisabled` flag (unpublished; left as-is).
- A raw `202` acceptance body must be an object carrying a boolean `success`
  and non-negative integer `processed` and `failed`. A missing/null/wrong-type
  field and a negative or fractional count are rejected — never defaulted or
  coerced — and the legitimate partial counts the route emits are returned
  unchanged. All four SDKs enforce this: PHP reuses `Fields::boolean`/`Fields::integer`
  and then rejects a negative count explicitly.
- A raw transport failure, an unusable `202` body, or a retryable status is an
  **unknown acceptance**: the request may or may not have landed. The SDK
  surfaces a typed ambiguous-acceptance error (Go `RawAcceptanceUnknownError`,
  JS `CustdRawAcceptanceUnknownError`, Python `RawAcceptanceUnknownError`, PHP
  `RawAcceptanceUnknownException`) that recommends no replay, and never retries
  the raw POST. On the PHP raw path this includes a custom transport that throws
  the documented `RetryableException`. The shared non-raw error behaviour is
  unchanged.
- Client-side validation is shape-only (codes, closed unions, UUIDs); the
  backend remains the authority on registration, grants, and record selection.
- PHP's `http_client` callable now receives the request headers as a fourth
  argument on the raw path; JSON event paths are unchanged.
- The raw upload does not retry (a duplicate POST would double-land); a
  transport failure surfaces as the ambiguous-acceptance error for the caller.
  The backend occurrence-identity/deduplication protocol is a separate open
  integration item.
