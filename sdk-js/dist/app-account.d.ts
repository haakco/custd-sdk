export type AppAccountNavigationConfig = {
    /** The application's configured Custd issuer. */
    issuer: string;
    /** The same app home configured on the issuer for the settings return link. */
    applicationHome: string;
};
export type AppAccountNavigation = {
    settingsUrl: string;
    returnUrl: string;
};
/** Build the account link without accepting destinations from browser navigation state. */
export declare function appAccountNavigation(config: AppAccountNavigationConfig): AppAccountNavigation;
export type CurrentAppProfileField = {
    fieldKey: string;
    value?: string;
    present: boolean;
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
    readPhoto(): Promise<Blob>;
    uploadPhoto(photo: Blob): Promise<CurrentAppProfile>;
    removePhoto(): Promise<CurrentAppProfile>;
    private profile;
    private request;
}
