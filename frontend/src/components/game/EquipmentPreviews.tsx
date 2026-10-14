import { equipmentSlotsFor } from "../../domain/items/Equipment";
import {
	compareEquipment,
	type EquipmentComparisonContext,
} from "../../domain/items/EquipmentComparison";
import type { ItemInstance } from "../../domain/items/Item";
import EquipmentComparisonView from "./EquipmentComparisonView";

const EquipmentPreviews = ({
	item,
	context,
}: {
	item: ItemInstance;
	context: EquipmentComparisonContext;
}) => {
	const comparisons = equipmentSlotsFor(item)
		.map((slot) => compareEquipment(item, context, slot))
		.filter((comparison) => comparison !== null);
	if (!comparisons.length) return null;
	return (
		<div className="grid gap-2">
			{comparisons.map((comparison) => (
				<EquipmentComparisonView
					key={comparison.slot}
					comparison={comparison}
				/>
			))}
			<p className="text-xs text-muted-foreground">
				Preview uses current active effects, before monsters act. Capacity gains
				do not refill health or mana; removing capacity can clamp current
				resources.
			</p>
		</div>
	);
};
export default EquipmentPreviews;
