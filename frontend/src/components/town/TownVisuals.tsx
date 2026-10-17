import {
	Anvil,
	Archive,
	BookOpen,
	Cross,
	FlaskConical,
	Landmark,
	MapPin,
	ScrollText,
	Shield,
	Swords,
} from "lucide-react";

const ICONS: Record<string, typeof MapPin> = {
	library: BookOpen,
	sanctuary: Cross,
	storage: Archive,
	forge: Anvil,
	potions: FlaskConical,
	armor: Shield,
	weapons: Swords,
	scrolls: ScrollText,
	"vault-plot": Landmark,
	"expansion-plot": MapPin,
};
export const TownBuildingIcon = ({
	id,
	className = "size-4",
}: {
	id: string;
	className?: string;
}) => {
	const Icon = ICONS[id] ?? MapPin;
	return <Icon aria-hidden="true" className={className} />;
};
