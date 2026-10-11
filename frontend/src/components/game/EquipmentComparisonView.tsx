import type { compareEquipment } from "../../domain/items/EquipmentComparison";
export type EquipmentComparison = NonNullable<
	ReturnType<typeof compareEquipment>
>;

export const comparisonStyles = {
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
	const { label, stat, carriedValue, equippedValue, delta } = comparison;
	const difference =
		delta < 0 ? `−${Math.abs(delta)}` : delta > 0 ? `+${delta}` : "0";
	return `${label} · ${stat} ${carriedValue} vs equipped ${equippedValue} (${difference})`;
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
