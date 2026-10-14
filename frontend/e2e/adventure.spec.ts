import { fileURLToPath } from "node:url";
import { expect, type Page, test } from "@playwright/test";

const map = (page: Page) => page.getByLabel("Dungeon map", { exact: true });
const turns = (page: Page) => page.getByLabel("Turn count", { exact: true });
const saveSheet = (page: Page) =>
	page.getByRole("dialog", { name: "Save/Load", exact: true });
const importAdventure = async (page: Page, name = "ready") => {
	await page
		.getByRole("button", { name: "Load an existing save", exact: true })
		.click();
	await expect(
		page.getByRole("button", { name: "Save adventure", exact: true }),
	).toBeHidden();
	await expect(
		page.getByRole("button", { name: "Export file", exact: true }),
	).toBeHidden();
	await page
		.getByLabel("Import adventure file")
		.setInputFiles(
			fileURLToPath(new URL(`.generated/${name}.json`, import.meta.url)),
		);
	await expect(
		page.getByRole("dialog", { name: "Load adventure", exact: true }),
	).toBeHidden();
	await expect(map(page)).toBeFocused();
};

test.beforeEach(async ({ page }) => {
	await page.goto("/"); // Playwright supplies a fresh browser context and storage for every test.
});

test("welcome choices and keyboard Settings apply return control to the map", async ({
	page,
}) => {
	await expect(page.getByRole("radio", { name: /Large/ })).toBeChecked();
	await page.getByRole("radio", { name: /Small/ }).check();
	await page.getByRole("radio", { name: /Harder/ }).check();
	await page
		.getByRole("button", { name: "Begin Adventure", exact: true })
		.click();
	await expect(map(page)).toBeFocused();
	await expect(
		page.getByLabel("Adventure difficulty", { exact: true }),
	).toHaveText("Harder");
	await page.getByRole("button", { name: "Settings", exact: true }).click();
	const settings = page.getByRole("dialog", { name: "Settings", exact: true });
	await expect(settings.getByLabel("Current dungeon configuration")).toHaveText(
		"20 rows × 20 columns · 20 floors",
	);
	await settings
		.getByRole("textbox", { name: "Dungeon seed", exact: true })
		.fill("123");
	await settings.getByRole("textbox", { name: "Rows", exact: true }).fill("15");
	await settings
		.getByRole("textbox", { name: "Columns", exact: true })
		.fill("15");
	await settings.getByRole("radio", { name: /Easier/ }).check();
	await settings
		.getByRole("textbox", { name: "Floors", exact: true })
		.fill("5");
	await settings
		.getByRole("textbox", { name: "Floors", exact: true })
		.press("Enter");
	await expect(settings).toBeHidden();
	await expect(map(page)).toBeFocused();
	await expect(
		page.getByRole("heading", { name: "Floor 1 of 5" }),
	).toBeVisible();
	await expect(
		page.getByLabel("Adventure difficulty", { exact: true }),
	).toHaveText("Easier");
	await page.keyboard.press("Space");
	await expect(turns(page)).toHaveText("Turn 1");
});

test("file import supports pickup and both hotbars without clicking the dungeon", async ({
	page,
}) => {
	await importAdventure(page);
	await expect(
		page.getByLabel("Adventure difficulty", { exact: true }),
	).toHaveText("Harder");
	await page.keyboard.press("g");
	await expect(page.getByRole("log")).toContainText(
		"You pick up Healing potion",
	);
	await page.keyboard.press("1");
	await expect(page.getByLabel("Player health", { exact: true })).toContainText(
		"6 / 10",
	);
	await page.keyboard.press("6"); // The starting Heal spell's assigned slot.
	await expect(page.getByLabel("Player health", { exact: true })).toContainText(
		"10 / 10",
	);
	await expect(page.getByLabel("Player mana", { exact: true })).toContainText(
		"6 / 10",
	);
	await expect(turns(page)).toHaveText("Turn 3");
});

test("confirmed local saving and loading restore the earlier turn and keyboard healing", async ({
	page,
}) => {
	await importAdventure(page);
	await page.getByRole("button", { name: "Save/Load", exact: true }).click();
	await expect(
		saveSheet(page).getByRole("button", {
			name: "Load adventure",
			exact: true,
		}),
	).toBeDisabled();
	await saveSheet(page)
		.getByRole("button", { name: "Save adventure", exact: true })
		.click();
	await page.getByRole("button", { name: "Confirm save", exact: true }).click();
	await expect(
		page.getByRole("dialog", { name: "Save this adventure?" }),
	).toBeHidden();
	await expect(page.getByLabel("Save feedback")).toContainText(
		"Adventure saved",
	);
	await saveSheet(page)
		.getByRole("button", { name: "Close", exact: true })
		.click();
	await expect(saveSheet(page)).toBeHidden();
	// Closing without loading returns to the toolbar trigger; select the map to resume.
	await map(page).click();
	await expect(map(page)).toBeFocused();
	await page.keyboard.press("Space");
	await expect(turns(page)).toHaveText("Turn 1");
	await page.getByRole("button", { name: "Save/Load", exact: true }).click();
	await saveSheet(page)
		.getByRole("button", { name: "Load adventure", exact: true })
		.click();
	await page.getByRole("button", { name: "Confirm load", exact: true }).click();
	await expect(saveSheet(page)).toBeHidden();
	await expect(map(page)).toBeFocused();
	await expect(turns(page)).toHaveText("Turn 0");
	await page.keyboard.press("h");
	await expect(page.getByLabel("Player health", { exact: true })).toContainText(
		"5 / 10",
	);
	await expect(turns(page)).toHaveText("Turn 1");
});

test("a fatal committed turn opens defeat, freezes play and permits replay", async ({
	page,
}) => {
	await importAdventure(page, "poisoned");
	await page.keyboard.press("Space");
	const defeat = page.getByRole("dialog", { name: "You died", exact: true });
	await expect(defeat).toBeVisible();
	await expect(defeat.getByLabel("Run turns")).toHaveText("1");
	await expect(defeat.getByLabel("Defeat recap")).toContainText(/poison/i);
	await defeat
		.getByRole("button", { name: "Inspect run", exact: true })
		.click();
	await expect(defeat).toBeHidden();
	await page.keyboard.press("Space");
	await expect(turns(page)).toHaveText("Turn 1");
	await expect(page.getByLabel("Player health", { exact: true })).toContainText(
		"0 / 10",
	);
	await page.getByRole("button", { name: "Settings", exact: true }).click();
	await page
		.getByRole("button", { name: "Start from seed", exact: true })
		.click();
	await expect(
		page.getByRole("dialog", { name: "Settings", exact: true }),
	).toBeHidden();
	await expect(map(page)).toBeFocused();
	await expect(turns(page)).toHaveText("Turn 0");
	await expect(
		page.getByLabel("Adventure difficulty", { exact: true }),
	).toHaveText("Harder");
	await page.keyboard.press("Space");
	await expect(turns(page)).toHaveText("Turn 1");
});

test("merchant comparisons open with Enter after import and only selling spends a turn", async ({
	page,
}) => {
	await importAdventure(page, "merchant");
	await page.keyboard.press("e");
	const merchant = page.getByRole("dialog", {
		name: "Wandering potion merchant",
		exact: true,
	});
	await expect(merchant).toBeVisible();
	await page.keyboard.press("s");
	const summary = merchant.getByText("Compare Ring of Intelligence", {
		exact: true,
	});
	await summary.press("Enter");
	const disclosure = merchant
		.locator("details")
		.filter({ hasText: "Compare Ring of Intelligence" });
	await expect(disclosure).toHaveAttribute("open", "");
	const previews = disclosure.getByLabel("Equipment comparison", {
		exact: true,
	});
	await expect(previews).toHaveCount(2);
	await expect(previews.nth(0)).toContainText("Tradeoff · Left ring");
	await expect(previews.nth(0)).toContainText("Damage 4–6 → 3–5");
	await expect(previews.nth(1)).toContainText("Maximum mana 16 → 14 (−2)");
	await expect(turns(page)).toHaveText("Turn 0");
	await expect(merchant.getByText("Gold 700", { exact: true })).toBeVisible();
	await page.keyboard.press("Escape");
	await expect(map(page)).toBeFocused();
	await page.keyboard.press("c");
	const character = page.getByRole("dialog", {
		name: "Character",
		exact: true,
	});
	await expect(
		character.getByRole("button", {
			name: "Left ring: Ring of Strength",
			exact: true,
		}),
	).toBeVisible();
	await expect(
		character.getByLabel("Character mana", { exact: true }),
	).toContainText("3 / 16");
	await page.keyboard.press("c");
	await expect(map(page)).toBeFocused();
	await page.keyboard.press("e");
	await page.keyboard.press("s");
	await merchant
		.getByRole("button", {
			name: "Short sword · Sell for 20 gold",
			exact: true,
		})
		.press("Enter");
	await expect(
		merchant.getByRole("button", {
			name: "Short sword · Sell for 20 gold",
			exact: true,
		}),
	).toBeHidden();
	await expect(merchant.getByText("Gold 720", { exact: true })).toBeVisible();
	await expect(turns(page)).toHaveText("Turn 1");
	await expect(
		merchant.getByRole("button", {
			name: "Ring of Intelligence · Sell for 30 gold",
			exact: true,
		}),
	).toBeFocused();
});
