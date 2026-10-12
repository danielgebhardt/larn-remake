import {
	BookOpen,
	Circle,
	FlaskConical,
	FlaskRound,
	Gem,
	HardHat,
	type LucideIcon,
	Shield,
	Shirt,
	Sword,
} from "lucide-react";
import { ITEM_DEFINITIONS, type ItemKind } from "../../domain/items/Item";

type BookKind = Extract<ItemKind, `book-${string}`>;
const isBookKind = (kind: ItemKind): kind is BookKind =>
	ITEM_DEFINITIONS[kind].type === "spellbook";
const icons: Record<Exclude<ItemKind, BookKind>, LucideIcon> = {
	cure: Gem,
	"copper-ring": Circle,
	"healing-potion": FlaskRound,
	"mana-potion": FlaskConical,
	"short-sword": Sword,
	"iron-sword": Sword,
	"wooden-shield": Shield,
	"leather-armor": Shirt,
	"chain-armor": Shirt,
	"leather-cap": HardHat,
	"iron-helmet": HardHat,
};
const ItemIcon = ({ kind }: { kind: ItemKind }) => {
	const Icon = isBookKind(kind) ? BookOpen : icons[kind];
	return (
		<Icon
			aria-hidden="true"
			focusable="false"
			className={`size-full ${kind.startsWith("book-") ? "text-violet-700 dark:text-violet-300" : kind === "cure" ? "text-item-cure" : kind === "healing-potion" ? "text-item-potion" : kind === "mana-potion" ? "text-item-mana" : "text-item-gear"}`}
		/>
	);
};
export default ItemIcon;
