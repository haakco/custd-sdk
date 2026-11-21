import { AppItemError } from "@haakco/custd-sdk/browser";

/** A short, readable reason for a failed call, with Custd's problem code to search for. */
export function errorText(error: unknown): string {
  if (error instanceof AppItemError) {
    if (error.code === "network") return "no answer from Custd. Check your connection and try again.";
    return `${error.problem?.detail ?? error.problem?.title ?? "Custd refused the request"} (${error.code})`;
  }
  return error instanceof Error ? error.message : String(error);
}
