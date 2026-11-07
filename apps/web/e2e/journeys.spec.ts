import { expect, test } from "@playwright/test";

test("search for a brand, then see who owns and licenses it in another country", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByLabel("Brand or company").fill("kitkat");
  await page.getByRole("button", { name: "Search" }).click();
  await page.getByRole("link", { name: "KitKat" }).click();

  await expect(page.getByRole("heading", { level: 1, name: "KitKat" })).toBeVisible();
  await page.getByLabel("Country").selectOption("GB");
  await page.getByRole("button", { name: "Update the answer" }).click();
  await expect(page.getByRole("heading", { level: 3, name: /^Ownership: Nestl/ })).toBeVisible();
  await expect(page.getByRole("heading", { level: 3, name: /^Licence:/ })).toHaveCount(0);

  await page.getByLabel("Country").selectOption("US");
  await page.getByRole("button", { name: "Update the answer" }).click();
  await expect(page).toHaveURL(/country=US/);
  await expect(
    page.getByRole("heading", { level: 3, name: "Licence: The Hershey Company" }),
  ).toBeVisible();
  await expect(
    page.getByRole("list", { name: "Sources" }).getByRole("link").first(),
  ).toHaveAttribute("href", /^https:\/\//);
});

test("a company's profile shows what it holds", async ({ page }) => {
  await page.goto("/check/entity%3Ahershey?country=US");
  await page.getByRole("link", { name: "More about The Hershey Company" }).click();
  await expect(page.getByRole("heading", { level: 2, name: "Holds" })).toBeVisible();
  await expect(
    page.getByText("The Hershey Company makes or sells KitKat under licence"),
  ).toBeVisible();
});

test("a brand not recorded in a country says so", async ({ page }) => {
  await page.goto("/check/brand%3A7up?country=US");
  await expect(page.getByRole("heading", { level: 2, name: "Not in our records" })).toBeVisible();
  await expect(page.getByText("in the United States on")).toBeVisible();
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("search and the answer still work", async ({ page }) => {
    await page.goto("/");
    await page.getByLabel("Brand or company").fill("persil");
    await page.getByRole("button", { name: "Search" }).click();
    await page.getByRole("link", { name: "Persil" }).click();
    await page.getByLabel("Country").selectOption("DE");
    await page.getByRole("button", { name: "Update the answer" }).click();
    await expect(page.getByRole("heading", { level: 3, name: /^Ownership: Henkel/ })).toBeVisible();
  });
});
