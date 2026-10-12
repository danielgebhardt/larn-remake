import {
	Axe,
	BookOpen,
	Circle,
	Crown,
	FlaskConical,
	FlaskRound,
	Gem,
	HardHat,
	Layers,
	type LucideIcon,
	Shield,
	ShieldCheck,
	ShieldHalf,
	Shirt,
	Sword,
	Swords,
} from "lucide-react";
import { ITEM_DEFINITIONS, type ItemKind } from "../../domain/items/Item";

type BookKind = Extract<ItemKind, `book-${string}`>;
const isBookKind = (kind: ItemKind): kind is BookKind =>
	ITEM_DEFINITIONS[kind].type === "spellbook";
const icons: Record<Exclude<ItemKind, BookKind>, LucideIcon> = {
	cure: Gem,
	"copper-ring": Circle,
	"ring-strength": Circle,
	"ring-dexterity": Circle,
	"ring-intelligence": Circle,
	"ring-vitality": Circle,
	"ring-mana": Circle,
	"healing-potion": FlaskRound,
	"mana-potion": FlaskConical,
	"short-sword": Sword,
	"iron-sword": Sword,
	"steel-sword": Sword,
	"battle-axe": Axe,
	runeblade: Swords,
	"star-forged-blade": Swords,
	"wooden-shield": Shield,
	"leather-armor": Shirt,
	"chain-armor": Shirt,
	"leather-cap": HardHat,
	"iron-helmet": HardHat,
	"iron-shield": ShieldCheck,
	"tower-shield": ShieldHalf,
	"plate-armor": Shirt,
	"dragon-mail": Layers,
	"steel-helmet": HardHat,
	"runic-helmet": Crown,
	"scholar-robe": Shirt,
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
