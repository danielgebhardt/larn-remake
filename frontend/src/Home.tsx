import { type SubmitEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import APICheck from "./APICheck.tsx";
import DungeonLayout from "./DungeonLayout.tsx";
import DungeonLegend from "./DungeonLegend.tsx";
import {
	ascendDungeonRun,
	connectDungeonFloors,
	type DungeonRun,
	descendDungeonRun,
	generateDungeonRun,
} from "./DungeonRun.ts";
import Header from "./Header.tsx";
import type { Coordinate, DungeonConfig } from "./LayoutTiles.ts";
import { MAX_SEED, parseSeedInput } from "./Seed.ts";

const dungeonConfig: DungeonConfig = {
	rows: 30,
	cols: 100,
	minPartitionSize: 5,
	roomPadding: 1,
};

const createRun = (seed: number): DungeonRun =>
	connectDungeonFloors(generateDungeonRun(seed, 3, dungeonConfig));

const Home = () => {
	const [run, setRun] = useState<DungeonRun>(() => createRun(0));
	const [seedInput, setSeedInput] = useState(() => String(run.seed));
	const [seedError, setSeedError] = useState<string | null>(null);

	const activeFloor = run.floors[run.activeFloor - 1];

	const handleNewDungeon = () => {
		const seed = Math.floor(Math.random() * (MAX_SEED + 1));

		setRun(createRun(seed));
		setSeedInput(String(seed));
		setSeedError(null);
	};

	const handleSeedSubmit = (event: SubmitEvent<HTMLFormElement>) => {
		event.preventDefault();
		const seed = parseSeedInput(seedInput);
		if (seed === undefined) {
			setSeedError(`Enter a whole number from 0 to ${MAX_SEED}.`);
			return;
		}
		setRun(createRun(seed));
		setSeedInput(String(seed));
		setSeedError(null);
	};

	const handlePlayerMove = (coordinate: Coordinate) => {
		setRun((current) => {
			const movedRunCheckDescend = descendDungeonRun({
				...current,
				playerCoordinate: coordinate,
			});

			if (movedRunCheckDescend.transitioned) {
				return movedRunCheckDescend.run;
			}

			const movedRunCheckAscend = ascendDungeonRun({
				...current,
				playerCoordinate: coordinate,
			});

			return movedRunCheckAscend.run;
		});
	};

	return (
		<div className="flex min-h-svh flex-col bg-muted/30">
			<Header
				floorNumber={activeFloor.floorNumber}
				floorCount={run.floors.length}
				onNewDungeon={handleNewDungeon}
			/>

			<main className="min-w-0 flex-1 space-y-4 p-4 sm:p-6">
				<section className="grid gap-3 rounded-lg border border-border bg-card p-4">
					<p className="text-sm text-muted-foreground">
						Current seed:{" "}
						<output
							aria-label="Current dungeon seed"
							className="font-mono text-foreground"
						>
							{run.seed}
						</output>
					</p>
					<form
						className="flex flex-wrap items-end gap-3"
						onSubmit={handleSeedSubmit}
					>
						<div className="grid w-full gap-2 sm:w-64">
							<Label htmlFor="dungeon-seed">Dungeon seed</Label>
							<Input
								id="dungeon-seed"
								type="text"
								inputMode="numeric"
								value={seedInput}
								aria-invalid={seedError !== null}
								aria-describedby={seedError ? "seed-error" : undefined}
								onChange={(event) => {
									setSeedInput(event.target.value);
									setSeedError(null);
								}}
							/>
						</div>
						<Button type="submit" variant="outline">
							Start from seed
						</Button>
						{seedError && (
							<p
								id="seed-error"
								role="alert"
								className="w-full text-sm text-destructive"
							>
								{seedError}
							</p>
						)}
					</form>
				</section>

				<section className="min-w-0 rounded-lg border border-border bg-card p-3 sm:p-4">
					<DungeonLegend />
					<DungeonLayout
						dungeon={activeFloor.terrain}
						playerPosition={run.playerCoordinate}
						upStair={activeFloor.upStair?.coordinate}
						downStair={activeFloor.downStair?.coordinate}
						onPlayerMove={handlePlayerMove}
					/>
				</section>
			</main>
			<footer className="flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-border px-4 py-2 text-xs text-muted-foreground sm:px-6">
				<span>Server:</span>
				<APICheck />
			</footer>
		</div>
	);
};

export default Home;
