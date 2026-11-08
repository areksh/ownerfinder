import { expect, test } from "@playwright/test";

test("search for a brand, then see who owns and licenses it in another country", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByLabel("Brand or company").fill("kitkat");
  await page.getByRole("button", { name: "Search" }).click();
  await page.getByRole("link", { name: "KitKat", exact: true }).click();

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

test("a linked answer says why the company is listed, and the reader chooses what counts", async ({
  page,
}) => {
  await page.goto("/check/brand%3Akitkat?country=GB");
  await expect(
    page.getByRole("heading", { level: 2, name: "Linked to a listed company" }),
  ).toBeVisible();
  const why = page.getByRole("region", { name: "Why Nestlé S.A. is on the list" });
  await expect(why.getByText("Admitted by the company").first()).toBeVisible();

  for (const name of ["Consumer protection", "Business in Russia"]) {
    await page.getByRole("checkbox", { name }).uncheck();
  }
  await page.getByRole("button", { name: "Update the answer" }).click();
  await expect(
    page.getByRole("heading", { level: 2, name: "No link to a listed company found" }),
  ).toBeVisible();
  await expect(page.getByRole("checkbox", { name: "Business in Russia" })).not.toBeChecked();
  await expect(page.getByRole("checkbox", { name: "Competition" })).toBeChecked();
});

test("a listed company's profile gives its reasons with their sources", async ({ page }) => {
  await page.goto("/profile/entity%3Amondelez");
  const listing = page.getByRole("region", { name: "Why it is on the list" });
  await expect(listing.getByText(/^Competition: The European Commission fined/)).toBeVisible();
  const cited = listing.getByRole("link", { name: /^Source \d+$/ }).first();
  const target = await cited.getAttribute("href");
  await expect(page.locator(target ?? "#missing").getByRole("link")).toHaveAttribute(
    "href",
    /^https:\/\/ec\.europa\.eu\//,
  );
});

test("a brand not recorded in a country says so", async ({ page }) => {
  await page.goto("/check/brand%3Anewport?country=GB");
  await expect(page.getByRole("heading", { level: 2, name: "Not in our records" })).toBeVisible();
  await expect(page.getByText("in the United Kingdom on")).toBeVisible();
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
