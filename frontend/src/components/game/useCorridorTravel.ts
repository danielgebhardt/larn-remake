import { type RefObject, useEffect, useMemo, useRef, useState } from "react";
import type { MovementDirection } from "../../domain/dungeon/DungeonRun";
import type { ExplorationState } from "../../domain/dungeon/Exploration";
import {
	CORRIDOR_STOP_TEXT,
	type CorridorView,
	corridorStep,
	corridorStopAfterStep,
	corridorView,
} from "../../domain/game/CorridorTravel";
import type { GameState } from "../../domain/game/GameState";

// Visible, interruptible steps; changing this never changes the turn economy.
export const CORRIDOR_STEP_MS = 120;
type Travel =
	| { mode: "idle" | "choosing" }
	| {
			mode: "running";
			direction: MovementDirection;
			previous?: { row: number; col: number };
			before?: CorridorView;
	  };
const directions: Record<string, MovementDirection> = {
	ArrowUp: "up",
	ArrowDown: "down",
	ArrowLeft: "left",
	ArrowRight: "right",
	w: "up",
	s: "down",
	a: "left",
	d: "right",
};
export const useCorridorTravel = ({
	state,
	exploration,
	fogEnabled,
	enabled,
	mapRef,
	onStep,
}: {
	state: GameState;
	exploration: ExplorationState;
	fogEnabled: boolean;
	enabled: boolean;
	mapRef: RefObject<HTMLElement | null>;
	onStep: (direction: MovementDirection) => void;
}) => {
	const [travel, setTravel] = useState<Travel>({ mode: "idle" });
	const current = useRef(travel);
	const [description, setDescription] = useState("");
	const view = useMemo(
		() =>
			travel.mode === "running"
				? corridorView(state, exploration, fogEnabled)
				: undefined,
		[state, exploration, fogEnabled, travel.mode],
	);
	const change = (next: Travel) => {
		current.current = next;
		setTravel(next);
	};
	const cancel = (message = "Corridor run canceled.") => {
		if (current.current.mode === "idle") return;
		change({ mode: "idle" });
		setDescription(message);
	};
	useEffect(() => {
		const stop = () => {
			if (current.current.mode !== "idle") {
				current.current = { mode: "idle" };
				setTravel(current.current);
				setDescription("Corridor run canceled.");
			}
		};
		const focus = (event: FocusEvent) => {
			if (event.target !== mapRef.current) stop();
		};
		const visibility = () => {
			if (document.hidden) stop();
		};
		document.addEventListener("pointerdown", stop, true);
		document.addEventListener("focusin", focus, true);
		window.addEventListener("blur", stop);
		document.addEventListener("visibilitychange", visibility);
		return () => {
			current.current = { mode: "idle" };
			document.removeEventListener("pointerdown", stop, true);
			document.removeEventListener("focusin", focus, true);
			window.removeEventListener("blur", stop);
			document.removeEventListener("visibilitychange", visibility);
		};
	}, [mapRef]);
	useEffect(() => {
		if (!enabled) {
			if (current.current.mode !== "idle") {
				current.current = { mode: "idle" };
				setTravel(current.current);
				setDescription("Corridor run canceled.");
			}
			return;
		}
		if (travel.mode !== "running" || !view) return;
		const after = travel.before
			? (corridorStopAfterStep(travel.before, view) ??
				(view.turn <= travel.before.turn ? "blocked" : undefined))
			: undefined;
		const decision = after
			? { stop: after }
			: corridorStep(view, travel.direction, travel.previous);
		if ("stop" in decision) {
			current.current = { mode: "idle" };
			setTravel(current.current);
			setDescription(
				`Corridor run stopped: ${CORRIDOR_STOP_TEXT[decision.stop]}`,
			);
			return;
		}
		const timer = window.setTimeout(() => {
			if (
				current.current !== travel ||
				document.hidden ||
				document.activeElement !== mapRef.current
			)
				return;
			const next: Travel = {
				mode: "running",
				direction: decision.direction,
				previous: view.position,
				before: view,
			};
			current.current = next;
			setTravel(next);
			onStep(decision.direction);
		}, CORRIDOR_STEP_MS);
		return () => window.clearTimeout(timer);
	}, [enabled, travel, view, mapRef, onStep]);
	const handleKey = (event: KeyboardEvent): boolean => {
		const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
		if (key === "r") {
			if (event.repeat) return true;
			mapRef.current?.focus({ preventScroll: true });
			change({ mode: "choosing" });
			setDescription("Choose a direction (Arrow/WASD). Escape cancels.");
			return true;
		}
		if (key === "Escape" && current.current.mode !== "idle") {
			cancel();
			return true;
		}
		if (current.current.mode === "choosing" && directions[key]) {
			if (!event.repeat) {
				change({ mode: "running", direction: directions[key] });
				setDescription("Running corridor. Escape stops.");
			}
			return true;
		}
		if (event.repeat && current.current.mode !== "idle") return true;
		cancel();
		return false;
	};
	return { description, handleKey };
};
