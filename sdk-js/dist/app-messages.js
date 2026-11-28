import { emptyAppNullLists } from "./response-lists.js";
import { requireBoolean, requireInteger, requireObjectList, requireRecord, requireString, } from "./response-validation.js";
const root = "/app/messages";
const context = "message archive response";
const maxMediaBytes = 10 * 1024 * 1024;
function messagePath(messageUuid) {
    return `${root}/${encodeURIComponent(messageUuid)}`;
}
export class AppMessageClient {
    constructor(request, download) {
        this.request = request;
        this.download = download;
    }
    async session(options) {
        const data = requireRecord(await this.request("GET", `${root}/session`, undefined, options), context);
        requireString(data, "companySlug", context);
        requireString(data, "principalId", context);
        requireBoolean(data, "importAllowed", context);
        return data;
    }
    async import(request, options) {
        const data = requireRecord(await this.request("POST", `${root}/batch`, request, options), context);
        requireObjectList(data, "results", context);
        return data;
    }
    async search(request, options) {
        const path = `${root}/search`;
        const response = await this.request("POST", path, request, options);
        const data = requireRecord(emptyAppNullLists("POST", `/api/v1${path}`, response), context);
        requireObjectList(data, "messages", context);
        return data;
    }
    async get(messageUuid, options) {
        const path = messagePath(messageUuid);
        const response = await this.request("GET", path, undefined, options);
        const data = requireRecord(emptyAppNullLists("GET", `/api/v1${path}`, response), context);
        requireRecord(data.message, context);
        return data;
    }
    async deleteSource(source, options) {
        const data = requireRecord(await this.request("DELETE", `${root}/sources/${encodeURIComponent(source)}`, undefined, options), context);
        requireString(data, "source", context);
        requireInteger(data, "deletedCount", context);
        return data;
    }
    async uploadMedia(upload, options) {
        if (upload.image.byteLength === 0 || upload.image.byteLength > maxMediaBytes) {
            throw new Error("custd: archive image must contain 1 byte to 10 MiB");
        }
        const data = requireRecord(await this.request("PUT", `${messagePath(upload.messageUuid)}/media`, upload.image, options), context);
        requireString(data, "mediaUuid", context);
        requireString(data, "contentType", context);
        requireInteger(data, "byteCount", context);
        requireString(data, "ocrStatus", context);
        return data;
    }
    async downloadMedia(ref, options) {
        const response = await this.download(`${messagePath(ref.messageUuid)}/media/${encodeURIComponent(ref.mediaUuid)}`, options);
        const contentType = response.headers.get("content-type");
        if ((contentType !== "image/jpeg" && contentType !== "image/png") ||
            Number(response.headers.get("content-length")) > maxMediaBytes) {
            await response.body?.cancel();
            throw new Error("custd: archive image must be JPEG or PNG and at most 10 MiB");
        }
        const image = new Uint8Array(await response.arrayBuffer());
        if (image.byteLength === 0 || image.byteLength > maxMediaBytes) {
            throw new Error("custd: archive image must contain 1 byte to 10 MiB");
        }
        return { contentType, image };
    }
}
