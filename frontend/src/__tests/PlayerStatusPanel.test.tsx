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
		expect(screen.queryByText("Low health")).not.toBeInTheDocument();
		view.rerender(
			<PlayerStatus {...props} player={{ health: 0, maxHealth: 20 }} />,
		);
		expect(
			screen.getByRole("meter", { name: "Health reserve" }),
		).toHaveAttribute("value", "0");
		expect(screen.getByRole("alert")).toHaveTextContent("You died");
	});
});

describe("HUD experience progress", () => {
	it.each([
		[0, 1, 0, 10],
		[14, 2, 4, 20],
		[35, 3, 5, 30],
		[3420, 19, 100, 380],
	])(
		"shows within-level progress for %i total XP",
		(experience, level, earned, needed) => {
			render(<PlayerStatus {...props} progression={{ experience }} />);
			expect(screen.getByLabelText("Player level")).toHaveTextContent(
				`Level ${level}`,
			);
			expect(screen.getByLabelText("Player experience")).toHaveTextContent(
				`${earned} / ${needed} XP`,
			);
			expect(screen.getByLabelText("Player experience")).not.toHaveTextContent(
				"this level",
			);
			expect(
				screen.getByRole("progressbar", { name: "Player experience progress" }),
			).toHaveAttribute("value", String(earned));
			expect(
				screen.getByRole("progressbar", { name: "Player experience progress" }),
			).toHaveAttribute("max", String(needed));
		},
	);
	it("recomputes after several levels of XP arrive, then resets with a new run", () => {
		const view = render(
			<PlayerStatus {...props} progression={{ experience: 9 }} />,
		);
		view.rerender(<PlayerStatus {...props} progression={{ experience: 65 }} />);
		expect(screen.getByLabelText("Player level")).toHaveTextContent("Level 4");
		expect(screen.getByLabelText("Player experience")).toHaveTextContent(
			"5 / 40 XP",
		);
		view.rerender(<PlayerStatus {...props} progression={{ experience: 0 }} />);
		expect(screen.getByLabelText("Player level")).toHaveTextContent("Level 1");
		expect(screen.getByLabelText("Player experience")).toHaveTextContent(
			"0 / 10 XP",
		);
	});
	it.each([3700, 3800])(
		"retains %i total XP at the cap without a next-level bar",
		(experience) => {
			render(<PlayerStatus {...props} progression={{ experience }} />);
			expect(screen.getByLabelText("Player level")).toHaveTextContent(
				"Level 20",
			);
			expect(screen.getByText("Maximum level reached")).toBeVisible();
			expect(screen.getByLabelText("Player experience")).toHaveTextContent(
				`${experience} XP total`,
			);
			expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
		},
	);
});
