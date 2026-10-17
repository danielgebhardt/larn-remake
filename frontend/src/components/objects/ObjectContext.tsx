import type { VisibilityGrid } from "../../domain/dungeon/Visibility";
import type { GameState } from "../../domain/game/GameState";
import { objectAvailable } from "../../domain/merchant/MerchantAvailability";
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
			objectAvailable(object) &&
			!(object.kind === "gold" && object.activated) &&
			orthogonalDistance(object.coordinate, state.run.playerCoordinate) <= 1 &&
			(!visible || visible[object.coordinate.row]?.[object.coordinate.col]),
	);
	return (
		<div className="h-16 shrink-0 lg:h-12">
			{nearby.length > 0 && (
				<section
					aria-label="Nearby objects"
					// biome-ignore lint/a11y/noNoninteractiveTabindex: Keyboard users need to scroll longer interaction hints.
					tabIndex={0}
					className="h-full overflow-y-auto py-2 text-xs text-muted-foreground focus-visible:outline-1 focus-visible:-outline-offset-1 focus-visible:outline-ring"
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
			)}
		</div>
	);
};
export default ObjectContext;
