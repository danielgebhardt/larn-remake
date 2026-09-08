import "./App.css";
import { type JSX, useEffect, useState } from "react";

function APICheck(): JSX.Element {
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

	return <section aria-label={"Body Text"}>{initialText}</section>;
}

export default APICheck;
