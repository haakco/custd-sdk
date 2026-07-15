import { describe, expect, it } from "vitest";
import { createMobileEvent } from "./index";

const event = {
  eventUuid: "evt-mobile-1",
  eventTypeSlug: "mobile.screen.opened",
  schemaVersion: "1.0.0",
  timestamp: "2026-07-15T00:00:00.000Z",
  subject: { kind: "anonymous" as const, anonymousId: "anon-123" },
  context: {
    appVersion: "1.2.3",
    platform: "ios" as const,
    locale: "en-ZA",
    timezone: "Africa/Johannesburg",
    networkState: "offline" as const,
  },
  payload: { screen: "home" },
};

describe("createMobileEvent", () => {
  it("creates an event with explicit anonymous or authenticated subject association", () => {
    expect(createMobileEvent(event)).toMatchObject({
      eventUuid: "evt-mobile-1",
      anonymousId: "anon-123",
      userUuid: null,
      context: {
        device: { type: "mobile", os: "ios" },
        appVersion: "1.2.3",
        locale: "en-ZA",
        timezone: "Africa/Johannesburg",
        networkState: "offline",
      },
    });

    expect(
      createMobileEvent({
        ...event,
        subject: { kind: "authenticated", userUuid: "user-123" },
      }),
    ).toMatchObject({ anonymousId: undefined, userUuid: "user-123" });
  });

  it.each([
    [{ ...event, context: { ...event.context, platform: "web" } }, /platform/],
    [{ ...event, context: { ...event.context, appVersion: "release" } }, /appVersion/],
    [{ ...event, context: { ...event.context, locale: "not a locale" } }, /locale/],
    [{ ...event, context: { ...event.context, timezone: "Mars/Olympus" } }, /timezone/],
    [{ ...event, context: { ...event.context, networkState: "wifi" } }, /networkState/],
    [{ ...event, context: { ...event.context, extra: true } }, /unknown mobile context field/i],
    [{ ...event, producerToken: "must-not-leave-the-app" }, /unknown mobile event field/i],
    [
      { ...event, subject: { kind: "anonymous", anonymousId: "", userUuid: "user-123" } },
      /anonymous mobile subject|anonymousId/,
    ],
    [{ ...event, payload: { clientSecret: "must-not-leave-the-app" } }, /sensitive field/i],
  ])("rejects invalid mobile boundary input %o", (input, error) => {
    expect(() => createMobileEvent(input as never)).toThrow(error);
  });

  it.each([
    "token",
    "authToken",
    "idToken",
    "oauthToken",
    "refreshToken",
    "refresh_token",
  ])("rejects credential-shaped payload field %s", (field) => {
    expect(() => createMobileEvent({ ...event, payload: { nested: { [field]: "must-not-persist" } } })).toThrow(
      /sensitive field/i,
    );
  });
});
