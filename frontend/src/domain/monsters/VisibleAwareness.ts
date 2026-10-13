import type { VisibilityGrid } from "../dungeon/Visibility";
import type { ActivityEvent } from "../game/ActivityHistory";
import {
	type ActivityHistory,
	appendActivityEvents,
} from "../game/ActivityHistory";
import type { Monster } from "./Monster";

// Project only what the player can currently observe; hidden transitions never enter history.
export const visibleAwarenessEvents = (
	before: readonly Monster[],
	after: readonly Monster[],
	floor: number,
	turn: number,
	visible: VisibilityGrid | undefined,
): ActivityEvent[] => {
	const previous = new Map(before.map((actor) => [actor.id, actor]));
	return after.flatMap((actor) => {
		if (
			actor.health <= 0 ||
			actor.floorNumber !== floor ||
			(visible && !visible[actor.coordinate.row]?.[actor.coordinate.col])
		)
			return [];
		const awareness = actor.awareness?.type ?? "idle";
		const old = previous.get(actor.id)?.awareness?.type ?? "idle";
		return awareness === old
			? []
			: [
					{
						type: "monster-awareness-changed" as const,
						monster: actor.kind,
						awareness,
						turn,
					},
				];
	});
};

// Keep older visible messages; project only new non-damaging charge telegraphs.
export const visibleThreatHistory = (
	previous: ActivityHistory,
	history: ActivityHistory,
	actors: readonly Monster[],
	floor: number,
	visible: VisibilityGrid | undefined,
): ActivityHistory => {
	if (!visible) return history;
	const newEntries = history.entries.filter(
		(entry) => entry.id >= previous.nextId,
	);
	const retained = newEntries.filter(({ event }) => {
		if (
			event.type !== "monster-door-opened" &&
			event.type !== "monster-charge-prepared" &&
			event.type !== "monster-charge-ended" &&
			event.type !== "monster-alarm-prepared" &&
			event.type !== "monster-alarm-sounded"
		)
			return true;
		const actor = actors.find(
			(actor) => actor.id === event.actorId && actor.floorNumber === floor,
		);
		return (
			actor !== undefined &&
			visible[actor.coordinate.row]?.[actor.coordinate.col]
		);
	});
	return retained.length === newEntries.length
		? history
		: appendActivityEvents(
				previous,
				retained.map((entry) => entry.event),
			);
};
