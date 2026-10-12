import {
	Archive,
	ArchiveX,
	Armchair,
	Coins,
	DoorClosed,
	DoorOpen,
	Droplets,
	Landmark,
	type LucideIcon,
	TriangleAlert,
} from "lucide-react";
import type {
	DungeonObject,
	DungeonObjectKind,
} from "../../domain/objects/DungeonObject";

const icons: Record<DungeonObjectKind, LucideIcon> = {
	door: DoorClosed,
	gold: Coins,
	chest: Archive,
	trap: TriangleAlert,
	fountain: Droplets,
	throne: Armchair,
	shrine: Landmark,
};
const DungeonObjectIcon = ({ object }: { object: DungeonObject }) => {
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
