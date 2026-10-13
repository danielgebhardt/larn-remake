import {
	Archive,
	ArchiveX,
	Armchair,
	Coins,
	DoorClosed,
	DoorOpen,
	Droplets,
	Gem,
	Landmark,
	LibraryBig,
	type LucideIcon,
	Skull,
	Store,
	TriangleAlert,
} from "lucide-react";
import type {
	DungeonObject,
	DungeonObjectKind,
} from "../../domain/objects/DungeonObject";

const icons: Record<Exclude<DungeonObjectKind, "elite-door">, LucideIcon> = {
	merchant: Store,
	door: DoorClosed,
	reliquary: Gem,
	archive: LibraryBig,
	gold: Coins,
	chest: Archive,
	trap: TriangleAlert,
	fountain: Droplets,
	throne: Armchair,
	shrine: Landmark,
};
const DungeonObjectIcon = ({ object }: { object: DungeonObject }) => {
	if (object.kind === "elite-door") {
		const Gate = object.activated ? DoorOpen : DoorClosed;
		return (
			<span className="relative block size-full text-map-threat">
				<Gate aria-hidden="true" className="size-full" />
				<Skull
					aria-hidden="true"
					className="absolute left-1/4 top-1/4 size-1/2"
				/>
			</span>
		);
	}
	const Icon =
		object.kind === "door" && object.activated
			? DoorOpen
			: object.kind === "chest" && object.activated
				? ArchiveX
				: icons[object.kind];
	return (
		<Icon
			aria-hidden="true"
			focusable="false"
			className={`size-full ${object.activated && object.kind !== "door" ? "opacity-50" : ""} ${object.kind === "trap" ? "text-destructive" : object.kind === "gold" ? "text-item-equipment" : "text-object-stone"}`}
		/>
	);
};
export default DungeonObjectIcon;
