import { expect, test } from "@playwright/test";

test("runs the recruiter agent from the default sample", async ({ page }) => {
  await page.goto("/");
  const runResponse = page.waitForResponse(
    (response) => response.url().includes("/api/run-agent") && response.request().method() === "POST",
    { timeout: 120_000 }
  );
  await page.getByRole("button", { name: "Run" }).click();
  expect((await runResponse).ok()).toBe(true);
  await expect(page.getByText("Ranked Shortlist")).toBeVisible();
  await expect(page.getByRole("button", { name: /Maya Shah/ })).toBeVisible({ timeout: 60_000 });
  await page.getByRole("button", { name: "Transcript" }).click();
  await expect(page.getByText("Simulated outreach for prototype scoring.")).toBeVisible();
  await page.getByRole("button", { name: "Audit" }).click();
  await expect(page.getByText("Safety Notes")).toBeVisible();
});
