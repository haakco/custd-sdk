# Unreleased — typed time-plan admin clients

Commit `2f051267d1655d175bd848dc3e53b0ede0048dbd` adds equivalent,
tenant-scoped time-plan admin clients to the Go, TypeScript, Python, and PHP
SDKs. Typed request and response DTOs cover plan drafts and revisions,
allocation previews, publication and retirement, runs, commands, history, and
annotation correction/redaction.

This change is not tagged or published. `VERSION` and the package manifests
remain `1.8.24`, so the published `v1.8.24` artifacts do not contain these
clients. Consumers must use a released version that includes this commit; the
exact SHA is only a source-checkout/development reference until then.
