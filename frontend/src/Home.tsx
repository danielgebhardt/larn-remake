import { Settings } from "lucide-react";
import { type SubmitEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetTrigger } from "@/components/ui/sheet";
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
import DungeonSettings from "./DungeonSettings.tsx";
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
	const [settingsOpen, setSettingsOpen] = useState(false);

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
		setSettingsOpen(false);
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
		<Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
			<div className="flex min-h-svh flex-col bg-muted/30">
				<Header
					floorNumber={activeFloor.floorNumber}
					floorCount={run.floors.length}
					onNewDungeon={handleNewDungeon}
					settingsAction={
						<SheetTrigger render={<Button type="button" variant="outline" />}>
							<Settings aria-hidden="true" focusable="false" />
							Settings
						</SheetTrigger>
					}
				/>

				<main className="min-w-0 flex-1 space-y-4 p-4 sm:p-6">
					<section className="min-w-0 rounded-lg border border-border bg-card p-3 sm:p-4">
						<DungeonLegend />
						<DungeonLayout
							dungeon={activeFloor.terrain}
							playerPosition={run.playerCoordinate}
							upStair={activeFloor.upStair?.coordinate}
							downStair={activeFloor.downStair?.coordinate}
							onPlayerMove={handlePlayerMove}
							movementEnabled={!settingsOpen}
						/>
					</section>
				</main>
				<footer className="flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-border px-4 py-2 text-xs text-muted-foreground sm:px-6">
					<span>Server:</span>
					<APICheck />
				</footer>
				<DungeonSettings
					seed={run.seed}
					seedInput={seedInput}
					seedError={seedError}
					onSeedInputChange={(value) => {
						setSeedInput(value);
						setSeedError(null);
					}}
					onSeedSubmit={handleSeedSubmit}
				/>
			</div>
		</Sheet>
	);
};

export default Home;
