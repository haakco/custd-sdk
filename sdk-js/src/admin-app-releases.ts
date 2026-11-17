/**
 * A hosted environment's releases. A release is created from its manifest,
 * each listed file is uploaded as raw bytes, the release is verified once every
 * file reads back intact, and a verified release is promoted to the
 * environment's host. The environment must have hosting enabled in its desired
 * state. The operations live on `admin.authProjects`.
 */

/** A pending release accepts uploads; a verified release accepts none and can be promoted. */
export type AppReleaseState = "pending" | "verified";

/** The caching a cache rule applies to the files it matches. */
export type AppReleaseCacheMode = "immutable" | "revalidate" | "short" | "no-store";

/** Who may frame the routes a header rule matches. */
export type AppReleaseFramingMode = "deny" | "same-origin" | "any";

/** One manifest file. `sha256` is the lowercase hex digest of the bytes the upload must carry. */
export type AppReleaseFile = {
  path: string;
  size: number;
  sha256: string;
  contentType: string;
};

/** Serves `file` for any path under `prefix` that names no file. */
export type AppReleaseSpaFallback = { prefix: string; file: string };

/** One extra response header. */
export type AppReleaseResponseHeader = { name: string; value: string };

/** Sets framing and extra response headers on a route. */
export type AppReleaseHeaderRule = {
  route: string;
  framing?: AppReleaseFramingMode;
  headers?: AppReleaseResponseHeader[];
};

/** Applies a cache mode to the files `match` selects. */
export type AppReleaseCacheRule = { match: string; mode: AppReleaseCacheMode };

/** A route the host may serve with share previews. */
export type AppReleaseShareableRoute = { route: string };

/** How the host serves the release. `indexFile` defaults to `index.html` on the server. */
export type AppReleaseRouting = {
  indexFile?: string;
  notFoundPage?: string;
  spaFallbacks?: AppReleaseSpaFallback[];
  headers?: AppReleaseHeaderRule[];
  cache?: AppReleaseCacheRule[];
  shareableRoutes?: AppReleaseShareableRoute[];
};

/** A new release's files and routing. The server assigns the identifier and creation time. */
export type AppReleaseCreateRequest = {
  files: AppReleaseFile[];
  routing: AppReleaseRouting;
};

/** The stored manifest of one release. */
export type AppReleaseManifest = {
  version: number;
  releaseId: string;
  createdAt: string;
  files: AppReleaseFile[];
  routing: AppReleaseRouting;
};

/** One release in a list, without its file manifest. */
export type AppReleaseSummary = {
  releaseId: string;
  state: AppReleaseState;
  active: boolean;
  fileCount: number;
  totalBytes: number;
  createdAt: string;
  verifiedAt?: string;
};

/** One stored release with its manifest. */
export type AppRelease = AppReleaseSummary & { manifest: AppReleaseManifest };

/** An environment's most recent releases, newest first. */
export type AppReleaseList = { releases: AppReleaseSummary[] };

/** The receipt for one stored release file. */
export type AppReleaseUploadedFile = { path: string; size: number; sha256: string };

/** The receipt for one promotion. `previousReleaseId` is absent when nothing was served before. */
export type AppReleasePromotion = {
  releaseId: string;
  host: string;
  previousReleaseId?: string;
  promotedAt: string;
};
