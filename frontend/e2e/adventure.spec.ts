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

test("The Last Ember introduces its quest and presents the historical quest item as an ember", async ({
	page,
}, testInfo) => {
	await expect(page).toHaveTitle("The Last Ember");
	await expect(page.locator('meta[name="description"]')).toHaveAttribute(
		"content",
		/last ember/,
	);
	const opening = page.getByRole("dialog", {
		name: "The Last Ember",
		exact: true,
	});
	await expect(opening).toContainText(
		"The beacon above your settlement is dying.",
	);
	await expect(opening).toContainText("Their equipment may prove useful.");
	await expect(opening).toContainText(
		"Inspired by the classic roguelike Larn.",
	);
	await page.screenshot({ path: testInfo.outputPath("opening.png") });
	await page.setViewportSize({ width: 390, height: 667 });
	await opening
		.getByRole("button", { name: "Begin Adventure", exact: true })
		.scrollIntoViewIfNeeded();
	await expect(
		opening.getByRole("button", { name: "Begin Adventure", exact: true }),
	).toBeInViewport();
	await page.setViewportSize({ width: 1280, height: 720 });
	await importAdventure(page, "ember-pickup");
	await page.keyboard.press("g");
	await expect(page.getByRole("log")).toContainText(
		"The ember lifts easily from its cradle.",
	);
	await expect(page.getByRole("log")).toContainText(
		"Getting here was the quieter half of the journey.",
	);
	await page.keyboard.press("c");
	const pouch = page.getByLabel("Quest pouch", { exact: true });
	await expect(pouch).toContainText("Ember protected");
	await expect(pouch.locator("svg")).toHaveClass(/text-item-ember/);
	await pouch.screenshot({ path: testInfo.outputPath("ember.png") });
	await page.keyboard.press("Escape");
	await expect(map(page)).toBeFocused();
	await expect(turns(page)).toHaveText("Turn 1");
});

test("returning the ember rekindles the beacon and preserves terminal victory behavior", async ({
	page,
}, testInfo) => {
	await importAdventure(page, "ember-homecoming");
	const position = await map(page)
		.getByRole("cell", { name: / - player$/, exact: false })
		.getAttribute("aria-label");
	const entrance = await map(page)
		.getByRole("cell", { name: / - entrance$/, exact: false })
		.getAttribute("aria-label");
	const parse = (label: string | null) => {
		const match = label?.match(/row(\d+)col(\d+)/);
		if (!match) throw new Error("Expected map coordinates");
		return { row: Number(match[1]), col: Number(match[2]) };
	};
	const start = parse(position),
		goal = parse(entrance);
	await page.keyboard.press(
		goal.row < start.row
			? "w"
			: goal.row > start.row
				? "s"
				: goal.col < start.col
					? "a"
					: "d",
	);
	const victory = page.getByRole("dialog", {
		name: "Adventure complete",
		exact: true,
	});
	await expect(victory).toContainText(
		"The beacon catches. Beyond the walls, the shapes retreat.",
	);
	await expect(victory).toContainText(
		"By morning, someone has complained about the smoke.",
	);
	await victory.screenshot({ path: testInfo.outputPath("victory.png") });
	await page.keyboard.press("Escape");
	await expect(map(page)).toBeFocused();
	await expect(turns(page)).toHaveText("Turn 1");
	await page.keyboard.press("Space");
	await expect(turns(page)).toHaveText("Turn 1");
});

test("the hunted ascent announces endgame hunters and explains cure sensing without stealing map focus", async ({
	page,
}) => {
	await importAdventure(page, "escape");
	await page.keyboard.press("a");
	await expect(turns(page)).toHaveText("Turn 6975");
	await expect(
		page.getByText(/The hunted return reaches floor 19/),
	).toBeVisible();
	await expect(map(page)).toBeFocused();
	await page.getByRole("button", { name: "Help", exact: true }).click();
	const hunted = page.getByRole("region", {
		name: "Hunted return",
		exact: true,
	});
	await expect(hunted).toContainText("up to 4 endgame hunters");
	await expect(hunted).toContainText("within 24 horizontal/vertical steps");
	await page.keyboard.press("Escape");
	await expect(map(page)).toBeFocused();
	await expect(turns(page)).toHaveText("Turn 6975");
});

test("a loaded late-game character shows the applied evasion curve and returns map focus without spending a turn", async ({
	page,
}) => {
	await importAdventure(page, "evasion");
	await page.keyboard.press("c");
	const character = page.getByRole("dialog", {
		name: "Character",
		exact: true,
	});
	await expect(
		character.getByLabel("Character Dexterity", { exact: true }),
	).toHaveText("Dexterity 34");
	await expect(
		character.getByLabel("Character evasion", { exact: true }),
	).toHaveText("Evade 60%");
	await expect(
		character.getByLabel("Character hit chance", { exact: true }),
	).toHaveText("Hit 95%");
	await character.getByText("Stat bonuses and growth", { exact: true }).click();
	await expect(character.getByText(/Hit 95% · evade 60%/)).toBeVisible();
	await expect(
		character.getByText(/through 20, then per 4 Dexterity/),
	).toBeVisible();
	await page.keyboard.press("Escape");
	await expect(character).toBeHidden();
	await expect(map(page)).toBeFocused();
	await expect(turns(page)).toHaveText("Turn 6974");
});

test("map following keeps five-tile margins, preserves manual scrolling and centers in a tiny viewport", async ({
	page,
}) => {
	await importAdventure(page, "scrolling");
	const viewport = map(page);
	const player = page.getByRole("cell", {
		name: "row8col10 - player",
		exact: true,
	});
	const outerScroll = await viewport.evaluate((element) => ({
		x: element.ownerDocument.defaultView?.scrollX,
		y: element.ownerDocument.defaultView?.scrollY,
	}));
	await viewport.evaluate((element) => {
		element.style.flex = "none";
		element.style.width = "360px";
		element.style.height = "300px";
	});
	// Flush the layout/ResizeObserver cycle before setting the manual reading position.
	await viewport.evaluate((element) => {
		const view = element.ownerDocument.defaultView;
		if (!view) throw new Error("Expected the map to have a browser window");
		return new Promise<void>((resolve) =>
			view.requestAnimationFrame(() =>
				view.requestAnimationFrame(() => resolve()),
			),
		);
	});
	const manual = await viewport.evaluate((element) => {
		element.scrollLeft = element.scrollWidth;
		element.scrollTop = element.scrollHeight;
		return { left: element.scrollLeft, top: element.scrollTop };
	});
	await page.keyboard.press("Space");
	await expect(turns(page)).toHaveText("Turn 1");
	expect(
		await viewport.evaluate((element) => ({
			left: element.scrollLeft,
			top: element.scrollTop,
		})),
	).toEqual(manual);
	await viewport.evaluate((element) => {
		element.style.width = "359px";
		element.style.height = "299px";
	});
	await expect
		.poll(async () => {
			const view = await viewport.boundingBox();
			const tile = await player.boundingBox();
			if (!view || !tile) return null;
			return {
				horizontal: (tile.x - view.x) / tile.width,
				vertical: (tile.y - view.y) / tile.height,
			};
		})
		.toEqual({ horizontal: 5, vertical: 5 });
	await viewport.evaluate((element) => {
		element.style.width = "120px";
		element.style.height = "96px";
	});
	await expect
		.poll(async () => {
			const view = await viewport.boundingBox();
			const tile = await player.boundingBox();
			if (!view || !tile) return null;
			return {
				x: tile.x + tile.width / 2 - view.x,
				y: tile.y + tile.height / 2 - view.y,
			};
		})
		.toEqual({ x: 60, y: 48 });
	await expect(player).toBeInViewport({ ratio: 1 });
	await expect(viewport).toBeFocused();
	expect(
		await viewport.evaluate((element) => ({
			x: element.ownerDocument.defaultView?.scrollX,
			y: element.ownerDocument.defaultView?.scrollY,
		})),
	).toEqual(outerScroll);
	await expect(turns(page)).toHaveText("Turn 1");
});

test("fresh starts, New Dungeon and seed replay restore starter potions without locking their shortcuts", async ({
	page,
}) => {
	await page.getByRole("radio", { name: /Small/ }).check();
	await page
		.getByRole("button", { name: "Begin Adventure", exact: true })
		.click();
	await expect(
		page.getByRole("button", {
			name: "Potion slot 1: Healing potion, 1 carried",
			exact: true,
		}),
	).toBeVisible();
	await expect(
		page.getByRole("button", {
			name: "Potion slot 2: Mana potion, 1 carried",
			exact: true,
		}),
	).toBeVisible();
	await page.keyboard.press("1");
	await page.keyboard.press("2");
	await expect(turns(page)).toHaveText("Turn 0");
	await page.keyboard.press("c");
	const character = page.getByRole("dialog", {
		name: "Character",
		exact: true,
	});
	await character
		.getByRole("button", { name: "Healing potion, slot 1", exact: true })
		.click();
	await character
		.getByRole("button", { name: "Assign to potion slot 4", exact: true })
		.click();
	await page.keyboard.press("Escape");
	await expect(map(page)).toBeFocused();
	await expect(
		page.getByRole("button", { name: "Potion slot 1: empty", exact: true }),
	).toBeVisible();
	await expect(
		page.getByRole("button", {
			name: "Potion slot 4: Healing potion, 1 carried",
			exact: true,
		}),
	).toBeVisible();
	await page.getByRole("button", { name: "New Dungeon", exact: true }).click();
	await expect(
		page.getByRole("button", {
			name: "Potion slot 1: Healing potion, 1 carried",
			exact: true,
		}),
	).toBeVisible();
	await expect(
		page.getByRole("button", {
			name: "Potion slot 2: Mana potion, 1 carried",
			exact: true,
		}),
	).toBeVisible();
	await map(page).focus();
	await page.keyboard.press("c");
	await character
		.getByRole("button", { name: "Mana potion, slot 2", exact: true })
		.click();
	await character
		.getByRole("button", { name: "Assign to potion slot 3", exact: true })
		.click();
	await page.keyboard.press("Escape");
	await page.getByRole("button", { name: "Settings", exact: true }).click();
	const settings = page.getByRole("dialog", { name: "Settings", exact: true });
	await settings
		.getByRole("textbox", { name: "Dungeon seed", exact: true })
		.fill("123");
	await settings
		.getByRole("button", { name: "Start from seed", exact: true })
		.click();
	await expect(map(page)).toBeFocused();
	await expect(turns(page)).toHaveText("Turn 0");
	await expect(
		page.getByRole("button", {
			name: "Potion slot 1: Healing potion, 1 carried",
			exact: true,
		}),
	).toBeVisible();
	await expect(
		page.getByRole("button", {
			name: "Potion slot 2: Mana potion, 1 carried",
			exact: true,
		}),
	).toBeVisible();
	await expect(
		page.getByRole("button", { name: "Potion slot 3: empty", exact: true }),
	).toBeVisible();
	await expect(
		page.getByRole("button", { name: "Potion slot 4: empty", exact: true }),
	).toBeVisible();
});

test("interleaved scroll stacks keep their coordinates and selected actions across three uses", async ({
	page,
}, testInfo) => {
	await importAdventure(page, "stacks");
	await page.keyboard.press("c");
	const character = page.getByRole("dialog", {
		name: "Character",
		exact: true,
	});
	const scroll = character.getByRole("button", {
		name: "Enchantment scroll, slot 1",
		exact: true,
	});
	const sword = character.getByRole("button", {
		name: "Iron sword +1, slot 2",
		exact: true,
	});
	const mana = character.getByRole("button", {
		name: "Mana potion, slot 3",
		exact: true,
	});
	await page.screenshot({
		path: testInfo.outputPath("stacks-grid-before.png"),
	});
	await scroll.click();
	const scrollBounds = await scroll.boundingBox();
	const swordBounds = await sword.boundingBox();
	const manaBounds = await mana.boundingBox();
	await page.screenshot({ path: testInfo.outputPath("stacks-before.png") });
	for (const bonus of [1, 2, 3]) {
		await character
			.getByRole("button", {
				name: `Enchant Main hand: Short sword${bonus > 1 ? ` +${bonus - 1}` : ""} to +${bonus}`,
				exact: true,
			})
			.press("Enter");
		await expect(turns(page)).toHaveText(`Turn ${bonus}`);
		await expect(
			character.getByRole("heading", { name: "Bag", exact: true }),
		).toBeFocused();
		if (bonus < 3) {
			await expect(scroll).toHaveAttribute("aria-pressed", "true");
			if (bonus === 1)
				await expect(scroll).toHaveAccessibleDescription("2 carried");
			expect(await scroll.boundingBox()).toEqual(scrollBounds);
			expect(await sword.boundingBox()).toEqual(swordBounds);
			expect(await mana.boundingBox()).toEqual(manaBounds);
			await page.screenshot({
				path: testInfo.outputPath(`stacks-${3 - bonus}-remaining.png`),
			});
			if (bonus === 2) {
				await character
					.getByRole("list", { name: "Carried items" })
					.scrollIntoViewIfNeeded();
				await page.screenshot({
					path: testInfo.outputPath("stacks-grid-one-remaining.png"),
				});
			}
		}
	}
	await expect(scroll).toBeHidden();
	await expect(
		character.getByRole("group", { name: "Choose equipment to enchant" }),
	).toBeHidden();
	await expect(
		character.getByRole("button", {
			name: "Iron sword +1, slot 1",
			exact: true,
		}),
	).toBeVisible();
	await page.keyboard.press("Escape");
	await expect(map(page)).toBeFocused();
});

test("shortcut and Character potion use retain the stack, reject full mana freely, and clear final removal", async ({
	page,
}) => {
	await importAdventure(page, "stacks");
	await page.keyboard.press("1");
	await expect(turns(page)).toHaveText("Turn 1");
	await page.keyboard.press("c");
	const character = page.getByRole("dialog", {
		name: "Character",
		exact: true,
	});
	const mana = character.getByRole("button", {
		name: "Mana potion, slot 3",
		exact: true,
	});
	await expect(mana).toHaveAccessibleDescription("2 carried");
	await mana.click();
	const bounds = await mana.boundingBox();
	await character
		.getByRole("button", { name: "Drink potion", exact: true })
		.press("Enter");
	await expect(turns(page)).toHaveText("Turn 2");
	await expect(mana).toHaveAttribute("aria-pressed", "true");
	expect(await mana.boundingBox()).toEqual(bounds);
	await character
		.getByRole("button", { name: "Drink potion", exact: true })
		.click();
	await expect(character.getByRole("alert")).toHaveText(
		"You are already at full mana.",
	);
	await expect(turns(page)).toHaveText("Turn 2");
	await character
		.getByRole("button", { name: "Drop item", exact: true })
		.click();
	await expect(turns(page)).toHaveText("Turn 3");
	await expect(
		character.getByRole("button", { name: "Drink potion", exact: true }),
	).toBeHidden();
	await expect(
		character.getByRole("button", {
			name: "Tower shield, slot 3",
			exact: true,
		}),
	).toBeVisible();
	await page.keyboard.press("Escape");
	await expect(map(page)).toBeFocused();
	await page.keyboard.press("g");
	await expect(turns(page)).toHaveText("Turn 4");
	await page.keyboard.press("c");
	await expect(
		character.getByRole("button", { name: "Mana potion, slot 4", exact: true }),
	).toHaveAttribute("aria-pressed", "false");
	await expect(
		character.getByRole("button", { name: "Drink potion", exact: true }),
	).toBeHidden();
});

test("welcome choices and keyboard Settings apply return control to the map", async ({
	page,
}) => {
	await expect(page.getByRole("radio", { name: /Medium/ })).toBeChecked();
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
		page.getByRole("button", { name: "Potion slot 1: empty", exact: true }),
	).toBeVisible();
	await expect(
		page.getByRole("button", { name: "Potion slot 2: empty", exact: true }),
	).toBeVisible();
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
}, testInfo) => {
	await importAdventure(page, "merchant");
	await expect(
		page.getByLabel("Player experience", { exact: true }),
	).toContainText("0 / 30 XP");
	await expect(
		page.getByRole("progressbar", { name: "Player experience progress" }),
	).toHaveAttribute("max", "30");
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
	await expect(previews.nth(0)).toContainText(
		"Spell damage bonus +1 → +2 (+1)",
	);
	await expect(previews.nth(0)).toContainText("Heal bonus +1 → +2 (+1)");
	await expect(previews.nth(1)).toContainText("Maximum mana 16 → 14 (−2)");
	await expect(previews.nth(1)).toContainText(
		"Spell damage bonus +1 → +2 (+1)",
	);
	await previews
		.nth(0)
		.getByText(/^Spell damage bonus/)
		.scrollIntoViewIfNeeded();
	await page.screenshot({
		path: testInfo.outputPath("merchant-spell-bonus.png"),
	});
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
	await character
		.getByRole("button", { name: "Ring of Intelligence, slot 1", exact: true })
		.click();
	const characterPreviews = character.getByLabel("Equipment comparison", {
		exact: true,
	});
	await expect(characterPreviews).toHaveCount(2);
	await expect(characterPreviews.nth(0)).toContainText(
		"Spell damage bonus +1 → +2 (+1)",
	);
	await expect(characterPreviews.nth(1)).toContainText(
		"Heal bonus +1 → +2 (+1)",
	);
	await expect(
		character.getByText(/Control, ongoing and movement effects/),
	).toBeVisible();
	await expect(turns(page)).toHaveText("Turn 0");
	await expect(
		character.getByLabel("Character mana", { exact: true }),
	).toContainText("3 / 16");
	await characterPreviews
		.nth(0)
		.getByText(/^Spell damage bonus/)
		.scrollIntoViewIfNeeded();
	await page.screenshot({
		path: testInfo.outputPath("character-spell-bonus.png"),
	});
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
		merchant.getByRole("tab", { name: "Sell", exact: true }),
	).toBeFocused();
});

test("merchant bounds and unsold positions stay stable, and repeated clicks cannot sell the next item", async ({
	page,
}, testInfo) => {
	await importAdventure(page, "merchant-many");
	await page.keyboard.press("e");
	await page.keyboard.press("s");
	const merchant = page.getByRole("dialog", {
		name: "Wandering potion merchant",
		exact: true,
	});
	const panel = merchant.getByRole("tabpanel", { name: "Sell", exact: true });
	const close = merchant.getByRole("button", { name: "Close", exact: true });
	const sales = merchant.getByRole("button", {
		name: "Short sword · Sell for 20 gold",
		exact: true,
	});
	const bounds = await merchant.boundingBox();
	const panelBounds = await panel.boundingBox();
	const closeBounds = await close.boundingBox();
	const first = await sales.nth(0).boundingBox();
	const second = await sales.nth(1).boundingBox();
	if (!first) throw new Error("Expected the first sale button");
	await sales.nth(0).click();
	await expect(turns(page)).toHaveText("Turn 1");
	expect(await sales.nth(0).boundingBox()).toEqual(second);
	await page.mouse.click(first.x + first.width / 2, first.y + first.height / 2);
	await expect(turns(page)).toHaveText("Turn 1");
	for (let turn = 2; turn <= 20; turn++) {
		await sales.nth(0).click();
		await expect(turns(page)).toHaveText(`Turn ${turn}`);
		expect(await merchant.boundingBox()).toEqual(bounds);
		expect(await panel.boundingBox()).toEqual(panelBounds);
		expect(await close.boundingBox()).toEqual(closeBounds);
	}
	await expect(
		merchant.getByText("No carried equipment to sell."),
	).toBeVisible();
	await expect(
		merchant.getByRole("tab", { name: "Sell", exact: true }),
	).toBeFocused();
	await page.screenshot({ path: testInfo.outputPath("merchant-empty.png") });
	await page.keyboard.press("Escape");
	await expect(map(page)).toBeFocused();
	await page.keyboard.press("e");
	await page.keyboard.press("s");
	await expect(merchant.getByText("Sold: Short sword")).toHaveCount(0);
	expect(await merchant.boundingBox()).toEqual(bounds);
});

test("bulk selling confirms only Lower gear and commits one turn without moving the merchant controls", async ({
	page,
}, testInfo) => {
	await importAdventure(page, "merchant-bulk");
	await page.keyboard.press("e");
	await page.keyboard.press("s");
	const merchant = page.getByRole("dialog", {
		name: "Wandering potion merchant",
		exact: true,
	});
	const bounds = await merchant.boundingBox();
	const close = merchant.getByRole("button", { name: "Close", exact: true });
	const closeBounds = await close.boundingBox();
	const bulk = merchant.getByRole("button", {
		name: "Sell all Lower items (2) · 45 gold",
		exact: true,
	});
	await bulk.press("Enter");
	await expect(
		merchant.getByRole("group", { name: "Confirm Lower equipment sale" }),
	).toBeFocused();
	await page.keyboard.press("Enter");
	await expect(turns(page)).toHaveText("Turn 0");
	await merchant
		.getByRole("button", { name: "Cancel bulk sale", exact: true })
		.click();
	await expect(turns(page)).toHaveText("Turn 0");
	await bulk.press("Enter");
	await page.keyboard.press("Tab");
	await expect(
		merchant.getByRole("button", { name: "Confirm bulk sale", exact: true }),
	).toBeFocused();
	await page.keyboard.press("Enter");
	await expect(turns(page)).toHaveText("Turn 1");
	await expect(merchant.getByText("Gold 745", { exact: true })).toBeVisible();
	await expect(
		merchant.getByRole("button", {
			name: "Sell all Lower items (0) · 0 gold",
			exact: true,
		}),
	).toBeDisabled();
	await expect(
		merchant.getByRole("button", {
			name: "Iron sword +1 · Sell for 25 gold",
			exact: true,
		}),
	).toHaveCount(1);
	await expect(
		merchant.getByRole("button", {
			name: "Short sword +3 · Sell for 35 gold",
			exact: true,
		}),
	).toHaveCount(1);
	await expect(
		merchant.getByRole("button", { name: /Scholar robe.*Sell for/ }),
	).toHaveCount(1);
	await expect(
		merchant.getByRole("button", { name: /Ring of Intelligence.*Sell for/ }),
	).toHaveCount(1);
	expect(await merchant.boundingBox()).toEqual(bounds);
	expect(await close.boundingBox()).toEqual(closeBounds);
	await page.keyboard.press("Enter");
	await expect(turns(page)).toHaveText("Turn 1");
	await page.screenshot({
		path: testInfo.outputPath("merchant-bulk-sold.png"),
	});
	await page.keyboard.press("Escape");
	await expect(map(page)).toBeFocused();
});
