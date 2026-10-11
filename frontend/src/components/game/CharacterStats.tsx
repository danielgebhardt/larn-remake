import { Heart, Shield, Sword } from "lucide-react";
import {
	armorContributions,
	deriveCombatStats,
} from "../../domain/game/CombatStats";
import {
	attackProfile,
	PLAYER_HIT_CHANCE,
	PLAYER_HIT_THRESHOLD,
} from "../../domain/game/MeleeRules";
import type { PlayerStats } from "../../domain/game/PlayerStats";
import type { Progression } from "../../domain/game/Progression";
import type { Equipment } from "../../domain/items/Equipment";

const CharacterStats = ({
	player,
	equipment,
	progression,
}: {
	player: PlayerStats;
	equipment: Equipment;
	progression: Progression;
}) => {
	const combat = deriveCombatStats(equipment, progression);
	const armor = armorContributions(equipment);
	const profile = attackProfile(combat.attack, PLAYER_HIT_THRESHOLD);

	return (
		<section aria-label="Character stats" className="grid gap-2">
			<div className="grid grid-cols-3 gap-2">
				<div className="rounded-lg border bg-muted/30 p-2">
					<Heart
						aria-hidden="true"
						className="mb-1 inline-block size-4 align-middle mr-2 text-player"
					/>
					<output
						aria-label="Character health"
						className="text-xs font-medium tabular-nums sm:text-sm"
					>
						Health {player.health} / {player.maxHealth}
					</output>
					<p className="mt-1 text-xs text-muted-foreground">
						Current / maximum
					</p>
				</div>
				<div className="rounded-lg border bg-muted/30 p-2">
					<Sword
						aria-hidden="true"
						className="mb-1 inline-block size-4 align-middle mr-2 text-muted-foreground"
					/>
					<output
						aria-label="Character attack"
						className="text-xs font-medium tabular-nums sm:text-sm"
					>
						Attack {profile.minDamage}–{profile.maxDamage}
					</output>
					<p className="mt-1 text-xs text-muted-foreground">
						Base {combat.baseAttack} + Strength {combat.strengthBonus} + weapon{" "}
						{combat.weaponBonus}
					</p>
					<output
						aria-label="Character hit chance"
						className="text-xs text-muted-foreground"
					>
						Hit {PLAYER_HIT_CHANCE}%
					</output>
				</div>
				<div className="rounded-lg border bg-muted/30 p-2">
					<Shield
						aria-hidden="true"
						className="mb-1 inline-block size-4 align-middle mr-2 text-muted-foreground"
					/>
					<output
						aria-label="Character armor"
						className="text-xs font-medium tabular-nums sm:text-sm"
					>
						Armor {combat.armor}
					</output>
					<p className="mt-1 text-xs text-muted-foreground">
						Shield {armor.shield} + chest {armor.chest} + head {armor.head}
					</p>
				</div>
			</div>
			<p className="text-xs leading-relaxed text-muted-foreground">
				Attack shows damage before armor. Armor reduces landed damage; hits deal
				at least 1 damage. Misses deal none.
			</p>
		</section>
	);
};
export default CharacterStats;
