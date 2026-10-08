import { useState } from "react";
import APICheck from "./APICheck.tsx";
import DungeonLayout from "./DungeonLayout.tsx";
import { connectDungeonFloors, generateDungeonRun } from "./DungeonRun.ts";
import Header from "./Header.tsx";
import type { Coordinate, Dungeon, DungeonConfig } from "./LayoutTiles.ts";

type DungeonLayoutType = {
	terrain: Dungeon;
	startingPlayerPosition: Coordinate;
	generation: number;
	upStair?: Coordinate;
	downStair?: Coordinate;
};

const dungeonConfig: DungeonConfig = {
	rows: 30,
	cols: 100,
	minPartitionSize: 5,
	roomPadding: 1,
};

const createDungeonLayoutState = (
	seed: number,
	generation: number,
): DungeonLayoutType => {
	const run = connectDungeonFloors(generateDungeonRun(seed, 3, dungeonConfig));

	const activeFloor = run.floors[run.activeFloor - 1];

	return {
		terrain: activeFloor.terrain,
		startingPlayerPosition: run.playerCoordinate,
		generation,
		upStair: activeFloor.upStair?.coordinate,
		downStair: activeFloor.downStair?.coordinate,
	};
};

const Home = () => {
	const [
		{ terrain, startingPlayerPosition, generation, upStair, downStair },
		setDungeon,
	] = useState(() => createDungeonLayoutState(0, 0));

	const handleNewDungeon = () => {
		const seed = Math.floor(Math.random() * 1000);

		setDungeon((previous) =>
			createDungeonLayoutState(seed, previous.generation + 1),
		);
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
						key={generation}
						dungeon={terrain}
						startingPlayerPosition={startingPlayerPosition}
						upStair={upStair}
						downStair={downStair}
					/>
				</section>
			</main>
		</div>
	);
};

export default Home;
