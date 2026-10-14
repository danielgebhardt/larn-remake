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
const difference = (before: number, after: number) => {
	const delta = after - before;
	return delta < 0 ? `−${Math.abs(delta)}` : delta > 0 ? `+${delta}` : "0";
};
const comparisonValues = ({ before, after }: EquipmentComparison) => [
	`Maximum health ${before.maxHealth} → ${after.maxHealth} (${difference(before.maxHealth, after.maxHealth)})`,
	`Maximum mana ${before.maxMana} → ${after.maxMana} (${difference(before.maxMana, after.maxMana)})`,
	`Damage ${before.minDamage}–${before.maxDamage} → ${after.minDamage}–${after.maxDamage}`,
	`Armor ${before.armor} → ${after.armor} (${difference(before.armor, after.armor)})`,
	`Hit chance ${before.hitChance}% → ${after.hitChance}%`,
	`Evasion ${before.evadeChance}% → ${after.evadeChance}%`,
];
export const comparisonDescription = (comparison: EquipmentComparison) =>
	`${comparison.label} · ${EQUIPMENT_SLOT_LABELS[comparison.slot]} · ${comparisonValues(comparison).join(" · ")} · ${(["strength", "dexterity", "intelligence"] as const).map((stat) => `${stat} ${comparison.before[stat]} → ${comparison.after[stat]}`).join(" · ")}`;
const EquipmentComparisonView = ({
	comparison,
}: {
	comparison: EquipmentComparison;
}) => (
	<div className="grid gap-2 rounded-md border bg-background/40 p-3">
		<output
			aria-label="Equipment comparison"
			className="grid gap-2 text-xs tabular-nums"
		>
			<span
				className={`font-semibold ${comparisonStyles[comparison.label].text}`}
			>
				{comparison.label} · {EQUIPMENT_SLOT_LABELS[comparison.slot]}
			</span>
			<span className="grid gap-x-4 gap-y-1 sm:grid-cols-2">
				{comparisonValues(comparison).map((value) => (
					<span key={value}>{value}</span>
				))}
			</span>
			{comparison.label === "Tradeoff" && (
				<span className="text-muted-foreground">
					Gains and losses; choose for your play style.
				</span>
			)}
		</output>
		<details className="text-xs text-muted-foreground">
			<summary className="cursor-pointer">Attribute details</summary>
			{(["strength", "dexterity", "intelligence"] as const).map((stat) => (
				<p key={stat}>
					{stat[0].toUpperCase() + stat.slice(1)} {comparison.before[stat]} →{" "}
					{comparison.after[stat]} (
					{difference(comparison.before[stat], comparison.after[stat])})
				</p>
			))}
		</details>
	</div>
);
export default EquipmentComparisonView;
