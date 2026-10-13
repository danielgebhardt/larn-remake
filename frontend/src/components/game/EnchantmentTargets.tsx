import { Button } from "@/components/ui/button";
import type { PlayerAction } from "../../domain/game/PlayerActions";
import type { Bag } from "../../domain/items/Bag";
import type { Equipment } from "../../domain/items/Equipment";
import { enchantmentTargets } from "../../domain/items/EquipmentEnchantment";
import { itemName } from "../../domain/items/ItemValues";

const EnchantmentTargets = ({
	scrollId,
	equipment,
	bag,
	alive,
	onAction,
	onCancel,
}: {
	scrollId: string;
	equipment: Equipment;
	bag: Bag;
	alive: boolean;
	onAction: (action: PlayerAction) => void;
	onCancel: () => void;
}) => {
	const targets = enchantmentTargets({ equipment, bag });
	return (
		<fieldset
			aria-label="Choose equipment to enchant"
			className="grid gap-2 border-t pt-3"
		>
			<legend className="text-sm font-medium">
				Choose equipment · guaranteed +1 · cap +3
			</legend>
			<p className="text-xs text-muted-foreground">
				One scroll and one turn. Weapons gain attack; shields, chest pieces and
				helmets gain armor. Rings cannot be enchanted.
			</p>
			<div className="grid gap-2 sm:grid-cols-2">
				{targets.map(({ item, location }) => (
					<Button
						key={item.id}
						variant="outline"
						disabled={!alive}
						className="h-auto justify-start whitespace-normal text-left"
						onClick={() =>
							onAction({ type: "enchant", scrollId, targetItemId: item.id })
						}
					>
						Enchant {location}: {itemName(item)} to +
						{(item.enchantment ?? 0) + 1}
					</Button>
				))}
			</div>
			{!targets.length && (
				<p className="text-sm text-muted-foreground">
					No eligible equipment below +3. The scroll stays in your bag.
				</p>
			)}
			<Button variant="ghost" onClick={onCancel}>
				Cancel enchantment
			</Button>
		</fieldset>
	);
};
export default EnchantmentTargets;
