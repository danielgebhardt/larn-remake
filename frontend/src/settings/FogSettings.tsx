import { type SubmitEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	FOG_RADIUS_LIMITS,
	type FogConfiguration,
} from "../domain/dungeon/RunConfiguration.ts";
import { parseFogRadius } from "./FogConfigurationDraft.ts";

type FogSettingsProps = {
	configuration: FogConfiguration;
	onEnabledChange: (enabled: boolean) => void;
	onRadiusApply: (radius: number) => void;
};

const FogSettings = ({
	configuration,
	onEnabledChange,
	onRadiusApply,
}: FogSettingsProps) => {
	const [draft, setDraft] = useState(String(configuration.radius));
	const [error, setError] = useState<string | null>(null);
	const applyRadius = (event: SubmitEvent<HTMLFormElement>) => {
		event.preventDefault();
		const radius = parseFogRadius(draft);
		if (radius === undefined) {
			setError(
				`Enter a whole number from ${FOG_RADIUS_LIMITS.min} to ${FOG_RADIUS_LIMITS.max}.`,
			);
			return;
		}
		onRadiusApply(radius);
		setDraft(String(radius));
		setError(null);
	};
	return (
		<fieldset className="grid gap-3 border-t pt-4">
			<legend className="pt-4 text-sm font-medium">Fog of war</legend>
			<Label className="flex items-center gap-2" htmlFor="fog-enabled">
				<input
					id="fog-enabled"
					type="checkbox"
					checked={configuration.enabled}
					onChange={(event) => onEnabledChange(event.target.checked)}
					className="size-4 accent-primary"
				/>
				Enable fog of war
			</Label>
			<form className="grid gap-2" onSubmit={applyRadius}>
				<Label htmlFor="fog-radius">Visibility radius</Label>
				<Input
					id="fog-radius"
					type="text"
					inputMode="numeric"
					value={draft}
					aria-invalid={error !== null}
					aria-describedby={`fog-radius-hint${error ? " fog-radius-error" : ""}`}
					onChange={(event) => {
						setDraft(event.target.value);
						setError(null);
					}}
				/>
				<p id="fog-radius-hint" className="text-xs text-muted-foreground">
					{FOG_RADIUS_LIMITS.min}–{FOG_RADIUS_LIMITS.max} tiles, whole numbers.
					Walls block sight.
				</p>
				{error && (
					<p
						id="fog-radius-error"
						role="alert"
						className="text-sm text-destructive"
					>
						{error}
					</p>
				)}
				<Button type="submit" variant="outline">
					Apply visibility radius
				</Button>
			</form>
			<p className="text-xs text-muted-foreground">
				Changes apply without restarting. Explored tiles remain remembered.
				These preferences last for this session.
			</p>
		</fieldset>
	);
};

export default FogSettings;
