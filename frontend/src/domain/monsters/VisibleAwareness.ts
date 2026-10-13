import type { VisibilityGrid } from "../dungeon/Visibility";
import type { ActivityEvent } from "../game/ActivityHistory";
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
