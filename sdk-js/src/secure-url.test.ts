import { describe, expect, it } from "vitest";
import { isLocalHostname, secureOrLocalUrl } from "./secure-url.js";

describe("secure-url", () => {
  it("treats the bracketed IPv6 loopback the URL parser reports as local", () => {
    expect(isLocalHostname(new URL("http://[::1]:8080/").hostname)).toBe(true);
    expect(secureOrLocalUrl("http://[::1]:8080/api")).toBeInstanceOf(URL);
    expect(secureOrLocalUrl("http://example.com/api")).toBeUndefined();
  });
});
