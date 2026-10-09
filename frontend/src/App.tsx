import "./App.css";
import Home from "./Home.tsx";
import { ThemeProvider } from "./ThemeProvider";

function App() {
	return (
		<ThemeProvider>
			<Home />
		</ThemeProvider>
	);
}

export default App;
