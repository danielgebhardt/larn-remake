import { useId } from "react";
import {
	DUNGEON_SIZE_PRESETS,
	type RunConfiguration,
} from "../../domain/dungeon/RunConfiguration";

const DungeonSizeChoice = ({
	configuration,
	onChange,
}: {
	configuration: RunConfiguration;
	onChange: (size: Pick<RunConfiguration, "rows" | "cols">) => void;
}) => {
	const name = useId();
	return (
		<fieldset className="grid grid-cols-3 gap-2">
			<legend className="mb-2 text-sm font-medium">Dungeon size</legend>
			{DUNGEON_SIZE_PRESETS.map((size) => {
				const selected =
					configuration.rows === size.rows && configuration.cols === size.cols;
				return (
					<label
						key={size.label}
						className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2.5 text-sm ${selected ? "border-primary bg-primary/10" : "border-border bg-background/60"}`}
					>
						<input
							type="radio"
							name={name}
							checked={selected}
							onChange={() => onChange({ rows: size.rows, cols: size.cols })}
							value={size.label}
						/>
						<span className="grid">
							<span className="font-medium">{size.label}</span>
							<span className="text-xs text-muted-foreground">
								{size.rows} × {size.cols}
							</span>
						</span>
					</label>
				);
			})}
			<p className="col-span-3 text-xs text-muted-foreground">
				Map dimensions only. Change floor count or custom dimensions in
				Settings.
			</p>
		</fieldset>
	);
};
export default DungeonSizeChoice;
