import { optionalString, requireBoolean, requireObjectList, requireRecord, requireString, } from "./response-validation.js";
/** Build the account link without accepting destinations from browser navigation state. */
export function appAccountNavigation(config) {
    const issuer = appHttpsUrl(config.issuer);
    if (issuer.search || issuer.hash)
        throw new TypeError("custd: invalid account issuer");
    const settings = new URL(`${issuer.pathname.replace(/\/$/, "")}/settings`, issuer.origin);
    if (settings.origin !== issuer.origin)
        throw new TypeError("custd: invalid account issuer path");
    return { settingsUrl: settings.href, returnUrl: appHttpsUrl(config.applicationHome).href };
}
function appHttpsUrl(value) {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password) {
        throw new TypeError("custd: app account URLs must use HTTPS without credentials");
    }
    return url;
}
export class CurrentAppProfileError extends Error {
    constructor(status) {
        super(`custd: current app profile request failed (HTTP ${status})`);
        this.status = status;
        this.name = "CurrentAppProfileError";
    }
}
const profilePath = "/api/v1/app/profile";
const photoPath = `${profilePath}/photo`;
const maxPhotoBytes = 256 * 1024;
const profileContext = "current app profile";
export class CurrentAppProfileClient {
    constructor(config) {
        this.config = config;
        this.origin = appHttpsUrl(config.apiBaseUrl).origin;
        this.fetch = config.fetch ?? globalThis.fetch.bind(globalThis);
    }
    read() {
        return this.profile(profilePath, { method: "GET" });
    }
    update(update) {
        return this.writeFields("PATCH", update);
    }
    /** Fill only previously uninitialized fields and return the current profile. */
    initialize(update) {
        return this.writeFields("POST", update);
    }
    writeFields(method, update) {
        return this.profile(profilePath, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(update),
        });
    }
    async readPhoto() {
        const response = await this.request(photoPath, { method: "GET" });
        const photo = await response.blob();
        validatePhoto(photo);
        return photo;
    }
    uploadPhoto(photo) {
        return this.writePhoto("PUT", photo);
    }
    /** Fill a previously uninitialized photo and return the current profile. */
    initializePhoto(photo) {
        return this.writePhoto("POST", photo);
    }
    writePhoto(method, photo) {
        validatePhoto(photo);
        return this.profile(photoPath, { method, headers: { "Content-Type": photo.type }, body: photo });
    }
    removePhoto() {
        return this.profile(photoPath, { method: "DELETE" });
    }
    async profile(path, init) {
        const response = await this.request(path, init);
        return decodeProfile(await response.json());
    }
    async request(path, init) {
        const token = await this.config.accessToken();
        if (!token || /\s/.test(token))
            throw new TypeError("custd: app profile access token is required");
        const headers = new Headers(init.headers);
        headers.set("Authorization", `Bearer ${token}`);
        const response = await this.fetch(new URL(path, this.origin), {
            ...init,
            headers,
            redirect: "error",
            credentials: "omit",
            cache: "no-store",
        });
        if (!response.ok)
            throw new CurrentAppProfileError(response.status);
        return response;
    }
}
function validatePhoto(photo) {
    if (!["image/png", "image/webp"].includes(photo.type) || photo.size === 0 || photo.size > maxPhotoBytes) {
        throw new TypeError("custd: app profile photo must be PNG or WebP and at most 256 KiB");
    }
}
function decodeProfile(json) {
    const record = requireRecord(json, profileContext);
    const fields = requireObjectList(record, "fields", profileContext).map(decodeField);
    if (record.managedPhoto === undefined)
        return { fields };
    return { fields, managedPhoto: requireBoolean(record, "managedPhoto", profileContext) };
}
function decodeField(record) {
    const field = {
        fieldKey: requireString(record, "fieldKey", profileContext),
        present: requireBoolean(record, "present", profileContext),
        initialized: record.initialized === undefined ? false : requireBoolean(record, "initialized", profileContext),
        required: requireBoolean(record, "required", profileContext),
        editableBy: requireString(record, "editableBy", profileContext),
        editable: requireBoolean(record, "editable", profileContext),
    };
    optionalString(record, "value", profileContext);
    if (typeof record.value === "string")
        field.value = record.value;
    return field;
}
