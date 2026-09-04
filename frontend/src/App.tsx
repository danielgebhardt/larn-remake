import "./App.css";
import { useEffect, useState } from "react";

function App() {
	const [initialText, setInitialText] = useState<string>("Larn Remake");
	const [error, setError] = useState<string | null>(null);
	useEffect(() => {
		fetch("/initial")
			.then((res) => {
				if (!res.ok) throw new Error("Network error");
				return res.text();
			})
			.then((data) => setInitialText(data))
			.catch(() => setError("Failed to load from server"));
	}, []);

	if (error) return <div role="alert">{error}</div>;

	return <h1 aria-label={"App Heading"}>{initialText}</h1>;
}

export default App;
