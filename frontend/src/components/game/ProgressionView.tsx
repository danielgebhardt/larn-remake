import { Brain, Sparkles, Sword, Zap } from "lucide-react";
import { deriveAttributes } from "../../domain/game/Attributes";
import {
	HEALTH_PER_LEVEL,
	MAX_PLAYER_LEVEL,
	type Progression,
	progressionProgress,
} from "../../domain/game/Progression";
import type { TimedEffect } from "../../domain/game/TimedEffects";
import type { Equipment } from "../../domain/items/Equipment";
import { equipmentBonuses } from "../../domain/items/EquipmentBonuses";

import ManaDisplay from "./ManaDisplay";

const ProgressionView = ({
	progression,
	equipment,
	mana,
	effects = [],
}: {
	progression: Progression;
	equipment?: Equipment;
	effects?: readonly TimedEffect[];
	mana: number;
}) => {
	const { level, earned, needed, remaining } = progressionProgress(progression);
	const attributes = deriveAttributes(progression, effects, equipment);
	return (
		<section
			aria-label="Character progression"
			className="grid content-start gap-2 rounded-lg border bg-muted/20 p-3 md:col-span-2 lg:col-span-1"
		>
			<h3 className="flex items-center gap-2 font-medium">
				<Sparkles aria-hidden="true" className="size-4 text-primary" />
				Progression
			</h3>
			{equipment &&
				Object.values(equipmentBonuses(equipment)).some(
					(bonus) => bonus > 0,
				) && (
					<p className="text-xs text-primary">
						Attributes and capacity include equipped gear bonuses.
					</p>
				)}
			<div className="flex flex-wrap items-baseline justify-between gap-2">
				<output
					aria-label="Character level"
					className="text-lg font-semibold tabular-nums"
				>
					Level {level}
				</output>
				<output aria-label="Total experience" className="text-sm tabular-nums">
					{progression.experience} XP total
				</output>
			</div>
			{level === MAX_PLAYER_LEVEL ? (
				<p className="text-xs text-muted-foreground">Maximum level reached</p>
			) : (
				<>
					<progress
						aria-label="Experience progress"
						value={earned}
						max={needed}
						className="h-2 w-full overflow-hidden rounded-full appearance-none bg-muted [&::-webkit-progress-bar]:bg-muted [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:bg-primary [&::-moz-progress-bar]:bg-primary"
					/>
					<p className="text-xs tabular-nums text-muted-foreground">
						{earned} / {needed} XP this level
					</p>
					<output
						aria-label="Experience to next level"
						className="text-xs text-muted-foreground"
					>
						{remaining} XP to level {level + 1}
					</output>
				</>
			)}
			{effects.some(
				(effect) =>
					effect.actorId === "player" &&
					(effect.kind === "strengthened" || effect.kind === "nimble"),
			) && (
				<p className="text-xs text-primary">
					Attributes include your active temporary spell bonuses.
				</p>
			)}
			<div className="grid gap-1 border-t pt-2">
				<output
					aria-label="Character Strength"
					className="flex items-center gap-2 font-medium tabular-nums"
				>
					<Sword aria-hidden="true" className="size-4 text-primary" />
					Strength {attributes.strength}
				</output>
			</div>
			<div className="grid gap-1 border-t pt-2">
				<output
					aria-label="Character Dexterity"
					className="flex items-center gap-2 font-medium tabular-nums"
				>
					<Zap aria-hidden="true" className="size-4 text-primary" />
					Dexterity {attributes.dexterity}
				</output>
			</div>
			<div className="grid gap-1 border-t pt-2">
				<output
					aria-label="Character Intelligence"
					className="flex items-center gap-2 font-medium tabular-nums"
				>
					<Brain aria-hidden="true" className="size-4 text-primary" />
					Intelligence {attributes.intelligence}
				</output>
				<ManaDisplay
					equipment={equipment}
					mana={mana}
					progression={progression}
					label="Character mana"
				/>
			</div>
			<details className="border-t pt-2 text-xs text-muted-foreground">
				<summary className="cursor-pointer">Stat bonuses and growth</summary>
				<div className="grid gap-2 pt-2">
					<p className="text-xs text-muted-foreground">
						+{attributes.strengthModifier} melee damage · grows at odd levels
						from 3
					</p>
					<p className="text-xs text-muted-foreground">
						+{attributes.dexterityModifier * 5} points to hit / evade chance ·
						grows at even levels
					</p>
					<p className="text-xs text-muted-foreground">
						+{attributes.intelligenceModifier} spell damage / healing · +
						{attributes.intelligenceModifier * 2} mana capacity · grows at odd
						levels from 3
					</p>
					<p className="border-t pt-2 text-xs leading-relaxed text-muted-foreground">
						+{HEALTH_PER_LEVEL} current / maximum HP per level · cap{" "}
						{MAX_PLAYER_LEVEL}.
					</p>
				</div>
			</details>
		</section>
	);
};
export default ProgressionView;
