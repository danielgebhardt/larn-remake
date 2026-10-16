import { act, fireEvent, render, screen } from "@testing-library/react";
import { useMemo, useRef, useState } from "react";
import { afterEach, expect, it, vi } from "vitest";
import { useDungeonKeyboard } from "../components/dungeon/useDungeonKeyboard";
import {
	CORRIDOR_STEP_MS,
	useCorridorTravel,
} from "../components/game/useCorridorTravel";
import { updateExploration } from "../domain/dungeon/Exploration";
import { resolvePlayerAction } from "../domain/game/PlayerActions";
import { quietCorridor } from "./CorridorTravelTestHelpers";

const Harness = ({ enabled = true }: { enabled?: boolean }) => {
	const [state, setState] = useState(quietCorridor);
	const map = useRef<HTMLElement>(null);
	const exploration = useMemo(() => updateExploration(state.run, 4), [state]);
	const move = (direction: "up" | "down" | "left" | "right") =>
		setState(
			(current) =>
				resolvePlayerAction(current, { type: "move", direction }).state,
		);
	const travel = useCorridorTravel({
		state,
		exploration,
		fogEnabled: false,
		enabled,
		mapRef: map,
		onStep: move,
	});
	useDungeonKeyboard({
		onMoveRequested: move,
		onCorridorKey: travel.handleKey,
		movementEnabled: enabled,
		onSpellRequested: () => {},
		onCharacterRequested: () => {},
		onPotionRequested: () => {},
		onWaitRequested: () => {},
		onPickupRequested: () => {},
		onInteractRequested: () => {},
	});
	return (
		<>
			<section ref={map} aria-label="Map" tabIndex={-1} />
			<output aria-label="Turns">{state.turn}</output>
			<output aria-label="Position">{state.run.playerCoordinate.col}</output>
			<p role="status" aria-label="Travel">
				{travel.description}
			</p>
			<button type="button">Menu</button>
		</>
	);
};
const key = (key: string, repeat = false) =>
	fireEvent.keyDown(screen.getByLabelText("Map"), { key, repeat });
const tick = () => act(() => vi.advanceTimersByTime(CORRIDOR_STEP_MS));
const begin = () => {
	key("r");
	key("ArrowRight");
};
afterEach(() => vi.useRealTimers());
it("R direction selection is free; bounded steps use normal turns and Escape cancels queued work", () => {
	vi.useFakeTimers();
	render(<Harness />);
	screen.getByLabelText("Map").focus();
	key("r");
	expect(screen.getByRole("status", { name: "Travel" })).toHaveTextContent(
		"Choose a direction",
	);
	expect(screen.getByLabelText("Turns")).toHaveTextContent("0");
	key("Escape");
	tick();
	expect(screen.getByLabelText("Turns")).toHaveTextContent("0");
	begin();
	key("r", true);
	tick();
	expect(screen.getByLabelText("Turns")).toHaveTextContent("1");
	tick();
	expect(screen.getByLabelText("Turns")).toHaveTextContent("2");
	key("Escape");
	tick();
	tick();
	expect(screen.getByLabelText("Turns")).toHaveTextContent("2");
	expect(screen.getByRole("status", { name: "Travel" })).toHaveTextContent(
		"canceled",
	);
});
it("a manual move cancels first, performs just that ordinary action and does not restart", () => {
	vi.useFakeTimers();
	render(<Harness />);
	screen.getByLabelText("Map").focus();
	begin();
	tick();
	key("a");
	tick();
	tick();
	expect(screen.getByLabelText("Turns")).toHaveTextContent("2");
	expect(screen.getByLabelText("Position")).toHaveTextContent("4");
});
it.each(["focus", "pointer", "blur", "disabled"])(
	"%s loss cancels without resuming",
	(kind) => {
		vi.useFakeTimers();
		const { rerender } = render(<Harness />);
		screen.getByLabelText("Map").focus();
		begin();
		tick();
		if (kind === "focus") screen.getByRole("button", { name: "Menu" }).focus();
		if (kind === "pointer")
			fireEvent.pointerDown(screen.getByRole("button", { name: "Menu" }));
		if (kind === "blur") fireEvent(window, new Event("blur"));
		if (kind === "disabled") rerender(<Harness enabled={false} />);
		tick();
		rerender(<Harness enabled />);
		screen.getByLabelText("Map").focus();
		tick();
		expect(screen.getByLabelText("Turns")).toHaveTextContent("1");
	},
);
it("a denied direction spends no turn and repeated starts never schedule duplicate runs", () => {
	vi.useFakeTimers();
	render(<Harness />);
	screen.getByLabelText("Map").focus();
	key("r");
	key("ArrowUp");
	tick();
	expect(screen.getByLabelText("Turns")).toHaveTextContent("0");
	expect(screen.getByRole("status", { name: "Travel" })).toHaveTextContent(
		"blocked",
	);
	begin();
	begin();
	tick();
	expect(screen.getByLabelText("Turns")).toHaveTextContent("1");
});

it.each(["h", "c", "1", " ", "e", "g"])(
	"manual %s cancels before its normal keyboard handler",
	(command) => {
		vi.useFakeTimers();
		render(<Harness />);
		screen.getByLabelText("Map").focus();
		begin();
		tick();
		key(command);
		tick();
		tick();
		expect(screen.getByLabelText("Turns")).toHaveTextContent("1");
	},
);
it("becoming hidden cancels and becoming visible does not resume", () => {
	vi.useFakeTimers();
	render(<Harness />);
	screen.getByLabelText("Map").focus();
	begin();
	tick();
	const hidden = vi.spyOn(document, "hidden", "get").mockReturnValue(true);
	fireEvent(document, new Event("visibilitychange"));
	tick();
	hidden.mockReturnValue(false);
	fireEvent(document, new Event("visibilitychange"));
	tick();
	expect(screen.getByLabelText("Turns")).toHaveTextContent("1");
	hidden.mockRestore();
});
