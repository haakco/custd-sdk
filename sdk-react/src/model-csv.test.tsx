// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { downloadSummaryCsv } from "./model-csv.js";

afterEach(() => vi.restoreAllMocks());

describe("downloadSummaryCsv", () => {
  it("downloads the run summary as a named CSV file", async () => {
    let saved: Blob | undefined;
    URL.createObjectURL = (blob: Blob) => {
      saved = blob;
      return "blob:summary";
    };
    URL.revokeObjectURL = vi.fn();
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) {
      expect(this.download).toBe("model-run-r1.csv");
      expect(this.href).toBe("blob:summary");
    });
    downloadSummaryCsv({ runUuid: "r1", quantities: [{ name: "x", error: { code: "c", detail: "d" } }] });
    expect(click).toHaveBeenCalledOnce();
    expect(await saved?.text()).toContain("x,,,,,,,,,c: d");
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:summary");
  });
});
