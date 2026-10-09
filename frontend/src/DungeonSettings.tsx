import { type SubmitEvent, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";

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
	return (
		<SheetContent
			initialFocus={inputRef}
			className="overflow-y-auto data-[side=right]:w-full"
		>
			<SheetHeader>
				<SheetTitle>Settings</SheetTitle>
				<SheetDescription>
					View the current seed or start a dungeon from another seed.
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
			</div>
		</SheetContent>
	);
};

export default DungeonSettings;
