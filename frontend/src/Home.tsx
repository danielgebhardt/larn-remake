import APICheck from "./APICheck.tsx";
import DungeonLayout from "./DungeonLayout.tsx";
import Header from "./Header.tsx";
import { START_COORDINATE, startingDungeon } from "./LayoutTiles.ts";

const Home = () => {
	return (
		<div>
			<Header />
			<main>
				<section>
					<APICheck />
				</section>
				<section>
					<DungeonLayout
						dungeon={startingDungeon}
						playerPosition={START_COORDINATE}
					/>
				</section>
			</main>
		</div>
	);
};

export default Home;
