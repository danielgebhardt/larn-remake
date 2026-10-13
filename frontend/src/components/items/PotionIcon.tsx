import type { PotionKind } from "../../domain/items/PotionHotbar";

const bottles = {
	health: {
		color: "text-item-potion",
		path: "M9 3h6v5a7 7 0 1 1-6 0V3Z",
		liquid: "M6 15h12",
	},
	mana: {
		color: "text-item-mana",
		path: "M10 2h4v6l3 3v9a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1v-9l3-3V2Z",
		liquid: "M7 15h10",
	},
	antidote: {
		color: "text-item-antidote",
		path: "M10 3h4v6l6 10a1.3 1.3 0 0 1-1 2H5a1.3 1.3 0 0 1-1-2l6-10V3Z",
		liquid: "M7 16h10",
	},
} as const;
const families: Record<PotionKind, keyof typeof bottles> = {
	"healing-potion": "health",
	"greater-healing-potion": "health",
	"mana-potion": "mana",
	"greater-mana-potion": "mana",
	antidote: "antidote",
};

const PotionIcon = ({ kind }: { kind: PotionKind }) => {
	const bottle = bottles[families[kind]];
	return (
		<svg
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.75"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
			focusable="false"
			className={`size-full ${bottle.color}`}
		>
			<path d={bottle.path} />
			<path d={bottle.liquid} />
			{kind.startsWith("greater-") && (
				<path data-strength="greater" d="M20 2v6m-3-3h6" strokeWidth="2.25" />
			)}
		</svg>
	);
};
export default PotionIcon;
