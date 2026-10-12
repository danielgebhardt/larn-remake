import type { VisibilityGrid } from "../../domain/dungeon/Visibility";
import type { GameState } from "../../domain/game/GameState";
import { orthogonalDistance } from "../../domain/monsters/MonsterLocations";
import { describeObject } from "../../domain/objects/ObjectDescriptions";
import DungeonObjectIcon from "./DungeonObjectIcon";

const ObjectContext = ({
	state,
	visible,
}: {
	state: GameState;
	visible?: VisibilityGrid;
}) => {
	const nearby = state.objects.filter(
		(object) =>
			object.floorNumber === state.run.activeFloor &&
			!(object.kind === "gold" && object.activated) &&
			orthogonalDistance(object.coordinate, state.run.playerCoordinate) <= 1 &&
			(!visible || visible[object.coordinate.row]?.[object.coordinate.col]),
	);
	if (!nearby.length) return null;
	return (
		<section
			aria-label="Nearby objects"
			className="max-h-24 overflow-y-auto py-2 text-xs text-muted-foreground"
		>
			<ul className="grid gap-1">
				{nearby.map((object) => (
					<li key={object.id} className="flex items-start gap-2">
						<span className="size-4 shrink-0">
							<DungeonObjectIcon object={object} />
						</span>
						<span>
							<strong className="font-medium text-foreground">
								{orthogonalDistance(
									object.coordinate,
									state.run.playerCoordinate,
								) === 0
									? "Here: "
									: "Nearby: "}
							</strong>
							{describeObject(object)}
						</span>
					</li>
				))}
			</ul>
		</section>
	);
};
export default ObjectContext;
