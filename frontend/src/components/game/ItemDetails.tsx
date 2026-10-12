import { useId } from "react";
import { Button } from "@/components/ui/button";
import type { PlayerAction } from "../../domain/game/PlayerActions";
import type { Equipment } from "../../domain/items/Equipment";
import {
	EQUIPMENT_SLOT_LABELS,
	type EquipmentSlot,
	equipmentSlotFor,
} from "../../domain/items/Equipment";
import { compareEquipment } from "../../domain/items/EquipmentComparison";
import { ITEM_DEFINITIONS, type ItemInstance } from "../../domain/items/Item";
import {
	HOTBAR_SLOTS,
	type PotionHotbar,
} from "../../domain/items/PotionHotbar";
import EquipmentComparisonView from "./EquipmentComparisonView";

const labels = {
	quest: "Quest item",
	spellbook: "Spellbook",
	weapon: "Weapon",
	shield: "Shield",
	potion: "Potion",
	"chest-armor": "Chest armor",
	helmet: "Helmet",
};
const ItemDetails = ({
	item,
	equipment,
	equippedSlot,
	alive,
	onAction,
	afterAction,
	potionHotbar,
	assignmentsEnabled = true,
}: {
	item: ItemInstance;
	equipment: Equipment;
	equippedSlot?: EquipmentSlot;
	alive: boolean;
	onAction: (action: PlayerAction) => void;
	afterAction: () => void;
	potionHotbar: PotionHotbar;
	assignmentsEnabled?: boolean;
}) => {
	const titleId = useId();
	const details = ITEM_DEFINITIONS[item.kind];
	const slot = equipmentSlotFor(item);
	const comparison = equippedSlot ? null : compareEquipment(item, equipment);
	const act = (action: PlayerAction) => {
		onAction(action);
		afterAction();
	};
	return (
		<section
			aria-labelledby={titleId}
			className="grid gap-2 rounded-lg border bg-muted/30 p-4"
		>
			<h4 id={titleId} className="text-xs font-medium text-muted-foreground">
				Item details
			</h4>
			<p className="font-medium">{details.name}</p>
			<p className="text-xs text-muted-foreground">{labels[details.type]}</p>
			<p className="text-sm leading-relaxed text-muted-foreground">
				{details.description}
			</p>
			<p className="text-xs font-medium tabular-nums">
				{details.type === "potion"
					? `Recovery up to ${details.recovery.amount} ${details.recovery.resource}`
					: details.type === "weapon"
						? `Attack bonus +${details.attackBonus}`
						: `Armor ${details.armor}`}
			</p>
			{comparison && <EquipmentComparisonView comparison={comparison} />}
			<div className="flex flex-wrap gap-2">
				{equippedSlot ? (
					<Button
						type="button"
						variant="outline"
						disabled={!alive}
						onClick={() => act({ type: "unequip", slot: equippedSlot })}
					>
						Unequip {EQUIPMENT_SLOT_LABELS[equippedSlot].toLowerCase()}
					</Button>
				) : (
					<>
						<Button
							type="button"
							variant="outline"
							disabled={!alive}
							onClick={() => act({ type: "drop", itemId: item.id })}
						>
							Drop item
						</Button>
						{slot && (
							<Button
								type="button"
								disabled={!alive}
								onClick={() => act({ type: "equip", itemId: item.id, slot })}
							>
								Equip in {EQUIPMENT_SLOT_LABELS[slot].toLowerCase()}
							</Button>
						)}
						{details.type === "potion" && (
							<Button
								type="button"
								disabled={!alive}
								onClick={() => act({ type: "consume", itemId: item.id })}
							>
								Drink potion
							</Button>
						)}
					</>
				)}
			</div>
			{details.type === "potion" && !equippedSlot && (
				<div className="grid gap-2 border-t pt-3">
					<p className="text-xs text-muted-foreground">
						Assign a shortcut (free). Choosing another slot moves this potion's
						assignment.
					</p>
					<fieldset aria-label="Assign potion shortcut" className="flex gap-2">
						{HOTBAR_SLOTS.map((slot) => (
							<Button
								key={slot}
								type="button"
								variant="outline"
								size="sm"
								disabled={!assignmentsEnabled}
								aria-label={`Assign to potion slot ${slot}`}
								aria-pressed={potionHotbar[slot - 1] === item.kind}
								onClick={() =>
									onAction({ type: "assign-hotbar", slot, itemId: item.id })
								}
							>
								{slot}
							</Button>
						))}
					</fieldset>
				</div>
			)}
		</section>
	);
};
export default ItemDetails;
