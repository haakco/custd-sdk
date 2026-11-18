import { appItemOwnerUrl, appItemShareUrl, parseAppItemLink } from "@haakco/custd-sdk/browser";

/** The page path of a counter in owner and share links. */
export const COUNTER_PATH = "c";

/**
 * The SDK builds `https://<host>/...` links. Keeping only the path and fragment and adding this
 * page's origin makes the same links work on a local preview too.
 */
function onThisOrigin(url: string): string {
  const parsed = new URL(url);
  return `${window.location.origin}${parsed.pathname}${parsed.hash}`;
}

/** The owner page: the token sits in the URL fragment, which the browser never sends to a server. */
export function ownerUrl(ownerToken: string): string {
  return onThisOrigin(appItemOwnerUrl({ host: window.location.host, kindPath: COUNTER_PATH, token: ownerToken }));
}

/** The read-only page anyone with the link can open. */
export function shareUrl(shareToken: string): string {
  return onThisOrigin(appItemShareUrl({ host: window.location.host, kindPath: COUNTER_PATH, token: shareToken }));
}

export type Page =
  | { name: "create" }
  | { name: "owner"; token: string }
  | { name: "share"; token: string }
  | { name: "not_found" };

/** Which page the current address shows. */
export function pageFor(href: string): Page {
  const url = new URL(href);
  if (url.pathname === "/") return { name: "create" };
  const link = parseAppItemLink(href);
  if (link?.kindPath === COUNTER_PATH && link.role === "owner") return { name: "owner", token: link.token };
  if (link?.kindPath === COUNTER_PATH && link.role === "share") return { name: "share", token: link.token };
  return { name: "not_found" };
}

const SHARE_TOKEN_KEY = "counter-share-token:";

/** Custd shows the share token once, at create, so this browser keeps it for the owner page. */
export function rememberShareToken(itemUuid: string, token: string): void {
  try {
    localStorage.setItem(SHARE_TOKEN_KEY + itemUuid, token);
  } catch {
    // Storage blocked (private mode): the owner page offers to make a new share link instead.
  }
}

export function rememberedShareToken(itemUuid: string): string | null {
  try {
    return localStorage.getItem(SHARE_TOKEN_KEY + itemUuid);
  } catch {
    return null;
  }
}
