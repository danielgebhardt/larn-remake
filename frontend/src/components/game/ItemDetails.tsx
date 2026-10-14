import { useId } from "react";
import { Button } from "@/components/ui/button";
import type { PlayerAction } from "../../domain/game/PlayerActions";
import type { Bag } from "../../domain/items/Bag";
import {
	EQUIPMENT_SLOT_LABELS,
	type EquipmentSlot,
	equipmentSlotsFor,
} from "../../domain/items/Equipment";
import {
	compareEquipment,
	type EquipmentComparisonContext,
} from "../../domain/items/EquipmentComparison";
import { ITEM_DEFINITIONS, type ItemInstance } from "../../domain/items/Item";
import {
	itemArmor,
	itemAttackBonus,
	itemName,
} from "../../domain/items/ItemValues";
import {
	HOTBAR_SLOTS,
	type PotionHotbar,
} from "../../domain/items/PotionHotbar";
import EnchantmentTargets from "./EnchantmentTargets";
import EquipmentComparisonView from "./EquipmentComparisonView";

const labels = {
	enchantment: "Enchantment scroll",
	quest: "Quest item",
	ring: "Ring",
	spellbook: "Spellbook",
	weapon: "Weapon",
	shield: "Shield",
	potion: "Potion",
	"chest-armor": "Chest armor",
	helmet: "Helmet",
};
const ItemDetails = ({
	item,
	bag = { items: [] },
	onCancel,
	comparisonContext,
	equippedSlot,
	alive,
	onAction,
	afterAction,
	potionHotbar,
	assignmentsEnabled = true,
}: {
	item: ItemInstance;
	bag?: Bag;
	onCancel?: () => void;
	comparisonContext: EquipmentComparisonContext;
	equippedSlot?: EquipmentSlot;
	alive: boolean;
	onAction: (action: PlayerAction) => void;
	afterAction: () => void;
	potionHotbar: PotionHotbar;
	assignmentsEnabled?: boolean;
}) => {
	const titleId = useId();
	const { equipment } = comparisonContext;
	const details = ITEM_DEFINITIONS[item.kind];
	const slots = equipmentSlotsFor(item);
	const comparisons = equippedSlot
		? []
		: slots
				.map((slot) => compareEquipment(item, comparisonContext, slot))
				.filter((comparison) => comparison !== null);
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
			<p className="font-medium">{itemName(item)}</p>
			<p className="text-xs text-muted-foreground">{labels[details.type]}</p>
			<p className="text-sm leading-relaxed text-muted-foreground">
				{details.description}
			</p>
			<p className="text-xs font-medium tabular-nums">
				{details.type === "potion"
					? "cleanses" in details
						? "Removes poison"
						: "boost" in details
							? "+2 temporary attribute for 6 turns; refreshes instead of stacking"
							: `Recovery up to ${details.recovery.amount} ${details.recovery.resource}`
					: details.type === "enchantment"
						? "Guaranteed +1; maximum +3 per item"
						: details.type === "weapon"
							? `Attack bonus +${itemAttackBonus(item)}`
							: details.type === "ring" && "stats" in details
								? Object.entries(details.stats)
										.map(([stat, bonus]) => `+${bonus} ${stat}`)
										.join(" · ")
								: `Armor ${itemArmor(item)}`}
			</p>
			{"stats" in details && details.type !== "ring" && (
				<p className="text-xs font-medium">
					{Object.entries(details.stats)
						.map(([stat, bonus]) => `+${bonus} ${stat}`)
						.join(" · ")}
				</p>
			)}
			{comparisons.map((comparison) => (
				<EquipmentComparisonView
					key={comparison.slot}
					comparison={comparison}
				/>
			))}
			{comparisons.length > 0 && (
				<p className="text-xs text-muted-foreground">
					Preview uses current active effects, before monsters act. Capacity
					gains do not refill health or mana; removing capacity can clamp
					current resources.
				</p>
			)}
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
						{slots.map((slot) => (
							<Button
								type="button"
								disabled={!alive}
								key={slot}
								onClick={() => act({ type: "equip", itemId: item.id, slot })}
							>
								Equip in {EQUIPMENT_SLOT_LABELS[slot].toLowerCase()}
							</Button>
						))}
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
			{details.type === "enchantment" && !equippedSlot && (
				<EnchantmentTargets
					scrollId={item.id}
					equipment={equipment}
					bag={bag}
					alive={alive}
					onAction={act}
					onCancel={onCancel ?? afterAction}
				/>
			)}
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
								variant={
									potionHotbar[slot - 1] === item.kind ? "default" : "outline"
								}
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
