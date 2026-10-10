import {
	createContext,
	type ReactNode,
	useContext,
	useEffect,
	useState,
} from "react";

export type Theme = "light" | "dark" | "system";
const storageKey = "larn-theme";
const ThemeContext = createContext<{
	theme: Theme;
	setTheme: (theme: Theme) => void;
} | null>(null);

const readTheme = (): Theme => {
	try {
		const saved = localStorage.getItem(storageKey);
		if (saved === "light" || saved === "dark" || saved === "system")
			return saved;
	} catch {
		// Appearance still works when browser storage is unavailable.
	}
	return "dark";
};

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
	const [theme, setPreference] = useState<Theme>(readTheme);
	useEffect(() => {
		const apply = (dark: boolean) => {
			document.documentElement.classList.toggle("dark", dark);
			document.documentElement.style.colorScheme = dark ? "dark" : "light";
		};
		if (theme !== "system") {
			apply(theme === "dark");
			return;
		}
		const media = window.matchMedia("(prefers-color-scheme: dark)");
		apply(media.matches);
		const onChange = (event: MediaQueryListEvent) => apply(event.matches);
		media.addEventListener("change", onChange);
		return () => media.removeEventListener("change", onChange);
	}, [theme]);
	const setTheme = (value: Theme) => {
		setPreference(value);
		try {
			localStorage.setItem(storageKey, value);
		} catch {
			// Keep the session preference even if it cannot be saved.
		}
	};
	return (
		<ThemeContext.Provider value={{ theme, setTheme }}>
			{children}
		</ThemeContext.Provider>
	);
};

export const useTheme = () => {
	const context = useContext(ThemeContext);
	if (!context) throw new Error("useTheme must be used within ThemeProvider");
	return context;
};
