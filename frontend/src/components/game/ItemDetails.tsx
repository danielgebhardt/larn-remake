import { useId } from "react";
import { Button } from "@/components/ui/button";
import type { PlayerAction } from "../../domain/game/PlayerActions";
import {
	type EquipmentSlot,
	equipmentSlotFor,
} from "../../domain/items/Equipment";
import { ITEM_DEFINITIONS, type ItemInstance } from "../../domain/items/Item";

const labels = { weapon: "Weapon", shield: "Shield", potion: "Potion" };
const ItemDetails = ({
	item,
	equippedSlot,
	alive,
	onAction,
	afterAction,
}: {
	item: ItemInstance;
	equippedSlot?: EquipmentSlot;
	alive: boolean;
	onAction: (action: PlayerAction) => void;
	afterAction: () => void;
}) => {
	const titleId = useId();
	const details = ITEM_DEFINITIONS[item.kind];
	const slot = equipmentSlotFor(item);
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
					? `Recovery up to ${details.healing} health`
					: details.type === "weapon"
						? `Attack bonus +${details.attackBonus}`
						: `Armor ${details.armor}`}
			</p>
			<div className="flex flex-wrap gap-2">
				{equippedSlot ? (
					<Button
						type="button"
						variant="outline"
						disabled={!alive}
						onClick={() => act({ type: "unequip", slot: equippedSlot })}
					>
						Unequip {equippedSlot === "mainHand" ? "main hand" : "off hand"}
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
								Equip in {slot === "mainHand" ? "main hand" : "off hand"}
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
		</section>
	);
};
export default ItemDetails;
