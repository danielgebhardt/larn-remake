import APICheck from "./APICheck.tsx";
import DungeonLayout from "./DungeonLayout.tsx";
import Header from "./Header.tsx";
import { fixedDungeon, START_COORDINATE } from "./LayoutTiles.ts";

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
						dungeon={fixedDungeon}
						playerPosition={START_COORDINATE}
					/>
				</section>
			</main>
		</div>
	);
};

export default Home;
