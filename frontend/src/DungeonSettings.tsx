import { Toggle } from "@base-ui/react/toggle";
import { ToggleGroup } from "@base-ui/react/toggle-group";
import { Monitor, Moon, Sun } from "lucide-react";
import { type SubmitEvent, useRef } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { useTheme } from "./ThemeProvider";

type DungeonSettingsProps = {
	seed: number;
	seedInput: string;
	seedError: string | null;
	onSeedInputChange: (value: string) => void;
	onSeedSubmit: (event: SubmitEvent<HTMLFormElement>) => void;
};

const DungeonSettings = ({
	seed,
	seedInput,
	seedError,
	onSeedInputChange,
	onSeedSubmit,
}: DungeonSettingsProps) => {
	const inputRef = useRef<HTMLInputElement>(null);
	const { theme, setTheme } = useTheme();
	return (
		<SheetContent
			initialFocus={inputRef}
			className="overflow-y-auto data-[side=right]:w-full"
		>
			<SheetHeader>
				<SheetTitle>Settings</SheetTitle>
				<SheetDescription>
					Choose your appearance or start a dungeon from another seed.
				</SheetDescription>
			</SheetHeader>
			<div className="grid gap-4 px-4 pb-4">
				<p className="text-sm text-muted-foreground">
					Current seed:{" "}
					<output
						aria-label="Current dungeon seed"
						className="font-mono text-foreground"
					>
						{seed}
					</output>
				</p>
				<form className="grid gap-3" onSubmit={onSeedSubmit}>
					<div className="grid gap-2">
						<Label htmlFor="dungeon-seed">Dungeon seed</Label>
						<Input
							ref={inputRef}
							id="dungeon-seed"
							type="text"
							inputMode="numeric"
							value={seedInput}
							aria-invalid={seedError !== null}
							aria-describedby={seedError ? "seed-error" : undefined}
							onChange={(event) => onSeedInputChange(event.target.value)}
						/>
					</div>
					{seedError && (
						<p
							id="seed-error"
							role="alert"
							className="text-sm text-destructive"
						>
							{seedError}
						</p>
					)}
					<Button type="submit" variant="outline">
						Start from seed
					</Button>
				</form>
				<div className="grid gap-2 border-t pt-4">
					<p id="appearance-label" className="text-sm font-medium">
						Appearance
					</p>
					<ToggleGroup
						aria-labelledby="appearance-label"
						value={[theme]}
						onValueChange={(values) => {
							if (values[0]) setTheme(values[0]);
						}}
						className="flex gap-1 rounded-lg border bg-muted p-1"
					>
						{(
							[
								{ value: "light", label: "Light", Icon: Sun },
								{ value: "dark", label: "Dark", Icon: Moon },
								{ value: "system", label: "System", Icon: Monitor },
							] as const
						).map(({ value, label, Icon }) => (
							<Toggle
								key={value}
								value={value}
								className={buttonVariants({
									variant: theme === value ? "default" : "ghost",
									className: "flex-1",
								})}
							>
								<Icon aria-hidden="true" focusable="false" />
								{label}
							</Toggle>
						))}
					</ToggleGroup>
					<p className="text-xs text-muted-foreground">
						Saved on this device. System follows your device’s appearance.
					</p>
				</div>
			</div>
		</SheetContent>
	);
};

export default DungeonSettings;
