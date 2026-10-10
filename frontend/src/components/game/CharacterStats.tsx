import { Heart, Shield, Sword } from "lucide-react";
import { deriveCombatStats } from "../../domain/game/CombatStats";
import type { PlayerStats } from "../../domain/game/PlayerStats";
import type { Equipment } from "../../domain/items/Equipment";

const CharacterStats = ({
	player,
	equipment,
}: {
	player: PlayerStats;
	equipment: Equipment;
}) => {
	const combat = deriveCombatStats(equipment);
	return (
		<section aria-label="Character stats" className="grid gap-2">
			<div className="grid grid-cols-3 gap-2">
				<div className="rounded-lg border bg-muted/30 p-3">
					<Heart aria-hidden="true" className="mb-2 size-4 text-player" />
					<output
						aria-label="Character health"
						className="font-medium tabular-nums"
					>
						Health {player.health} / {player.maxHealth}
					</output>
					<p className="mt-1 text-xs text-muted-foreground">
						Current / maximum
					</p>
				</div>
				<div className="rounded-lg border bg-muted/30 p-3">
					<Sword
						aria-hidden="true"
						className="mb-2 size-4 text-muted-foreground"
					/>
					<output
						aria-label="Character attack"
						className="font-medium tabular-nums"
					>
						Attack {combat.attack}
					</output>
					<p className="mt-1 text-xs text-muted-foreground">
						Base {combat.baseAttack} + weapon {combat.weaponBonus}
					</p>
				</div>
				<div className="rounded-lg border bg-muted/30 p-3">
					<Shield
						aria-hidden="true"
						className="mb-2 size-4 text-muted-foreground"
					/>
					<output
						aria-label="Character armor"
						className="font-medium tabular-nums"
					>
						Armor {combat.armor}
					</output>
					<p className="mt-1 text-xs text-muted-foreground">
						From equipped gear
					</p>
				</div>
			</div>
			<p className="text-xs leading-relaxed text-muted-foreground">
				Armor reduces incoming damage. Hits always deal at least 1 damage.
			</p>
		</section>
	);
};
export default CharacterStats;
