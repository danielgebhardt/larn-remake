export const ITEM_DEFINITIONS = {
	"short-sword": {
		name: "Short sword",
		type: "weapon",
		description: "A simple, dependable blade for exploring the dungeon.",
	},
	"wooden-shield": {
		name: "Wooden shield",
		type: "shield",
		description: "A small wooden shield carried in your off hand.",
	},
} as const;

export type ItemKind = keyof typeof ITEM_DEFINITIONS;

// Kind identifies the shared definition; id identifies this particular copy.
export type ItemInstance = Readonly<{ id: string; kind: ItemKind }>;
