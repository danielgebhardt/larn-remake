import "./App.css";
import Home from "./Home.tsx";
import { ThemeProvider } from "./settings/ThemeProvider.tsx";

function App() {
	return (
		<ThemeProvider>
			<Home />
		</ThemeProvider>
	);
}

export default App;
