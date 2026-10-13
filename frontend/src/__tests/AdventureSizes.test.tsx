import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "../App";
import AdventureOpening from "../components/game/AdventureOpening";
import { DEFAULT_RUN_CONFIGURATION } from "../domain/dungeon/RunConfiguration";
import { ThemeProvider } from "../settings/ThemeProvider";
import { resetHomeTestState, stubDungeonRun } from "./HomeTestHelpers";
import { createCorridorEncounter } from "./MonsterEncounterTestHelpers";

afterEach(resetHomeTestState);
describe("Welcome map-size choices", () => {
	it.each([
		["Small", 20],
		["Medium", 40],
		["Large", 60],
	] as const)(
		"applies %s dimensions without changing floors or difficulty",
		async (label, size) => {
			const begin = vi.fn();
			const user = userEvent.setup();
			render(
				<AdventureOpening
					onBegin={begin}
					onRestore={vi.fn()}
					initialConfiguration={{
						...DEFAULT_RUN_CONFIGURATION,
						floorCount: 7,
						difficulty: 0.75,
					}}
				/>,
				{ wrapper: ThemeProvider },
			);
			await user.click(screen.getByRole("radio", { name: new RegExp(label) }));
			expect(
				screen.getByLabelText("Selected adventure size"),
			).toHaveTextContent(`${size} × ${size} tiles · 7 floors`);
			expect(screen.getByRole("radio", { name: /Easier/ })).toBeChecked();
			await user.click(screen.getByRole("button", { name: "Begin Adventure" }));
			expect(begin).toHaveBeenCalledWith({
				...DEFAULT_RUN_CONFIGURATION,
				rows: size,
				cols: size,
				floorCount: 7,
				difficulty: 0.75,
			});
		},
	);
	it("does not label a rectangular custom configuration as a fixed preset", () => {
		render(
			<AdventureOpening
				onBegin={vi.fn()}
				onRestore={vi.fn()}
				initialConfiguration={{
					...DEFAULT_RUN_CONFIGURATION,
					rows: 25,
					cols: 35,
				}}
			/>,
			{ wrapper: ThemeProvider },
		);
		for (const label of ["Small", "Medium", "Large"])
			expect(
				screen.getByRole("radio", { name: new RegExp(label) }),
			).not.toBeChecked();
		expect(screen.getByLabelText("Selected adventure size")).toHaveTextContent(
			"25 × 35 tiles · 20 floors",
		);
	});
	it("uses keyboard size selection, keeps difficulty independent and begins the chosen configuration", async () => {
		const user = userEvent.setup();
		const { generate } = stubDungeonRun(createCorridorEncounter());
		render(<App />);
		expect(screen.getByRole("radio", { name: /Large/ })).toBeChecked();
		await user.click(screen.getByRole("radio", { name: /Small/ }));
		await user.keyboard("{ArrowRight}");
		expect(screen.getByRole("radio", { name: /Medium/ })).toBeChecked();
		await user.click(screen.getByRole("radio", { name: /Harder/ }));
		await user.keyboard("{Enter}");
		expect(generate).toHaveBeenCalledWith(
			expect.any(Number),
			20,
			expect.objectContaining({ rows: 40, cols: 40 }),
		);
		expect(screen.getByLabelText("Adventure difficulty")).toHaveTextContent(
			"Harder",
		);
		expect(screen.getByLabelText("Dungeon map", { exact: true })).toHaveFocus();
	});
});
