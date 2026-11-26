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
export declare function responseDownloadStream(response: Response, operation: string, byteSize?: number): CustdDownloadStream;
/** Reads a whole stream into memory, refusing one longer than `maxBytes`. */
export declare function readDownloadStream(body: ReadableStream<Uint8Array>, maxBytes: number, operation: string): Promise<Uint8Array>;
