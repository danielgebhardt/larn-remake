# CI and browser smoke coverage — epic #277

Branch: `codex/ci-browser-smoke`, based on the reviewed difficulty epic. Stories #289 and #290 have separate commits; developer acceptance remains pending.

## Declared-toolchain checks — #289

`.nvmrc` selects Node 24.20.0, matching the tested local runtime. The root `package.json` declares pnpm 11.25.0. Java 21 comes from the backend's existing Gradle toolchain; its wrapper selects Gradle 9.7.1. Install workspace dependencies from the root with the authoritative root lockfile; the old frontend-only lockfile is not a CI input.

The workflow runs for main/codex branch pushes, PRs targeting main, and manual dispatch. Frontend and backend jobs are independent, with bounded workers and ten-minute job limits. A newer run cancels an obsolete run for the same ref. Frontend stages distinguish install, read-only Biome, complete Vitest, strict TypeScript and production build failures. Backend uses the wrapper and uploads test reports. Local auto-fix/staging/test/build hooks remain unchanged.

Official actions are pinned to release commit SHAs. PNPM store caching uses the root lockfile; Gradle uses the basic GitHub cache provider and its default read-only policy off the default branch. Jobs need only read access to repository contents. No deploy, secret, backend API integration or branch-protection change is introduced.

Repository Actions are enabled and permit these actions. Validate YAML with actionlint and run the commands locally before review. **Local checks do not prove GitHub jobs are operational:** successful remote jobs must be recorded after the branch is pushed. Do not mark this story Done based only on a syntactically valid workflow.

References: [Node setup](https://github.com/actions/setup-node), [pnpm setup](https://github.com/pnpm/action-setup), [Java setup](https://github.com/actions/setup-java), [Gradle setup](https://github.com/gradle/actions/tree/main/setup-gradle), [Playwright test server](https://playwright.dev/docs/test-webserver).

Local verification: actionlint 1.7.12 passes. A clean temporary workspace installs the root frozen lockfile with pnpm 11.25.0; this avoids replacing the developer’s dependency directory. Backend wrapper tests were rerun with two workers: both tests executed successfully. The story commit runs the complete frontend hook with `VITEST_MAX_WORKERS=2`; GitHub runner results remain pending branch publication. No test timeouts were raised.
