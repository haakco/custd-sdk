/**
 * A hosted environment's releases. A release is created from its manifest,
 * each listed file is uploaded as raw bytes, the release is verified once every
 * file reads back intact, and a verified release is promoted to the
 * environment's host. The environment must have hosting enabled in its desired
 * state. The operations live on `admin.authProjects`.
 */
export {};
