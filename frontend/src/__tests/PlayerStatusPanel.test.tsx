import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import PlayerStatus from "../components/game/PlayerStatus";
import { experienceThreshold } from "../domain/game/Progression";

const props = {
	player: { health: 10, maxHealth: 20 },
	mana: 2,
	gold: 487,
	turn: 1218,
	progression: { experience: experienceThreshold(6) },
};
describe("Player status panel", () => {
	it("shows resource reserves alongside live gold level and turn values", () => {
		render(<PlayerStatus {...props} />);
		expect(screen.getByLabelText("Player health")).toHaveTextContent(
			"Health 10 / 20",
		);
		expect(
			screen.getByRole("meter", { name: "Health reserve" }),
		).toHaveAttribute("value", "10");
		expect(
			screen.getByRole("meter", { name: "Health reserve" }),
		).toHaveAttribute("max", "20");
		expect(screen.getByRole("meter", { name: "Mana reserve" })).toHaveAttribute(
			"value",
			"2",
		);
		expect(screen.getByRole("meter", { name: "Mana reserve" })).toHaveAttribute(
			"max",
			"14",
		);
		expect(screen.getByLabelText("Player gold")).toHaveTextContent("Gold 487");
		expect(screen.getByLabelText("Player level")).toHaveTextContent("Level 6");
		expect(screen.getByLabelText("Turn count")).toHaveTextContent("Turn 1218");
		expect(screen.queryByText("Low health")).not.toBeInTheDocument();
	});
	it("updates reserves and retains low-health and death feedback", () => {
		const view = render(<PlayerStatus {...props} />);
		view.rerender(
			<PlayerStatus
				{...props}
				player={{ health: 5, maxHealth: 20 }}
				mana={3}
				turn={1219}
			/>,
		);
		expect(
			screen.getByRole("meter", { name: "Health reserve" }),
		).toHaveAttribute("value", "5");
		expect(screen.getByRole("meter", { name: "Mana reserve" })).toHaveAttribute(
			"value",
			"3",
		);
		expect(screen.getByText("Low health")).toBeVisible();
		view.rerender(
			<PlayerStatus {...props} player={{ health: 0, maxHealth: 20 }} />,
		);
		expect(
			screen.getByRole("meter", { name: "Health reserve" }),
		).toHaveAttribute("value", "0");
		expect(screen.getByRole("alert")).toHaveTextContent("You died");
	});
});
