// Run with: pnpm --filter frontend exec node scripts/review-evasion.mjs
import { createServer } from "vite";

const server = await createServer({
	configFile: false,
	server: { middlewareMode: true, hmr: false, ws: false },
	optimizeDeps: { noDiscovery: true, entries: [] },
	appType: "custom",
});
try {
	const { runEvasionReview } = await server.ssrLoadModule(
		"/scripts/evasion-review.ts",
	);
	console.log(JSON.stringify(runEvasionReview(), null, 2));
} finally {
	await server.close();
}
