import { type LucideIcon, Shield, Sword } from "lucide-react";
import type { ItemKind } from "../../domain/items/Item";

const icons: Record<ItemKind, LucideIcon> = {
	"short-sword": Sword,
	"iron-sword": Sword,
	"wooden-shield": Shield,
};
const ItemIcon = ({ kind }: { kind: ItemKind }) => {
	const Icon = icons[kind];
	return (
		<Icon
			aria-hidden="true"
			focusable="false"
			className="size-full text-stairs"
		/>
	);
};
export default ItemIcon;
