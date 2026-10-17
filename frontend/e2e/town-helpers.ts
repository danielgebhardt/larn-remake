import { expect, type Page } from "@playwright/test";
export const enterDungeonFromTown = async (page: Page) => {
	await expect(page.getByLabel("Town map", { exact: true })).toBeFocused();
	await page.keyboard.type("ss");
	await page.keyboard.press("Enter");
	await expect(page.getByLabel("Dungeon map", { exact: true })).toBeFocused();
};
