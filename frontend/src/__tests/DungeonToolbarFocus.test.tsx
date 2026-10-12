import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import DungeonLayout from "../components/dungeon/DungeonLayout";
import { FLOOR } from "../domain/dungeon/Tiles";

it.each(["ArrowRight", "w", "g", "h", "z", " ", "1", "i"])(
	"leaves %s to the focused toolbar control without playing a turn",
	(key) => {
		const move = vi.fn();
		const action = vi.fn();
		render(
			<>
				<button type="button">Settings</button>
				<DungeonLayout
					dungeon={[[FLOOR, FLOOR]]}
					playerPosition={{ row: 0, col: 0 }}
					onMoveRequested={move}
					onWaitRequested={action}
					onPickupRequested={action}
					onSpellRequested={action}
					onPotionRequested={action}
					onCharacterRequested={action}
				/>
			</>,
		);
		const settings = screen.getByRole("button", { name: "Settings" });
		settings.focus();
		fireEvent.keyDown(settings, { key });
		expect(move).not.toHaveBeenCalled();
		expect(action).not.toHaveBeenCalled();
	},
);
