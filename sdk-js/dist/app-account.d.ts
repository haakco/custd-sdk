export type CreateAppAccountEntryOptions = {
    /** The trusted issuer that authenticated this application session. */
    issuer: string;
    /** The registered application's serialized HTTPS origin. */
    applicationOrigin: string;
    accessToken: string;
    /**
     * The page on the application origin hosted settings links back to, such as "/mine". Defaults to
     * the application's home. Never pass the current URL blindly: a fragment or path may hold a link token.
     */
    returnPath?: string;
    fetch?: typeof globalThis.fetch;
};
export type AppAccountEntry = {
    actionUrl: string;
    /** A short-lived, one-use credential for the form body. Keep it out of URLs and logs. */
    ticket: string;
};
/** Issue a hosted settings entry ticket for the remembered application session. */
export declare function createAppAccountEntry(options: CreateAppAccountEntryOptions): Promise<AppAccountEntry>;
export type OpenAppAccountSettingsOptions = Omit<CreateAppAccountEntryOptions, "applicationOrigin"> & {
    /** Defaults to the page's own origin, which must be registered for the application. */
    applicationOrigin?: string;
    /** Defaults to the page's document; pass one in tests. */
    document?: Document;
};
/**
 * Open hosted account settings in the same tab from a browser app. It asks the issuer for a one-use
 * ticket and posts it in a native form, so settings shows a verified link back to the app.
 */
export declare function openAppAccountSettings(options: OpenAppAccountSettingsOptions): Promise<void>;
export declare class AppAccountEntryError extends Error {
    readonly status: number;
    constructor(status: number);
}
export type CurrentAppProfileField = {
    fieldKey: string;
    value?: string;
    present: boolean;
    /** Remains true after an explicit clear so apps do not import the old value again. */
    initialized: boolean;
    required: boolean;
    editableBy: string;
    editable: boolean;
};
export type CurrentAppProfile = {
    fields: CurrentAppProfileField[];
    managedPhoto?: boolean;
};
export type CurrentAppProfileUpdate = {
    values: {
        fieldKey: string;
        value: string;
    }[];
};
export type CurrentAppProfileClientConfig = {
    apiBaseUrl: string;
    /** Returns the current end-user access token with the application's profile scope. */
    accessToken: () => string | Promise<string>;
    fetch?: typeof globalThis.fetch;
};
export declare class CurrentAppProfileError extends Error {
    readonly status: number;
    constructor(status: number);
}
export declare class CurrentAppProfileClient {
    private readonly config;
    private readonly origin;
    private readonly fetch;
    constructor(config: CurrentAppProfileClientConfig);
    read(): Promise<CurrentAppProfile>;
    update(update: CurrentAppProfileUpdate): Promise<CurrentAppProfile>;
    /** Fill only previously uninitialized fields and return the current profile. */
    initialize(update: CurrentAppProfileUpdate): Promise<CurrentAppProfile>;
    private writeFields;
    readPhoto(): Promise<Blob>;
    uploadPhoto(photo: Blob): Promise<CurrentAppProfile>;
    /** Fill a previously uninitialized photo and return the current profile. */
    initializePhoto(photo: Blob): Promise<CurrentAppProfile>;
    private writePhoto;
    removePhoto(): Promise<CurrentAppProfile>;
    private profile;
    private request;
}
