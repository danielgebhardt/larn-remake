import { EQUIPMENT_SLOT_LABELS } from "../../domain/items/Equipment";
import type { compareEquipment } from "../../domain/items/EquipmentComparison";
export type EquipmentComparison = NonNullable<
	ReturnType<typeof compareEquipment>
>;

export const comparisonStyles = {
	Tradeoff: {
		border: "border-blue-500/70 dark:border-blue-400/70",
		text: "text-blue-700 dark:text-blue-400",
	},
	Better: {
		border: "border-green-500/70 dark:border-green-400/70",
		text: "text-green-700 dark:text-green-400",
	},
	Same: {
		border: "border-blue-500/70 dark:border-blue-400/70",
		text: "text-blue-700 dark:text-blue-400",
	},
	Lower: {
		border: "border-red-500/70 dark:border-red-400/70",
		text: "text-red-700 dark:text-red-400",
	},
};
export const comparisonDescription = (comparison: EquipmentComparison) => {
	const { label, slot, changes } = comparison;
	const values = changes.map(({ stat, carriedValue, equippedValue, delta }) => {
		const difference =
			delta < 0 ? `−${Math.abs(delta)}` : delta > 0 ? `+${delta}` : "0";
		return `${stat} ${carriedValue} vs equipped ${equippedValue} (${difference})`;
	});
	const location =
		slot === "leftRing" || slot === "rightRing"
			? `${EQUIPMENT_SLOT_LABELS[slot]} · `
			: "";
	return `${label} · ${location}${values.join(" · ")}${label === "Tradeoff" ? " · Gains and losses; choose for your play style." : ""}`;
};
const EquipmentComparisonView = ({
	comparison,
}: {
	comparison: EquipmentComparison;
}) => (
	<output
		aria-label="Equipment comparison"
		className={`text-xs font-medium tabular-nums ${comparisonStyles[comparison.label].text}`}
	>
		{comparisonDescription(comparison)}
	</output>
);
export default EquipmentComparisonView;
