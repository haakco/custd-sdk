import { FAKE_CUSTD_API_PATH, FakeCustd } from "@haakco/custd-sdk/testing";
import { type BrowserContext, expect, test } from "@playwright/test";

const live = Boolean(process.env.APP_URL);

/** Without APP_URL, answers the discovery file and Custd API from one fake shared by every context. */
async function routeToFake(context: BrowserContext, fake: FakeCustd | null): Promise<void> {
  if (!fake) return;
  for (const pattern of ["**/.well-known/custd.json", `**${FAKE_CUSTD_API_PATH}/**`]) {
    await context.route(pattern, async (route) => {
      const request = route.request();
      const answer = fake.handle({
        method: request.method(),
        url: request.url(),
        headers: await request.allHeaders(),
        body: request.postData(),
      });
      await route.fulfill({ status: answer.status, headers: answer.headers, body: answer.body ?? "" });
    });
  }
}

test("create a counter, add three measurements, open the share link elsewhere", async ({ browser, baseURL }) => {
  const fake = live ? null : new FakeCustd({ origin: baseURL, capabilities: ["app_data"] });
  const owner = await browser.newContext();
  await routeToFake(owner, fake);
  const page = await owner.newPage();

  await test.step("open the live URL", async () => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1, name: "New counter" })).toBeVisible();
  });

  const name = `Walking skeleton ${Date.now()}`;
  await test.step("create a counter", async () => {
    await page.getByLabel("What are you counting?").fill(name);
    await page.getByLabel("Target").fill("100");
    await page.getByRole("button", { name: "Create counter" }).click();
    await expect(page.getByRole("heading", { level: 1, name })).toBeVisible();
    expect(new URL(page.url()).pathname).toBe("/edit/c");
  });

  await test.step("add three measurements", async () => {
    for (const value of ["10", "25", "40"]) {
      await page.getByLabel("Count now").fill(value);
      await page.getByRole("button", { name: "Add measurement" }).click();
      await expect(page.getByText(`Saved ${value}.`, { exact: true })).toBeVisible();
    }
  });

  const shareUrl = await test.step("read the share link", async () => {
    const value = await page.getByLabel("Read-only link").inputValue();
    expect(value).toMatch(/\/c\/[A-Za-z0-9_-]{43}$/);
    return value;
  });

  await test.step("open the share link in a second browser and see the forecast", async () => {
    const viewer = await browser.newContext();
    await routeToFake(viewer, fake);
    const sharePage = await viewer.newPage();
    await sharePage.goto(shareUrl);
    await expect(sharePage.getByRole("heading", { level: 1, name })).toBeVisible();
    await expect(sharePage.getByTestId("forecast-inputs")).toContainText("Based on 3 measurements");
    await expect(sharePage.getByRole("button", { name: "Add measurement" })).toHaveCount(0);
    await viewer.close();
  });

  await owner.close();
});
