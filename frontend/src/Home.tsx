import APICheck from "./APICheck.tsx";
import DungeonLayout from "./DungeonLayout.tsx";
import Header from "./Header.tsx";

const Home = () => {
	return (
		<div>
			<Header />
			<main>
				<section>
					<APICheck />
				</section>
				<section>
					<DungeonLayout />
				</section>
			</main>
		</div>
	);
};

export default Home;
