import {
	FlaskRound,
	HardHat,
	type LucideIcon,
	Shield,
	Shirt,
	Sword,
} from "lucide-react";
import type { ItemKind } from "../../domain/items/Item";

const icons: Record<ItemKind, LucideIcon> = {
	"healing-potion": FlaskRound,
	"short-sword": Sword,
	"iron-sword": Sword,
	"wooden-shield": Shield,
	"leather-armor": Shirt,
	"chain-armor": Shirt,
	"leather-cap": HardHat,
	"iron-helmet": HardHat,
};
const ItemIcon = ({ kind }: { kind: ItemKind }) => {
	const Icon = icons[kind];
	return (
		<Icon
			aria-hidden="true"
			focusable="false"
			className={`size-full ${kind === "healing-potion" ? "text-item-potion" : "text-item-gear"}`}
		/>
	);
};
export default ItemIcon;
