export const DAMAGE_ELEMENTS = [
	"physical",
	"arcane",
	"fire",
	"cold",
	"lightning",
	"poison",
	"sonic",
	"shadow",
] as const;
export type DamageElement = (typeof DAMAGE_ELEMENTS)[number];
export type AreaElement = "fire" | "cold";
