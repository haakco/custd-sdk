// Streaming downloads: the body is handed to the caller as it arrives, with the response
// metadata the server sent, so a large export never has to fit in memory.

/** A download read as it arrives, with the response metadata the server sent. */
export type CustdDownloadStream = {
  /** The body. Reading it to the end checks any length the SDK knows; cancel it to stop early. */
  body: ReadableStream<Uint8Array>;
  /** The Content-Type header; empty when the server sent none. */
  contentType: string;
  /** The server's X-Request-Id, to quote when reporting a problem; empty when the server sent none. */
  requestId: string;
};

/**
 * Wraps a successful response as a stream. With `byteSize`, the body errors as soon as it runs past
 * that length or ends short of it, so a truncated download never reads as complete.
 */
export function responseDownloadStream(response: Response, operation: string, byteSize?: number): CustdDownloadStream {
  const body = response.body ?? new ReadableStream<Uint8Array>({ start: (controller) => controller.close() });
  return {
    body: byteSize === undefined ? body : lengthCheckedBody(body, byteSize, operation),
    contentType: response.headers.get("content-type") ?? "",
    requestId: response.headers.get("x-request-id") ?? "",
  };
}

function lengthCheckedBody(
  body: ReadableStream<Uint8Array>,
  byteSize: number,
  operation: string,
): ReadableStream<Uint8Array> {
  let received = 0;
  const mismatch = () => new Error(`custd: ${operation} content length mismatch`);
  return body.pipeThrough(
    new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        received += chunk.byteLength;
        if (received > byteSize) controller.error(mismatch());
        else controller.enqueue(chunk);
      },
      flush(controller) {
        if (received !== byteSize) controller.error(mismatch());
      },
    }),
  );
}

/** Reads a whole stream into memory, refusing one longer than `maxBytes`. */
export async function readDownloadStream(
  body: ReadableStream<Uint8Array>,
  maxBytes: number,
  operation: string,
): Promise<Uint8Array> {
  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      throw new Error(`custd: ${operation} exceeds ${maxBytes / (1024 * 1024)} MiB`);
    }
    chunks.push(value);
  }
  const result = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return result;
}
