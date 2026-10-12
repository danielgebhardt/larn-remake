import type { DungeonObject } from "./DungeonObject";
import { shrineTerms } from "./DungeonShrines";
import type { ObjectChoice } from "./ObjectInteraction";
export type InteractionChoice = Readonly<{
	value: ObjectChoice;
	label: string;
	description: string;
}>;
export const objectChoices = (
	object: DungeonObject,
): readonly InteractionChoice[] =>
	object.kind === "shrine"
		? [
				{
					value: "offer",
					label: `Offer ${shrineTerms(object).gold} gold`,
					description: `Gain ${shrineTerms(object).experience} XP with normal automatic level growth. One turn; one offering per shrine. Gold is spent permanently.`,
				},
			]
		: object.kind === "throne"
			? [
					{
						value: "sit",
						label: "Sit on the throne",
						description:
							"40%: gain depth-scaled XP; 25%: restore up to 8 health/6 mana; 20%: take 2 damage and poison; 15%: relocate safely on this floor. One turn; spends the throne.",
					},
					{
						value: "pry",
						label: "Pry treasure",
						description:
							"70%: gain depth-scaled gold. Otherwise take 4–8 damage, potentially fatal. One turn; spends the throne.",
					},
				]
			: object.kind === "fountain"
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
