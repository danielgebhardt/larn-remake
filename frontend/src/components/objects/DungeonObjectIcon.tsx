import { Coins, DoorClosed, DoorOpen, type LucideIcon } from "lucide-react";
import type {
	DungeonObject,
	DungeonObjectKind,
} from "../../domain/objects/DungeonObject";

const icons: Record<DungeonObjectKind, LucideIcon> = {
	door: DoorClosed,
	gold: Coins,
};
const DungeonObjectIcon = ({ object }: { object: DungeonObject }) => {
	const Icon =
		object.kind === "door" && object.activated ? DoorOpen : icons[object.kind];
	return (
		<Icon
			aria-hidden="true"
			focusable="false"
			className={`size-full ${object.kind === "gold" ? "text-item-equipment" : "text-object-stone"}`}
		/>
	);
};
export default DungeonObjectIcon;
