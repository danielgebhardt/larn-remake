import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ThemeProvider, useTheme } from "../ThemeProvider";

const Harness = () => {
	const { theme, setTheme } = useTheme();
	return (
		<>
			<output aria-label="Appearance">{theme}</output>
			{(["light", "dark", "system"] as const).map((mode) => (
				<button type="button" key={mode} onClick={() => setTheme(mode)}>
					{mode}
				</button>
			))}
		</>
	);
};

describe("appearance preferences", () => {
	let media: MediaQueryList;
	let listeners: Set<(event: MediaQueryListEvent) => void>;
	const changeSystem = (dark: boolean) =>
		act(() => {
			Object.defineProperty(media, "matches", {
				value: dark,
				configurable: true,
			});
			for (const listener of listeners)
				listener({ matches: dark } as MediaQueryListEvent);
		});
	beforeEach(() => {
		localStorage.clear();
		listeners = new Set();
		media = {
			matches: false,
			addEventListener: vi.fn((_event, listener) => listeners.add(listener)),
			removeEventListener: vi.fn((_event, listener) =>
				listeners.delete(listener),
			),
		} as unknown as MediaQueryList;
		vi.stubGlobal(
			"matchMedia",
			vi.fn(() => media),
		);
	});
	afterEach(() => {
		cleanup();
		localStorage.clear();
		document.documentElement.classList.remove("dark");
		document.documentElement.style.removeProperty("color-scheme");
		vi.unstubAllGlobals();
	});
	it("defaults to dark even when the operating system prefers light", () => {
		render(
			<ThemeProvider>
				<Harness />
			</ThemeProvider>,
		);
		expect(screen.getByLabelText("Appearance")).toHaveTextContent("dark");
		expect(document.documentElement).toHaveClass("dark");
		expect(document.documentElement.style.colorScheme).toBe("dark");
	});
	it.each(["light", "dark", "system"] as const)(
		"restores saved %s appearance",
		(theme) => {
			localStorage.setItem("larn-theme", theme);
			changeSystem(true);
			render(
				<ThemeProvider>
					<Harness />
				</ThemeProvider>,
			);
			expect(screen.getByLabelText("Appearance")).toHaveTextContent(theme);
			expect(document.documentElement.classList.contains("dark")).toBe(
				theme !== "light",
			);
		},
	);
	it("falls back to dark for an unrecognized saved value", () => {
		localStorage.setItem("larn-theme", "invalid");
		render(
			<ThemeProvider>
				<Harness />
			</ThemeProvider>,
		);
		expect(screen.getByLabelText("Appearance")).toHaveTextContent("dark");
		expect(document.documentElement).toHaveClass("dark");
	});
	it("follows system changes only in System mode and removes its listener", async () => {
		const user = userEvent.setup();
		const view = render(
			<ThemeProvider>
				<Harness />
			</ThemeProvider>,
		);
		await user.click(screen.getByRole("button", { name: "system" }));
		expect(document.documentElement).not.toHaveClass("dark");
		changeSystem(true);
		expect(document.documentElement).toHaveClass("dark");
		changeSystem(false);
		expect(document.documentElement.style.colorScheme).toBe("light");
		await user.click(screen.getByRole("button", { name: "dark" }));
		expect(listeners.size).toBe(0);
		changeSystem(false);
		expect(document.documentElement).toHaveClass("dark");
		await user.click(screen.getByRole("button", { name: "light" }));
		changeSystem(true);
		expect(document.documentElement).not.toHaveClass("dark");
		await user.click(screen.getByRole("button", { name: "system" }));
		expect(document.documentElement).toHaveClass("dark");
		view.unmount();
		expect(listeners.size).toBe(0);
	});
	it("saves a selection and restores it on a fresh mount", async () => {
		const user = userEvent.setup();
		const view = render(
			<ThemeProvider>
				<Harness />
			</ThemeProvider>,
		);
		await user.click(screen.getByRole("button", { name: "light" }));
		expect(localStorage.getItem("larn-theme")).toBe("light");
		view.unmount();
		render(
			<ThemeProvider>
				<Harness />
			</ThemeProvider>,
		);
		expect(screen.getByLabelText("Appearance")).toHaveTextContent("light");
		expect(document.documentElement.style.colorScheme).toBe("light");
	});
});
