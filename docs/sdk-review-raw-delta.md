# Scoped review delta: raw acceptance + transport fixes (3 P1)

Base: frozen artifact at `docs/plans/evidence/sdk-review/source/` (Sol medium review base).
Revision: branch feat/reusable-log-contracts @ 226ab94b14e7c3889658a02a283d7b026df79ae2 (uncommitted working tree; no commit/bump/tag/push/publish).

Scope of this delta: the three P1 corrections — strict raw acceptance validation (incl. the PHP non-negative count guard), PHP custom-transport header pass-through, and typed unknown-acceptance classification for every raw failure path (incl. a custom-transport `RetryableException` throw). Scope/resource/grant/preset/query code is unchanged.

## Files in the delta

- `sdk-go/raw_ingest.go` sha256=`091549c20d403684bfd59eff231d845371455f5560d4384f88a5761c97030a1f`
- `sdk-go/raw_ingest_test.go` sha256=`e457f63275b8110fa5fb4e6ed70ed1452b68ab59313d055036dcd839fe3f9bf1`
- `sdk-js/src/index.ts` sha256=`3d369a0abb81ec866469a9492d1eddc65201fcda4dcc1046ee542d55f2f4f850`
- `sdk-js/src/raw-ingest.test.ts` sha256=`855a3fe83e1cd9b7784f8bcaab2ff47a3aca0e9d55240a9b1bec06fb60000efc`
- `sdk-python/src/custd/client.py` sha256=`bdc3268767ac18d059636a6e8ab2ff4a12d0945527dc492ad9992d733a327f5f`
- `sdk-python/src/custd/__init__.py` sha256=`5b2cb6b96c9ed8b51b7c3e4bb9f2426f1f9e6972ffbe4af5d40c6dc97366aed4`
- `sdk-python/tests/test_raw_ingest.py` sha256=`feb1629e71a3711dcc46505fafd86600ef3b26c52ba746f7e5d0dfdef995a012`
- `sdk-php/src/CustdClient.php` sha256=`29277c708212c01a0ec20b733766241e0e9d67851025d4c14a68209ba7ef1154`
- `sdk-php/src/RawAcceptanceUnknownException.php` sha256=`d6b23f67b4b89bc2af3b7b70b7cbc8854a5834f52b160378ced916a77c416d21`
- `sdk-php/src/RawIngest/RawIngestResult.php` sha256=`caf99ae1ab22fdee656f602388a3e322ea24ac63310e25975ce959639d8bc9d5`
- `sdk-php/tests/RawIngestTest.php` sha256=`c41a30e2f1b7285c1490b60e8f79d61defcf3650ea0a81d833e90a20097f10e3`

## Unified diff (base -> current)

```diff
--- /home/coder/project/docs/plans/evidence/sdk-review/source/sdk-go/raw_ingest.go	2026-10-16 02:36:10.431739034 +0200
+++ sdk-go/raw_ingest.go	2026-10-16 02:45:54.103781882 +0200
@@ -57,17 +57,57 @@
 
 // RawIngestResult is the POST /api/v1/raw acceptance body. The route always
 // answers 202 Accepted, so the HTTP status alone is not per-record success:
-// read Processed and Failed. A 202 with Failed > 0 is a partial failure.
+// read Processed and Failed. A 202 with Failed > 0 is a partial failure. A body
+// that is not an object carrying a boolean success and non-negative integer
+// Processed and Failed is rejected rather than defaulted.
 type RawIngestResult struct {
 	Success   bool `json:"success"`
 	Processed int  `json:"processed"`
 	Failed    int  `json:"failed"`
 }
 
+// RawAcceptanceUnknownError reports that a raw upload's acceptance could not be
+// determined: the connection failed before a response arrived, the 202
+// acceptance body was missing or malformed, or the response carried a status
+// that does not prove rejection. The request may or may not have landed, so the
+// SDK does not retry it and does not recommend replaying the POST; there is no
+// verified occurrence identity, and a resubmission could double-land accepted
+// records. Match with errors.As. The wrapped cause never carries the request
+// payload or a token.
+type RawAcceptanceUnknownError struct {
+	Message string
+	Cause   error
+}
+
+// Error renders the unknown-acceptance failure and, when present, its
+// non-secret cause.
+func (e *RawAcceptanceUnknownError) Error() string {
+	if e.Cause != nil {
+		return e.Message + ": " + e.Cause.Error()
+	}
+	return e.Message
+}
+
+// Unwrap exposes the non-secret cause for errors.Is/As; it never carries the
+// request payload or a token.
+func (e *RawAcceptanceUnknownError) Unwrap() error { return e.Cause }
+
+func newRawAcceptanceUnknownError(cause error) *RawAcceptanceUnknownError {
+	return &RawAcceptanceUnknownError{
+		Message: "custd: raw upload acceptance is unknown; the request may or may not have landed and must not be replayed",
+		Cause:   cause,
+	}
+}
+
 // IngestRawLines uploads raw line-delimited content for the bound parser. When
 // a SourceTarget is supplied it appends the PAIRED subClient/resource query
 // parameters to the existing raw endpoint; the parser-identifier header binding
 // is otherwise unchanged.
+//
+// A transport failure or an unusable 202 body cannot prove whether the upload
+// landed, so they surface as a *RawAcceptanceUnknownError rather than a
+// retryable error: replaying the POST could double-land accepted records. The
+// SDK never retries this operation automatically.
 func (c *CustdClient) IngestRawLines(
 	ctx context.Context, req RawIngestRequest,
 ) (*RawIngestResult, error) {
@@ -84,12 +124,12 @@
 			Method: http.MethodPost, URL: c.rawEndpoint(path), Headers: headers, Body: []byte(req.Content),
 		})
 		if err != nil {
-			return nil, newRetryableTransportError(err)
+			return nil, newRawAcceptanceUnknownError(err)
 		}
-		if err := c.checkStatus(resp.StatusCode, resp.Body); err != nil {
+		if err := c.checkRawStatus(resp.StatusCode, resp.Body); err != nil {
 			return nil, err
 		}
-		return decodeRawIngestResult(resp.Body)
+		return rawIngestResultFromBody(resp.Body)
 	}
 
 	httpReq, err := http.NewRequestWithContext(
@@ -103,16 +143,40 @@
 	}
 	resp, err := c.httpClient.Do(httpReq)
 	if err != nil {
-		return nil, newRetryableTransportError(err)
+		return nil, newRawAcceptanceUnknownError(err)
 	}
 	body, bodyErr := readResponseBody(resp.Body)
 	if bodyErr != nil {
-		return nil, fmt.Errorf("custd: read raw ingest response: %w", bodyErr)
+		return nil, newRawAcceptanceUnknownError(bodyErr)
 	}
-	if err := c.checkStatus(resp.StatusCode, body); err != nil {
+	if err := c.checkRawStatus(resp.StatusCode, body); err != nil {
 		return nil, err
 	}
-	return decodeRawIngestResult(body)
+	return rawIngestResultFromBody(body)
+}
+
+// checkRawStatus classifies a raw response status. A status in the retryable
+// set does not prove the upload was rejected, so it surfaces as an
+// unknown-acceptance error rather than a retry hint; a non-retryable status
+// (a 4xx rejected before processing) keeps the shared problem error.
+func (c *CustdClient) checkRawStatus(statusCode int, body []byte) error {
+	if statusCode >= 200 && statusCode < 300 {
+		return nil
+	}
+	if isRetryableStatus(statusCode, c.retrySet) {
+		return newRawAcceptanceUnknownError(fmt.Errorf("custd: raw upload returned status %d", statusCode))
+	}
+	return c.checkStatus(statusCode, body)
+}
+
+// rawIngestResultFromBody decodes the acceptance body and, when it is empty or
+// malformed, reports an unknown acceptance rather than an implied success.
+func rawIngestResultFromBody(body []byte) (*RawIngestResult, error) {
+	result, err := decodeRawIngestResult(body)
+	if err != nil {
+		return nil, newRawAcceptanceUnknownError(err)
+	}
+	return result, nil
 }
 
 // rawIngestPath validates the client-supplied inputs and builds the request
@@ -145,17 +209,68 @@
 	return strings.TrimRight(c.config.BaseURL, "/") + path
 }
 
-// decodeRawIngestResult decodes the acceptance body. The 202 status is checked
-// before this by checkStatus; the body is what distinguishes accepted lines
-// from refused ones, so an empty or malformed body is an error rather than an
-// implied success.
+// decodeRawIngestResult decodes the acceptance body strictly. The 202 status is
+// checked before this; the body is what distinguishes accepted lines from
+// refused ones, so an empty, null, or non-object body and a missing, null, or
+// wrongly typed `success`/`processed`/`failed` are all errors rather than
+// defaults. `processed` and `failed` must be non-negative integers; the
+// legitimate partial counts the route emits are accepted unchanged.
 func decodeRawIngestResult(data []byte) (*RawIngestResult, error) {
-	if len(data) == 0 {
-		return nil, fmt.Errorf("custd: raw ingest response body is empty")
+	const context = "raw ingest response"
+	fields, err := decodeJSONObject(data, context)
+	if err != nil {
+		return nil, err
+	}
+	success, err := requireJSONBoolean(fields, context, "success")
+	if err != nil {
+		return nil, err
+	}
+	processed, err := requireJSONNonNegativeInteger(fields, context, "processed")
+	if err != nil {
+		return nil, err
 	}
-	var result RawIngestResult
-	if err := json.Unmarshal(data, &result); err != nil {
-		return nil, fmt.Errorf("custd: decode raw ingest response: %w", err)
+	failed, err := requireJSONNonNegativeInteger(fields, context, "failed")
+	if err != nil {
+		return nil, err
+	}
+	return &RawIngestResult{Success: success, Processed: processed, Failed: failed}, nil
+}
+
+// requireJSONBoolean decodes a required boolean field. A missing or null field,
+// or a present number/string, is rejected rather than coerced.
+func requireJSONBoolean(fields map[string]json.RawMessage, context, name string) (bool, error) {
+	raw, ok := fields[name]
+	if !ok || string(raw) == "null" {
+		return false, validationErrorf("custd: %s field %s is required", context, name)
+	}
+	var value bool
+	if err := json.Unmarshal(raw, &value); err != nil {
+		return false, validationWrap(fmt.Sprintf("custd: %s field %s must be a boolean", context, name), err)
+	}
+	return value, nil
+}
+
+// requireJSONNonNegativeInteger decodes a required non-negative integer field.
+// A missing or null field, a fractional or non-numeric value, and a negative
+// number are all rejected; no default is substituted for an omitted count.
+func requireJSONNonNegativeInteger(fields map[string]json.RawMessage, context, name string) (int, error) {
+	raw, ok := fields[name]
+	if !ok || string(raw) == "null" {
+		return 0, validationErrorf("custd: %s field %s is required", context, name)
+	}
+	// json.Number accepts a quoted numeric string, so require an actual JSON
+	// number token before decoding; a string, boolean, or array is rejected.
+	trimmed := strings.TrimSpace(string(raw))
+	if trimmed == "" || (trimmed[0] != '-' && (trimmed[0] < '0' || trimmed[0] > '9')) {
+		return 0, validationErrorf("custd: %s field %s must be an integer", context, name)
+	}
+	var number json.Number
+	if err := json.Unmarshal(raw, &number); err != nil {
+		return 0, validationWrap(fmt.Sprintf("custd: %s field %s must be an integer", context, name), err)
+	}
+	value, err := number.Int64()
+	if err != nil || value < 0 {
+		return 0, validationErrorf("custd: %s field %s must be a non-negative integer", context, name)
 	}
-	return &result, nil
+	return int(value), nil
 }
--- /home/coder/project/docs/plans/evidence/sdk-review/source/sdk-go/raw_ingest_test.go	2026-10-16 02:36:10.432003912 +0200
+++ sdk-go/raw_ingest_test.go	2026-10-16 02:45:43.672922768 +0200
@@ -2,6 +2,7 @@
 
 import (
 	"context"
+	"errors"
 	"net/http"
 	"net/url"
 	"strings"
@@ -92,3 +93,86 @@
 		})
 	}
 }
+
+// rawAcceptanceUnknown asserts the error is the typed unknown-acceptance error.
+func rawAcceptanceUnknown(t *testing.T, err error) {
+	t.Helper()
+	var unknown *RawAcceptanceUnknownError
+	if !errors.As(err, &unknown) {
+		t.Fatalf("err = %v, want *RawAcceptanceUnknownError", err)
+	}
+}
+
+func TestIngestRawLinesRejectsMalformedAcceptanceBodies(t *testing.T) {
+	cases := map[string]string{
+		"empty body":           ``,
+		"top-level null":       `null`,
+		"empty object":         `{}`,
+		"missing failed":       `{"success":true,"processed":2}`,
+		"missing processed":    `{"success":true,"failed":0}`,
+		"missing success":      `{"processed":2,"failed":0}`,
+		"null failed":          `{"success":true,"processed":2,"failed":null}`,
+		"wrong success type":   `{"success":"yes","processed":2,"failed":0}`,
+		"wrong processed type": `{"success":true,"processed":"2","failed":0}`,
+		"negative processed":   `{"success":true,"processed":-1,"failed":0}`,
+		"negative failed":      `{"success":true,"processed":2,"failed":-1}`,
+		"fractional processed": `{"success":true,"processed":2.5,"failed":0}`,
+	}
+	for name, body := range cases {
+		t.Run(name, func(t *testing.T) {
+			doer := newCaptureDoer(http.StatusAccepted, body)
+			client := newAdminTestClient(t, doer, "http://localhost:8080")
+			_, err := client.IngestRawLines(context.Background(), RawIngestRequest{
+				Content: "x\n", ParserUUID: "11111111-1111-1111-1111-111111111111",
+			})
+			rawAcceptanceUnknown(t, err)
+		})
+	}
+}
+
+func TestIngestRawLinesPreservesLegitimatePartialCounts(t *testing.T) {
+	doer := newCaptureDoer(http.StatusAccepted, `{"success":true,"processed":3,"failed":1}`)
+	client := newAdminTestClient(t, doer, "http://localhost:8080")
+	result, err := client.IngestRawLines(context.Background(), RawIngestRequest{
+		Content: "x\n", ParserUUID: "11111111-1111-1111-1111-111111111111",
+	})
+	if err != nil {
+		t.Fatal(err)
+	}
+	if !result.Success || result.Processed != 3 || result.Failed != 1 {
+		t.Fatalf("result = %+v", result)
+	}
+}
+
+func TestIngestRawLinesClassifiesTransportFailureAsUnknownAcceptance(t *testing.T) {
+	client := newAdminTestClient(t, &captureDoer{}, "http://localhost:8080")
+	client.config.HTTPClient = failingDoer{}
+	_, err := client.IngestRawLines(context.Background(), RawIngestRequest{
+		Content: "x\n", ParserUUID: "11111111-1111-1111-1111-111111111111",
+	})
+	rawAcceptanceUnknown(t, err)
+}
+
+func TestIngestRawLinesClassifiesRetryableStatusAsUnknownAcceptance(t *testing.T) {
+	doer := newCaptureDoer(http.StatusServiceUnavailable, `{"title":"unavailable","status":503}`)
+	client := newAdminTestClient(t, doer, "http://localhost:8080")
+	_, err := client.IngestRawLines(context.Background(), RawIngestRequest{
+		Content: "x\n", ParserUUID: "11111111-1111-1111-1111-111111111111",
+	})
+	rawAcceptanceUnknown(t, err)
+}
+
+func TestIngestRawLinesKeepsNonRetryableStatusAsADefiniteRejection(t *testing.T) {
+	doer := newCaptureDoer(http.StatusBadRequest, `{"title":"invalid","status":400}`)
+	client := newAdminTestClient(t, doer, "http://localhost:8080")
+	_, err := client.IngestRawLines(context.Background(), RawIngestRequest{
+		Content: "x\n", ParserUUID: "11111111-1111-1111-1111-111111111111",
+	})
+	if err == nil {
+		t.Fatal("expected an error")
+	}
+	var unknown *RawAcceptanceUnknownError
+	if errors.As(err, &unknown) {
+		t.Fatalf("400 must stay a definite rejection, got %v", err)
+	}
+}
--- /home/coder/project/docs/plans/evidence/sdk-review/source/sdk-js/src/index.ts	2026-10-16 02:36:10.479273100 +0200
+++ sdk-js/src/index.ts	2026-10-16 02:46:40.670617313 +0200
@@ -592,6 +592,28 @@
   }
 }
 
+/**
+ * CustdRawAcceptanceUnknownError reports that a raw upload's acceptance could
+ * not be determined: the connection failed before a response arrived, the 202
+ * acceptance body was missing or malformed, or the response carried a status
+ * that does not prove rejection. The request may or may not have landed, so
+ * this error carries no retry guidance (`retryability` "none", `nextAction`
+ * "escalate"): there is no verified occurrence identity, and replaying the POST
+ * could double-land accepted records. The cause never carries the request
+ * payload or a token.
+ */
+export class CustdRawAcceptanceUnknownError extends Error {
+  readonly name = "CustdRawAcceptanceUnknownError";
+  readonly retryability = "none" as const;
+  readonly nextAction = { action: "escalate" as const };
+  readonly cause?: unknown;
+
+  constructor(options?: { cause?: unknown }) {
+    super("custd: raw upload acceptance is unknown; the request may or may not have landed and must not be replayed");
+    this.cause = options?.cause;
+  }
+}
+
 export type PreparedDataState = "accepted" | "processing" | "ready" | "failed";
 export type PreparedDataAvailability = "complete" | "partial" | "stale" | "unavailable";
 export type PreparedDataNextAction = "none" | "poll" | "retry" | "rotate" | "escalate";
@@ -1819,6 +1841,12 @@
    *
    * The route answers 202 Accepted, so the status alone is not success. Read
    * `processed` and `failed` on the returned result.
+   *
+   * A transport failure or an unusable acceptance body cannot prove whether the
+   * upload landed, so it throws {@link CustdRawAcceptanceUnknownError} — which
+   * carries no retry guidance — rather than a retryable transport error.
+   * Replaying the POST could double-land accepted records; the SDK never retries
+   * this operation automatically.
    */
   async ingestRawLines(request: RawIngestRequest, options?: RequestOptions): Promise<RawIngestResult> {
     const parserUuid = assertRawParserUuid(request.parserUuid);
@@ -1844,12 +1872,22 @@
         signal: options?.signal,
       });
     } catch (error) {
-      throw transportRequestError(error);
+      // A disconnect cannot prove whether the upload landed; offer no retry.
+      throw new CustdRawAcceptanceUnknownError({ cause: error });
     }
     if (!response.ok) {
+      if (this.retry.retryOnStatuses.includes(response.status)) {
+        throw new CustdRawAcceptanceUnknownError();
+      }
       throw await problemError(response, `custd: raw ingest failed with status ${response.status}`);
     }
-    return (await response.json()) as RawIngestResult;
+    let value: unknown;
+    try {
+      value = await response.json();
+    } catch (error) {
+      throw new CustdRawAcceptanceUnknownError({ cause: error });
+    }
+    return validateRawIngestResult(value);
   }
 
   private async sendWithRetry(event: EventEnvelope): Promise<Response> {
@@ -3312,6 +3350,32 @@
   }
 }
 
+// validateRawIngestResult requires an actual object carrying a boolean success
+// and non-negative integer processed and failed. A missing field, a null, a
+// wrong type, or a negative count is rejected rather than defaulted or coerced.
+// Legitimate partial counts are returned unchanged.
+function validateRawIngestResult(value: unknown): RawIngestResult {
+  if (typeof value !== "object" || value === null || Array.isArray(value)) {
+    throw new CustdRawAcceptanceUnknownError();
+  }
+  const record = value as Record<string, unknown>;
+  if (typeof record.success !== "boolean") {
+    throw new CustdRawAcceptanceUnknownError();
+  }
+  return {
+    success: record.success,
+    processed: requireNonNegativeInteger(record.processed),
+    failed: requireNonNegativeInteger(record.failed),
+  };
+}
+
+function requireNonNegativeInteger(value: unknown): number {
+  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
+    throw new CustdRawAcceptanceUnknownError();
+  }
+  return value;
+}
+
 export class RetryableError extends Error {}
 
 function transportRequestError(error: unknown): Error {
--- /home/coder/project/docs/plans/evidence/sdk-review/source/sdk-js/src/raw-ingest.test.ts	2026-10-16 02:36:10.497653241 +0200
+++ sdk-js/src/raw-ingest.test.ts	2026-10-16 02:46:40.566608746 +0200
@@ -1,5 +1,5 @@
 import { describe, expect, it, vi } from "vitest";
-import { CustdClient } from "./index";
+import { CustdClient, CustdRawAcceptanceUnknownError } from "./index";
 
 const PARSER_UUID = "11111111-1111-1111-1111-111111111111";
 
@@ -66,3 +66,59 @@
     }
   });
 });
+
+describe("raw line ingest acceptance", () => {
+  const request = { content: "line\n", parserUuid: PARSER_UUID };
+
+  it("rejects malformed acceptance bodies as unknown acceptance", async () => {
+    const bodies: Record<string, unknown> = {
+      null: null,
+      "empty object": {},
+      "missing failed": { success: true, processed: 2 },
+      "missing processed": { success: true, failed: 0 },
+      "missing success": { processed: 2, failed: 0 },
+      "null failed": { success: true, processed: 2, failed: null },
+      "wrong success type": { success: "yes", processed: 2, failed: 0 },
+      "wrong processed type": { success: true, processed: "2", failed: 0 },
+      "negative processed": { success: true, processed: -1, failed: 0 },
+      "negative failed": { success: true, processed: 2, failed: -1 },
+      "fractional processed": { success: true, processed: 2.5, failed: 0 },
+    };
+    for (const [name, body] of Object.entries(bodies)) {
+      const fetchImpl = mockFetch(body);
+      await expect(client(fetchImpl).ingestRawLines(request), name).rejects.toBeInstanceOf(
+        CustdRawAcceptanceUnknownError,
+      );
+    }
+  });
+
+  it("preserves legitimate partial counts", async () => {
+    const fetchImpl = mockFetch({ success: true, processed: 3, failed: 1 });
+    const result = await client(fetchImpl).ingestRawLines(request);
+    expect(result).toEqual({ success: true, processed: 3, failed: 1 });
+  });
+
+  it("classifies a transport failure as unknown acceptance with no retry guidance", async () => {
+    const fetchImpl = vi.fn().mockRejectedValue(new TypeError("connection reset"));
+    const error = await client(fetchImpl)
+      .ingestRawLines(request)
+      .catch((thrown: unknown) => thrown);
+    expect(error).toBeInstanceOf(CustdRawAcceptanceUnknownError);
+    const typed = error as CustdRawAcceptanceUnknownError;
+    expect(typed.retryability).toBe("none");
+    expect(typed.nextAction.action).not.toBe("retry");
+  });
+
+  it("classifies a retryable status as unknown acceptance", async () => {
+    const fetchImpl = mockFetch({ title: "unavailable", status: 503 }, 503);
+    await expect(client(fetchImpl).ingestRawLines(request)).rejects.toBeInstanceOf(CustdRawAcceptanceUnknownError);
+  });
+
+  it("keeps a non-retryable status a definite rejection", async () => {
+    const fetchImpl = mockFetch({ title: "invalid", status: 400 }, 400);
+    const error = await client(fetchImpl)
+      .ingestRawLines(request)
+      .catch((thrown: unknown) => thrown);
+    expect(error).not.toBeInstanceOf(CustdRawAcceptanceUnknownError);
+  });
+});
--- /home/coder/project/docs/plans/evidence/sdk-review/source/sdk-python/src/custd/client.py	2026-10-16 02:36:10.568774103 +0200
+++ sdk-python/src/custd/client.py	2026-10-16 02:46:56.271902317 +0200
@@ -107,7 +107,28 @@
 
 
 def _decode_raw_ingest_result(body: object) -> RawIngestResult:
-    """Decode the acceptance body; an empty or non-object body is an error."""
+    """Decode the acceptance body strictly.
+
+    A successful response must be an object carrying a boolean ``success`` and
+    non-negative integer ``processed`` and ``failed``. An empty, null,
+    non-object, or incomplete body, a wrong type, and a negative or fractional
+    count all raise :class:`RawAcceptanceUnknownError` rather than defaulting or
+    coercing a missing count; legitimate partial counts are returned unchanged.
+    """
+    try:
+        decoded = _raw_response_object(body)
+        return RawIngestResult(
+            success=_raw_response_bool(decoded, "success"),
+            processed=_raw_response_non_negative_int(decoded, "processed"),
+            failed=_raw_response_non_negative_int(decoded, "failed"),
+        )
+    except RawAcceptanceUnknownError:
+        raise
+    except (ValueError, TypeError) as error:
+        raise RawAcceptanceUnknownError() from error
+
+
+def _raw_response_object(body: object) -> dict[str, Any]:
     if isinstance(body, str):
         decoded: object = json.loads(body) if body != "" else None
     elif isinstance(body, (bytes, bytearray)):
@@ -117,8 +138,23 @@
     else:
         decoded = None
     if not isinstance(decoded, dict):
-        raise RequestError("custd: raw ingest response body must be a JSON object")
-    return cast(RawIngestResult, decoded)
+        raise RawAcceptanceUnknownError()
+    return decoded
+
+
+def _raw_response_bool(payload: dict[str, Any], key: str) -> bool:
+    value = payload.get(key)
+    if not isinstance(value, bool):
+        raise RawAcceptanceUnknownError()
+    return value
+
+
+def _raw_response_non_negative_int(payload: dict[str, Any], key: str) -> int:
+    value = payload.get(key)
+    # bool is an int subclass; exclude it so a boolean is not read as a count.
+    if isinstance(value, bool) or not isinstance(value, int) or value < 0:
+        raise RawAcceptanceUnknownError()
+    return value
 
 
 class AdminRequestOptions(TypedDict, total=False):
@@ -301,6 +337,32 @@
         return self.status is None or self.status == 429 or self.status >= 500
 
 
+class RawAcceptanceUnknownError(RequestError):
+    """A raw upload's acceptance could not be determined.
+
+    Raised when the connection failed before a response arrived, the 202 body
+    was missing or malformed, or the response carried a status that does not
+    prove rejection. The request may or may not have landed, so this error is
+    non-retryable and recommends no replay: there is no verified occurrence
+    identity, and resubmitting could double-land accepted records. Its cause
+    carries no request payload or token.
+    """
+
+    def __init__(self) -> None:
+        super().__init__(
+            "custd: raw upload acceptance is unknown; the request may or may not have landed "
+            "and must not be replayed",
+            code="raw_acceptance_unknown",
+            retryability="none",
+            next_action={"action": "escalate"},
+        )
+
+    @property
+    def unavailable(self) -> bool:
+        # Not a retryable unavailability: acceptance is unknown, not absent.
+        return False
+
+
 def admin_request_error(status: int, body: object) -> RequestError:
     decoded: object = body
     if isinstance(body, str):
@@ -531,15 +593,27 @@
         ``target`` is supplied its paired subClient/resource codes are appended
         as query parameters. The route answers 202 Accepted, so read
         ``processed``/``failed`` on the result rather than the status.
+
+        A transport failure or an unusable 202 body cannot prove whether the
+        upload landed, so it raises :class:`RawAcceptanceUnknownError` (which
+        carries no retry guidance) rather than a retryable error: replaying the
+        POST could double-land accepted records, and this method never retries
+        automatically.
         """
         url, body = _raw_ingest_url_and_body(self.base_url, request)
         headers = self._headers()
         headers["Content-Type"] = "text/plain; charset=utf-8"
         headers["X-Parser-UUID"] = request["parserUuid"]
-        result = self.transport(url, body, headers, self.timeout)
+        try:
+            result = self.transport(url, body, headers, self.timeout)
+        except RawAcceptanceUnknownError:
+            raise
+        except Exception as error:
+            # A disconnect cannot prove whether the upload landed; offer no retry.
+            raise RawAcceptanceUnknownError() from error
         status = int(result["status"])
         if status in self.retry["retry_statuses"]:
-            raise RetryableError(f"custd: retryable status {status}")
+            raise RawAcceptanceUnknownError()
         if status >= 400:
             raise RequestError(problem_error_message(status, result.get("body")))
         return _decode_raw_ingest_result(result.get("body"))
--- /home/coder/project/docs/plans/evidence/sdk-review/source/sdk-python/src/custd/__init__.py	2026-10-16 02:36:10.556427343 +0200
+++ sdk-python/src/custd/__init__.py	2026-10-16 02:47:00.277232219 +0200
@@ -6,6 +6,7 @@
     MemoryQueueStorage,
     QueueFullError,
     QueueStorageError,
+    RawAcceptanceUnknownError,
     RawIngestRequest,
     RawIngestResult,
     RawSourceTarget,
@@ -33,6 +34,7 @@
     "MemoryQueueStorage",
     "QueueFullError",
     "QueueStorageError",
+    "RawAcceptanceUnknownError",
     "RawIngestRequest",
     "RawIngestResult",
     "RawSourceTarget",
--- /home/coder/project/docs/plans/evidence/sdk-review/source/sdk-python/tests/test_raw_ingest.py	2026-10-16 02:36:10.586375070 +0200
+++ sdk-python/tests/test_raw_ingest.py	2026-10-16 02:47:18.173705790 +0200
@@ -9,10 +9,12 @@
 
 PARSER_UUID = "11111111-1111-1111-1111-111111111111"
 
+_UNSET = object()
+
 
 class RecordingTransport:
-    def __init__(self, body=None, status=202):
-        self.body = body if body is not None else {"success": True, "processed": 0, "failed": 0}
+    def __init__(self, body=_UNSET, status=202):
+        self.body = {"success": True, "processed": 0, "failed": 0} if body is _UNSET else body
         self.status = status
         self.calls = []
 
@@ -82,3 +84,65 @@
 
 if __name__ == "__main__":
     unittest.main()
+
+
+class FailingTransport:
+    def __init__(self, error=None):
+        self.error = error or RuntimeError("connection reset")
+
+    def __call__(self, url, event, headers, timeout):
+        raise self.error
+
+
+class RawAcceptanceTest(unittest.TestCase):
+    def test_rejects_malformed_acceptance_bodies(self) -> None:
+        from custd import RawAcceptanceUnknownError
+
+        bodies = {
+            "null": None,
+            "empty object": {},
+            "missing failed": {"success": True, "processed": 2},
+            "missing processed": {"success": True, "failed": 0},
+            "missing success": {"processed": 2, "failed": 0},
+            "null failed": {"success": True, "processed": 2, "failed": None},
+            "wrong success type": {"success": "yes", "processed": 2, "failed": 0},
+            "wrong processed type": {"success": True, "processed": "2", "failed": 0},
+            "boolean processed": {"success": True, "processed": True, "failed": 0},
+            "negative processed": {"success": True, "processed": -1, "failed": 0},
+            "negative failed": {"success": True, "processed": 2, "failed": -1},
+            "fractional processed": {"success": True, "processed": 2.5, "failed": 0},
+        }
+        for name, body in bodies.items():
+            with self.subTest(name=name):
+                transport = RecordingTransport(body)
+                with self.assertRaises(RawAcceptanceUnknownError):
+                    make_client(transport).ingest_raw_lines({"content": "x", "parserUuid": PARSER_UUID})
+
+    def test_preserves_legitimate_partial_counts(self) -> None:
+        transport = RecordingTransport({"success": True, "processed": 3, "failed": 1})
+        result = make_client(transport).ingest_raw_lines({"content": "x", "parserUuid": PARSER_UUID})
+        self.assertEqual(result, {"success": True, "processed": 3, "failed": 1})
+
+    def test_classifies_a_transport_failure_as_unknown_acceptance(self) -> None:
+        from custd import RawAcceptanceUnknownError
+
+        with self.assertRaises(RawAcceptanceUnknownError) as raised:
+            make_client(FailingTransport()).ingest_raw_lines({"content": "x", "parserUuid": PARSER_UUID})
+        self.assertEqual(raised.exception.retryability, "none")
+        self.assertFalse(raised.exception.unavailable)
+        self.assertNotEqual(raised.exception.next_action, {"action": "retry"})
+
+    def test_classifies_a_retryable_status_as_unknown_acceptance(self) -> None:
+        from custd import RawAcceptanceUnknownError
+
+        transport = RecordingTransport({"title": "unavailable"}, status=503)
+        with self.assertRaises(RawAcceptanceUnknownError):
+            make_client(transport).ingest_raw_lines({"content": "x", "parserUuid": PARSER_UUID})
+
+    def test_keeps_a_non_retryable_status_a_definite_rejection(self) -> None:
+        from custd import RawAcceptanceUnknownError, RequestError
+
+        transport = RecordingTransport({"title": "invalid"}, status=400)
+        with self.assertRaises(RequestError) as raised:
+            make_client(transport).ingest_raw_lines({"content": "x", "parserUuid": PARSER_UUID})
+        self.assertNotIsInstance(raised.exception, RawAcceptanceUnknownError)
--- /home/coder/project/docs/plans/evidence/sdk-review/source/sdk-php/src/CustdClient.php	2026-10-16 02:36:10.538332910 +0200
+++ sdk-php/src/CustdClient.php	2026-10-16 03:00:36.159424561 +0200
@@ -78,13 +78,20 @@
      *       follow-up and is intentionally not implemented here.
      *     - `queue`: array{enabled?:bool, store?:QueueStore, max_size?:int}
      *     - `http_client`: callable|null Custom HTTP transport. When provided,
-     *       it receives `(string $url, array $payload, string $token)` and MUST
-     *       return `array{status:int, body:string}`. The status is translated
-     *       the same way as the built-in curl path: a status in
+     *       it receives `(string $url, array|string $payload, string $token)`
+     *       and MAY accept a fourth `array<string, string> $headers` argument.
+     *       It MUST return `array{status:int, body:string}`. The status is
+     *       translated the same way as the built-in curl path: a status in
      *       `retry["retry_statuses"]` raises {@see RetryableException}, any
      *       other `>= 400` raises a `\RuntimeException`. The callable MAY
      *       throw `RetryableException` directly to force a retry without a
-     *       status code (e.g. transport error).
+     *       status code (e.g. transport error). On a raw line upload
+     *       ({@see ingestRawLines}) a thrown `RetryableException` is surfaced
+     *       as {@see RawAcceptanceUnknownException} (no replay); the non-raw
+     *       paths keep the retry semantics. Raw line uploads send a raw string
+     *       payload and pass the request headers (including `X-Parser-UUID`
+     *       and the raw content type) as that fourth argument; a callback that
+     *       declares only three parameters cannot observe the parser binding.
      *     - `admin_http_client`: callable|null Custom admin HTTP transport.
      *       When provided, it receives
      *       `(string $method, string $url, ?array $body, string $token, array<string, string> $headers)`
@@ -271,18 +278,34 @@
      * request carries a target, its paired subClient/resource codes are appended
      * as query parameters. The route answers 202 Accepted, so read `processed`
      * and `failed` on the result rather than the status.
+     *
+     * A local validation failure (a malformed parser UUID, or a partial or
+     * malformed target) throws before any request is sent, so nothing landed. A
+     * transport failure, an unusable 202 body, or a retryable status raises
+     * {@see RawAcceptanceUnknownException}: whether the upload landed is unknown,
+     * so it is non-retryable and must not be replayed.
      */
     public function ingestRawLines(RawIngest\RawIngestRequest $request): RawIngest\RawIngestResult
     {
         $url = $this->baseUrl . "/api/v1/raw" . $request->queryString();
         $result = $this->sendRawRequest($url, $request->content, $request->parserUuid);
-        if ($result["body"] === "") {
-            throw new \UnexpectedValueException("custd: raw ingest response body is empty");
+        try {
+            if ($result["body"] === "") {
+                throw new \UnexpectedValueException("custd: raw ingest response body is empty");
+            }
+
+            return RawIngest\RawIngestResult::fromPayload(
+                json_decode($result["body"], false, flags: JSON_THROW_ON_ERROR)
+            );
+        } catch (\UnexpectedValueException | \JsonException $error) {
+            // The 202 arrived but its body cannot be read, so acceptance is unknown.
+            throw new RawAcceptanceUnknownException(
+                "custd: raw upload acceptance is unknown; the request may or may not have landed "
+                . "and must not be replayed",
+                0,
+                $error,
+            );
         }
-
-        return RawIngest\RawIngestResult::fromPayload(
-            json_decode($result["body"], false, flags: JSON_THROW_ON_ERROR)
-        );
     }
 
     /**
@@ -293,41 +316,86 @@
      */
     private function sendRawRequest(string $url, string $content, string $parserUuid): array
     {
+        $headers = [
+            "Content-Type" => "text/plain; charset=utf-8",
+            "Authorization" => "Bearer " . $this->authToken(),
+            "X-Custd-Sdk" => $this->product . "/" . self::VERSION,
+            "X-Parser-UUID" => $parserUuid,
+        ];
+
         if (is_callable($this->httpClient)) {
             $client = $this->httpClient;
-            $result = $this->normalizeHttpClientResult($client($url, $content, $this->authToken()));
-            $this->translateStatus($result["status"], $result["body"]);
+            // The documented callback MAY declare a fourth parameter to receive
+            // the request headers (name => value). The parser binding and the
+            // raw content type are only transmittable through it.
+            try {
+                // The callback's documented transport-failure signal is
+                // RetryableException, thrown after a submit that may already
+                // have landed. A raw upload must not be replayed, so map that
+                // one documented signal to the no-replay unknown-acceptance
+                // error (preserving the cause); any other exception, including
+                // a programming error, propagates unchanged.
+                $result = $this->normalizeHttpClientResult($client($url, $content, $this->authToken(), $headers));
+            } catch (RetryableException $error) {
+                throw new RawAcceptanceUnknownException(
+                    "custd: raw upload acceptance is unknown; the request may or may not have landed "
+                    . "and must not be replayed",
+                    0,
+                    $error,
+                );
+            }
+            $this->translateRawStatus($result["status"], $result["body"]);
 
             return $result;
         }
 
-        $headers = [
-            "Content-Type: text/plain; charset=utf-8",
-            "Authorization: Bearer " . $this->authToken(),
-            "X-Custd-Sdk: " . $this->product . "/" . self::VERSION,
-            "X-Parser-UUID: " . $parserUuid,
-        ];
+        $curlHeaders = [];
+        foreach ($headers as $name => $value) {
+            $curlHeaders[] = $name . ": " . $value;
+        }
         $ch = curl_init($url);
         curl_setopt_array($ch, [
             CURLOPT_CUSTOMREQUEST => "POST",
             CURLOPT_RETURNTRANSFER => true,
-            CURLOPT_HTTPHEADER => $headers,
+            CURLOPT_HTTPHEADER => $curlHeaders,
             CURLOPT_POSTFIELDS => $content,
             CURLOPT_TIMEOUT => 15,
         ]);
         $response = curl_exec($ch);
         if ($response === false) {
-            $err = curl_error($ch);
-            throw new RetryableException("custd: request failed: {$err}");
+            // A transport failure cannot prove whether the upload landed.
+            throw new RawAcceptanceUnknownException(
+                "custd: raw upload acceptance is unknown; the request may or may not have landed "
+                . "and must not be replayed",
+                0,
+                new \RuntimeException(curl_error($ch)),
+            );
         }
         $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
         $responseBody = is_string($response) ? $response : "";
-        $this->translateStatus($status, $responseBody);
+        $this->translateRawStatus($status, $responseBody);
 
         return ["status" => $status, "body" => $responseBody];
     }
 
     /**
+     * translateRawStatus classifies a raw response status. A retryable status
+     * does not prove the upload was rejected, so it surfaces as an unknown
+     * acceptance rather than a retryable error; a non-retryable status keeps the
+     * shared problem error.
+     */
+    private function translateRawStatus(int $status, string $body): void
+    {
+        if (in_array($status, $this->retryOptions["retry_statuses"], true)) {
+            throw new RawAcceptanceUnknownException(
+                "custd: raw upload acceptance is unknown; the request may or may not have landed "
+                . "and must not be replayed"
+            );
+        }
+        $this->translateStatus($status, $body);
+    }
+
+    /**
      * @param array<string, mixed> $event
      */
     public function track(array $event): void
--- /dev/null	2026-10-15 19:50:40.637349129 +0200
+++ sdk-php/src/RawAcceptanceUnknownException.php	2026-10-16 02:47:38.727398076 +0200
@@ -0,0 +1,18 @@
+<?php
+
+declare(strict_types=1);
+
+namespace HaakCo\Custd;
+
+/**
+ * RawAcceptanceUnknownException reports that a raw upload's acceptance could
+ * not be determined: the connection failed before a response arrived, the 202
+ * body was missing or malformed, or the response carried a status that does not
+ * prove rejection. The request may or may not have landed, so this exception is
+ * not retryable and recommends no replay: there is no verified occurrence
+ * identity, and resubmitting could double-land accepted records. Its message and
+ * previous exception never carry the request payload or a token.
+ */
+final class RawAcceptanceUnknownException extends \RuntimeException
+{
+}
--- /home/coder/project/docs/plans/evidence/sdk-review/source/sdk-php/src/RawIngest/RawIngestResult.php	2026-10-16 02:36:10.554816542 +0200
+++ sdk-php/src/RawIngest/RawIngestResult.php	2026-10-16 02:53:39.860135078 +0200
@@ -11,7 +11,8 @@
  *
  * The route always answers 202 Accepted, so the status alone is not per-record
  * success: read `processed` and `failed`. A 202 with `failed > 0` is a partial
- * failure.
+ * failure. Both counts must be non-negative integers; a negative count would
+ * otherwise conceal refused lines from a `failed > 0` check.
  */
 final readonly class RawIngestResult
 {
@@ -28,8 +29,27 @@
 
         return new self(
             Fields::boolean($object, 'success'),
-            Fields::integer($object, 'processed'),
-            Fields::integer($object, 'failed'),
+            self::nonNegativeInteger($object, 'processed'),
+            self::nonNegativeInteger($object, 'failed'),
         );
     }
+
+    /**
+     * nonNegativeInteger reuses the shared integer field decode and then rejects
+     * a negative count, which would otherwise conceal refused lines from a
+     * `failed > 0` check. A legitimate zero or positive partial count is kept.
+     *
+     * @param \stdClass $object
+     */
+    private static function nonNegativeInteger(\stdClass $object, string $key): int
+    {
+        $value = Fields::integer($object, $key);
+        if ($value < 0) {
+            throw new \UnexpectedValueException(
+                "custd: raw ingest response field {$key} must be a non-negative integer"
+            );
+        }
+
+        return $value;
+    }
 }
--- /home/coder/project/docs/plans/evidence/sdk-review/source/sdk-php/tests/RawIngestTest.php	2026-10-16 02:36:10.556099692 +0200
+++ sdk-php/tests/RawIngestTest.php	2026-10-16 03:00:41.625874882 +0200
@@ -5,8 +5,10 @@
 namespace HaakCo\Custd\Tests;
 
 use HaakCo\Custd\CustdClient;
+use HaakCo\Custd\RawAcceptanceUnknownException;
 use HaakCo\Custd\RawIngest\RawIngestRequest;
 use HaakCo\Custd\RawIngest\RawSourceTarget;
+use HaakCo\Custd\RetryableException;
 use PHPUnit\Framework\TestCase;
 
 final class RawIngestTest extends TestCase
@@ -22,6 +24,10 @@
 
         self::assertSame("http://localhost:8080/api/v1/raw", $calls[0]["url"]);
         self::assertSame("first line\nsecond line\n", $calls[0]["payload"]);
+        // The callback receives the request headers, so the parser binding and the
+        // raw content type are transmittable through a custom transport.
+        self::assertSame(self::PARSER_UUID, $calls[0]["headers"]["X-Parser-UUID"]);
+        self::assertSame("text/plain; charset=utf-8", $calls[0]["headers"]["Content-Type"]);
         // A 202 alone is not success: the body carries the per-record counts.
         self::assertTrue($result->success);
         self::assertSame(2, $result->processed);
@@ -64,16 +70,119 @@
         }
     }
 
+    public function testRejectsMalformedAcceptanceBodiesAsUnknownAcceptance(): void
+    {
+        $bodies = [
+            "null" => null,
+            "empty object" => [],
+            "missing failed" => ["success" => true, "processed" => 2],
+            "missing processed" => ["success" => true, "failed" => 0],
+            "missing success" => ["processed" => 2, "failed" => 0],
+            "wrong success type" => ["success" => "yes", "processed" => 2, "failed" => 0],
+            "wrong processed type" => ["success" => true, "processed" => "2", "failed" => 0],
+            "negative processed" => ["success" => true, "processed" => -1, "failed" => 0],
+            "negative failed" => ["success" => true, "processed" => 2, "failed" => -1],
+        ];
+        foreach ($bodies as $name => $body) {
+            $calls = [];
+            $client = $this->clientWithResponse($body, $calls);
+            $thrown = null;
+            try {
+                $client->ingestRawLines(new RawIngestRequest("x\n", self::PARSER_UUID));
+            } catch (\Throwable $error) {
+                $thrown = $error;
+            }
+            self::assertNotNull($thrown, "expected {$name} to be rejected");
+            // Exact ambiguous classification: typed unknown acceptance, not a retry.
+            self::assertNotInstanceOf(RetryableException::class, $thrown);
+            self::assertInstanceOf(RawAcceptanceUnknownException::class, $thrown);
+        }
+    }
+
+    public function testPreservesLegitimatePartialCounts(): void
+    {
+        $calls = [];
+        $client = $this->clientWithResponse(["success" => true, "processed" => 3, "failed" => 1], $calls);
+        $result = $client->ingestRawLines(new RawIngestRequest("x\n", self::PARSER_UUID));
+        self::assertSame(3, $result->processed);
+        self::assertSame(1, $result->failed);
+    }
+
+    public function testClassifiesARetryableStatusAsUnknownAcceptance(): void
+    {
+        $calls = [];
+        $client = $this->clientWithResponse(["title" => "unavailable"], $calls, 503);
+        $this->expectException(RawAcceptanceUnknownException::class);
+        $client->ingestRawLines(new RawIngestRequest("x\n", self::PARSER_UUID));
+    }
+
+    public function testKeepsANonRetryableStatusADefiniteRejection(): void
+    {
+        $calls = [];
+        $client = $this->clientWithResponse(["title" => "invalid"], $calls, 400);
+        try {
+            $client->ingestRawLines(new RawIngestRequest("x\n", self::PARSER_UUID));
+            self::fail("expected a rejection");
+        } catch (\RuntimeException $error) {
+            self::assertNotInstanceOf(RawAcceptanceUnknownException::class, $error);
+        }
+    }
+
+    public function testMapsACustomRawTransportRetryableThrowToUnknownAcceptance(): void
+    {
+        $invocations = 0;
+        $client = new CustdClient("http://localhost:8080", "token", [
+            "http_client" => function (
+                string $url,
+                mixed $payload,
+                string $token,
+                array $headers = []
+            ) use (&$invocations): array {
+                $invocations++;
+
+                // The documented transport-failure signal, thrown after submit.
+                throw new RetryableException("connection reset");
+            },
+        ]);
+
+        $thrown = null;
+        try {
+            $client->ingestRawLines(new RawIngestRequest("x\n", self::PARSER_UUID));
+        } catch (\Throwable $error) {
+            $thrown = $error;
+        }
+
+        // The callback is invoked exactly once: the raw upload is never replayed.
+        self::assertSame(1, $invocations);
+        self::assertNotNull($thrown);
+        // Exact ambiguous classification: unknown acceptance, not a retryable error.
+        self::assertNotInstanceOf(RetryableException::class, $thrown);
+        self::assertInstanceOf(RawAcceptanceUnknownException::class, $thrown);
+        // The original transport cause is preserved on the unknown-acceptance error.
+        self::assertInstanceOf(RetryableException::class, $thrown->getPrevious());
+    }
+
     /**
+     * clientWithResponse builds a client whose custom transport records each call
+     * including the fourth headers argument.
+     *
      * @param array<int, array<string, mixed>> $calls
      */
-    private function clientWithResponse(mixed $response, array &$calls): CustdClient
+    private function clientWithResponse(mixed $response, array &$calls, int $status = 202): CustdClient
     {
         return new CustdClient("http://localhost:8080", "token", [
-            "http_client" => function (string $url, mixed $payload, string $token) use (&$calls, $response): array {
-                $calls[] = compact("url", "payload", "token");
-
-                return ["status" => 202, "body" => json_encode($response, JSON_THROW_ON_ERROR)];
+            "http_client" => function (
+                string $url,
+                mixed $payload,
+                string $token,
+                array $headers = []
+            ) use (&$calls, $response, $status): array {
+                $calls[] = compact("url", "payload", "token", "headers");
+
+                return [
+                    "status" => $status,
+                    "body" => json_encode($response, JSON_THROW_ON_ERROR),
+                ];
             },
         ]);
     }
```

## Focused checks

| Interface | Command | Result |
| --- | --- | --- |
| Go | `cd sdk-go && go vet ./... && go test ./...` | valid and unchanged; not re-run for this PHP-only delta |
| JS | `pnpm -C sdk-js run typecheck && pnpm -C sdk-js run lint && pnpm -C sdk-js test && pnpm -C sdk-js run build` | valid and unchanged; not re-run for this PHP-only delta |
| Python | `cd sdk-python && ruff check && python3 -m mypy && python3 -m unittest discover -s tests` | valid and unchanged; not re-run for this PHP-only delta |
| PHP (affected) | `cd sdk-php && vendor/bin/phpunit --filter RawIngestTest && composer analyse && composer format-check` | **8 tests / 51 assertions OK**; phpstan no errors; pint passed |

Prior full-suite counts remain the last recorded green: Go package ok (189 runs), JS 298 tests, Python 170 tests, PHP 390 tests / 1410 assertions.

Raw-delta contract cases (existing test style):
- Go/JS/Python: `success`/`processed`/`failed` missing, null, wrong type, negative, or fractional, and a top-level `null` body, each raise the typed unknown-acceptance error; partial positive counts are returned unchanged; transport/disconnect and retryable status are unknown acceptance with no replay; a non-retryable status stays a definite rejection.
- PHP: the malformed-body table includes `processed: -1` and `failed: -1` (both raise `RawAcceptanceUnknownException`, asserted exactly that type and not `RetryableException`); the custom `http_client` callback receives the request headers (4th argument, asserted `X-Parser-UUID` + `text/plain; charset=utf-8`); and a **custom raw transport that throws the documented `RetryableException("connection reset")`** is mapped to `RawAcceptanceUnknownException` (asserted unknown, not retryable, cause preserved, callback invoked exactly once so the upload is never replayed).

## Behaviour removed / changed

- Go/JS/Python/PHP raw transport failures no longer use the shared retryable error path. On the PHP raw path, a custom-transport `RetryableException` (the documented transport-failure signal) is translated to `RawAcceptanceUnknownException`; the **shared non-raw custom-transport behaviour is unchanged** (still retryable).
- A negative `processed`/`failed` in the PHP raw acceptance body is now rejected (previously accepted and could conceal refusals from a `failed > 0` check).
- Local validation failures (malformed parser UUID; partial/malformed target) still throw before any request is sent — nothing landed. Only actual raw transport/submit failures map to unknown acceptance.
- No new REST client, parse workflow, header, or nonce was introduced. The backend occurrence-identity/deduplication protocol gap is unchanged and remains a parent integration item.
