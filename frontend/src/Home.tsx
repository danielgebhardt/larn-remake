import { useState } from "react";
import APICheck from "./APICheck.tsx";
import DungeonLayout from "./DungeonLayout.tsx";
import {
	connectDungeonFloors,
	type DungeonRun,
	descendDungeonRun,
	generateDungeonRun,
} from "./DungeonRun.ts";
import Header from "./Header.tsx";
import type { Coordinate, DungeonConfig } from "./LayoutTiles.ts";

type HomeState = {
	run: DungeonRun;
	generation: number;
};

const dungeonConfig: DungeonConfig = {
	rows: 30,
	cols: 100,
	minPartitionSize: 5,
	roomPadding: 1,
};

const createRun = (seed: number): DungeonRun =>
	connectDungeonFloors(generateDungeonRun(seed, 3, dungeonConfig));

const Home = () => {
	const [{ run, generation }, setDungeon] = useState<HomeState>(() => ({
		run: createRun(0),
		generation: 0,
	}));

	const activeFloor = run.floors[run.activeFloor - 1];

	const handleNewDungeon = () => {
		const seed = Math.floor(Math.random() * 1000);

		setDungeon((current) => ({
			run: createRun(seed),
			generation: current.generation + 1,
		}));
	};

	const handlePlayerMove = (coordinate: Coordinate) => {
		setDungeon((current) => {
			const movedRun = descendDungeonRun({
				...current.run,
				playerCoordinate: coordinate,
			});

			return {
				...current,
				run: movedRun,
			};
		});
	};

	return (
		<div>
			<Header />

			<main>
				<section>
					<APICheck />
				</section>

				<section>
					<button type="button" onClick={handleNewDungeon}>
						New Dungeon
					</button>
				</section>

				<section>
					<DungeonLayout
						key={`${generation}-${run.activeFloor}`}
						dungeon={activeFloor.terrain}
						startingPlayerPosition={run.playerCoordinate}
						upStair={activeFloor.upStair?.coordinate}
						downStair={activeFloor.downStair?.coordinate}
						onPlayerMove={handlePlayerMove}
					/>
				</section>
			</main>
		</div>
	);
};

export default Home;
