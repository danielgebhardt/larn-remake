import { useId } from "react";
import {
	DIFFICULTY_PRESETS,
	type Difficulty,
} from "../../domain/game/Difficulty";

const DifficultyChoice = ({
	value,
	onChange,
}: {
	value: Difficulty;
	onChange: (value: Difficulty) => void;
}) => {
	const name = useId();
	return (
		<fieldset className="grid grid-cols-3 gap-2">
			<legend className="mb-2 text-sm font-medium">Difficulty</legend>
			{Object.values(DIFFICULTY_PRESETS).map((preset) => (
				<label
					key={preset.label}
					className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2.5 text-sm ${value === preset.multiplier ? "border-primary bg-primary/10" : "border-border bg-background/60"}`}
				>
					<input
						type="radio"
						name={name}
						value={preset.multiplier}
						checked={value === preset.multiplier}
						onChange={() => onChange(preset.multiplier)}
						className="accent-primary"
					/>
					<span className="grid">
						<span className="font-medium">{preset.label}</span>
						<span className="text-xs text-muted-foreground">
							×{preset.multiplier}
						</span>
					</span>
				</label>
			))}
			<p className="col-span-3 text-xs text-muted-foreground">
				Enemy health and direct damage only. Loot and XP stay the same. Fixed
				for this adventure.
			</p>
		</fieldset>
	);
};
export default DifficultyChoice;
