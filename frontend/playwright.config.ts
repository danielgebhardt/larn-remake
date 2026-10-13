import { defineConfig } from "@playwright/test";

export default defineConfig({
	testDir: "./e2e",
	globalSetup: "./e2e/prepare-fixtures.mjs",
	workers: 1,
	retries: 0,
	forbidOnly: Boolean(process.env.CI),
	reporter: [["list"], ["html", { open: "never" }]],
	use: {
		browserName: "chromium",
		baseURL: "http://127.0.0.1:4179",
		viewport: { width: 1280, height: 720 },
		trace: "retain-on-failure",
		screenshot: "only-on-failure",
	},
	webServer: {
		command: "pnpm preview --host 127.0.0.1 --port 4179 --strictPort",
		url: "http://127.0.0.1:4179",
		reuseExistingServer: false,
	},
});
