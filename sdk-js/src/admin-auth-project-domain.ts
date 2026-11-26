// Types for an auth-project environment's authentication domain, its realm brand logo and its
// app item links. The operations live on `admin.authProjects`.

import type { AppItemKind, AppLinkRole } from "./app-items.js";

/** Where an environment's authentication hostname is in its activation. */
export const AUTH_PROJECT_DOMAIN_STATUSES = {
  pending: "pending",
  active: "active",
  proofWithdrawn: "proof-withdrawn",
  disabled: "disabled",
  releasing: "releasing",
} as const;

export type AuthProjectDomainStatus = (typeof AUTH_PROJECT_DOMAIN_STATUSES)[keyof typeof AUTH_PROJECT_DOMAIN_STATUSES];

/** Whether the realm holds installed capacity. */
export const AUTH_PROJECT_DOMAIN_LIFECYCLES = {
  unclaimed: "unclaimed",
  admitted: "admitted",
  paused: "paused",
  retiring: "retiring",
  retired: "retired",
} as const;

export type AuthProjectDomainLifecycle =
  (typeof AUTH_PROJECT_DOMAIN_LIFECYCLES)[keyof typeof AUTH_PROJECT_DOMAIN_LIFECYCLES];

/** Whether the realm runs the images it is expected to. */
export const AUTH_PROJECT_DOMAIN_CONVERGENCES = {
  converged: "converged",
  drifted: "drifted",
  notRunning: "not-running",
  unverified: "unverified",
  rollingOut: "rolling-out",
} as const;

export type AuthProjectDomainConvergence =
  (typeof AUTH_PROJECT_DOMAIN_CONVERGENCES)[keyof typeof AUTH_PROJECT_DOMAIN_CONVERGENCES];

/** Where the realm's expected image identity comes from. */
export const AUTH_PROJECT_DOMAIN_IMAGE_SOURCES = {
  releaseDefault: "release-default",
  override: "override",
  undeclared: "undeclared",
} as const;

export type AuthProjectDomainImageSource =
  (typeof AUTH_PROJECT_DOMAIN_IMAGE_SOURCES)[keyof typeof AUTH_PROJECT_DOMAIN_IMAGE_SOURCES];

/** The realm workload an incident image override pins. */
export const AUTH_PROJECT_DOMAIN_IMAGE_COMPONENTS = {
  gateway: "gateway",
  hydra: "hydra",
} as const;

export type AuthProjectDomainImageComponent =
  (typeof AUTH_PROJECT_DOMAIN_IMAGE_COMPONENTS)[keyof typeof AUTH_PROJECT_DOMAIN_IMAGE_COMPONENTS];

/** Reserve a verified Site domain's hostname for the environment. */
export type AuthProjectDomainBindRequest = { siteDomainId: string; host: string };

/** Reserve a platform-generated issuer hostname, attested by a Site domain. Operators only. */
export type AuthProjectDomainMintRequest = { siteDomainId: string };

/** Pin one realm component to an exact image until expiresAt, for an incident. */
export type AuthProjectDomainImageOverrideRequest = {
  component: AuthProjectDomainImageComponent;
  imageDigest: string;
  incidentReference: string;
  expiresAt: string;
};

export type AuthProjectDomainImageSet = { gateway?: string; hydra?: string };

/** The realm's active or last incident image override. */
export type AuthProjectDomainImageOverride = {
  component: AuthProjectDomainImageComponent;
  imageDigest: string;
  incidentReference: string;
  actorKind: string;
  actorSubject?: string;
  receiptId: string;
  state: string;
  setAt: string;
  expiresAt: string;
  endedAt?: string;
  endedBy?: string;
};

export type AuthProjectDomainImages = {
  expected: AuthProjectDomainImageSet;
  running: AuthProjectDomainImageSet;
  source: AuthProjectDomainImageSource;
  convergence: AuthProjectDomainConvergence;
  override?: AuthProjectDomainImageOverride;
};

/** The TXT record that proves the hostname. */
export type AuthProjectDomainDNSProof = { recordName: string; recordValue: string };

/** An environment's authentication hostname, its state and the DNS records it needs. */
export type AuthProjectDomainBinding = {
  environmentId: string;
  slotRef?: string;
  siteDomainId?: string;
  host: string;
  issuer: string;
  status: AuthProjectDomainStatus;
  lifecycle: AuthProjectDomainLifecycle;
  intentRevision: number;
  images: AuthProjectDomainImages;
  dnsTarget?: string;
  dnsProof?: AuthProjectDomainDNSProof;
  createdAt: string;
  observedAt?: string;
  certificateExpiresAt?: string;
};

/** The realm's stored brand logo. */
export type AuthProjectBrandLogo = {
  contentType: string;
  updatedAt: string;
  byteSize: number;
  width: number;
  height: number;
};

/** One owner or share link to an app item in the environment. */
export type AuthProjectAppLink = {
  linkUuid: string;
  itemUuid: string;
  kind: AppItemKind;
  role: AppLinkRole;
  createdAt: string;
  /** When the item expires unless it changes; its links stop working then. */
  itemExpiresAt: string;
};

export type AuthProjectAppLinkList = { links: AuthProjectAppLink[] };
