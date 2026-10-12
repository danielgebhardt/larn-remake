import type { DungeonObject } from "./DungeonObject";
import type { ObjectChoice } from "./ObjectInteraction";
export type InteractionChoice = Readonly<{
	value: ObjectChoice;
	label: string;
	description: string;
}>;
export const objectChoices = (
	object: DungeonObject,
): readonly InteractionChoice[] =>
	object.kind === "fountain"
		? [
				{
					value: "sip",
					label: "Safe sip",
					description:
						"Recover up to 3 health and 2 mana. One turn; empties the fountain.",
				},
				{
					value: "draw",
					label: "Risky draw",
					description:
						"60%: recover up to 8 health and 6 mana. Otherwise take 3 damage and poison for 3 turns. One turn; empties the fountain.",
				},
			]
		: [];
