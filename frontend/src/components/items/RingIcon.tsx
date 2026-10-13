import { Heart } from "lucide-react";
import type { ItemKind } from "../../domain/items/Item";

const statLetters: Partial<Record<ItemKind, string>> = {
	"ring-strength": "S",
	"ring-dexterity": "D",
	"ring-intelligence": "I",
};
const RingIcon = ({ kind }: { kind: ItemKind }) => (
	<svg
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="1.8"
		strokeLinecap="round"
		strokeLinejoin="round"
		aria-hidden="true"
		focusable="false"
		className="size-full text-item-gear"
	>
		{kind === "relic-band" ? (
			<path d="m12 2 4 4-4 4-4-4ZM8 8a7 7 0 1 0 8 0M8 12a5 5 0 1 0 8 0M12 2v8" />
		) : (
			<circle cx="12" cy="12" r="9" />
		)}
		{statLetters[kind] && (
			<text
				x="12"
				y="13"
				textAnchor="middle"
				dominantBaseline="middle"
				fontFamily="sans-serif"
				fontSize="10"
				fontWeight="700"
				fill="currentColor"
				stroke="none"
			>
				{statLetters[kind]}
			</text>
		)}
		{kind === "ring-vitality" && (
			<Heart
				x="6"
				y="6"
				width="12"
				height="12"
				className="text-item-potion"
				fill="currentColor"
				strokeWidth="1.5"
			/>
		)}
		{kind === "ring-mana" && (
			<path
				className="text-item-mana"
				d="M10 7h4v4l2 2v4H8v-4l2-2ZM8 14h8"
				fill="currentColor"
				fillOpacity=".15"
			/>
		)}
	</svg>
);
export default RingIcon;
