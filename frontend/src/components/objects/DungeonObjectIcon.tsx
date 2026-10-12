import {
	Archive,
	Coins,
	DoorClosed,
	DoorOpen,
	Droplets,
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
};
const DungeonObjectIcon = ({ object }: { object: DungeonObject }) => {
	const Icon =
		object.kind === "door" && object.activated ? DoorOpen : icons[object.kind];
	return (
		<Icon
			aria-hidden="true"
			focusable="false"
			className={`size-full ${object.kind === "trap" ? "text-destructive" : object.kind === "gold" ? "text-item-equipment" : "text-object-stone"}`}
		/>
	);
};
export default DungeonObjectIcon;
