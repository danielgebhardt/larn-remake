export const REVIEW_USAGE = `Usage: node scripts/review-adventure.mjs [seeds...] [options]
  --seed-start N --seed-count N  Consecutive seed batch (cannot mix with seeds)
  --rows N --cols N              Dungeon dimensions, 10–100
  --floors N                    Dungeon depth, 5–20 (character cap stays 5)
  --max-actions N               Action budget per seed (default 500)
  --summary-only                Print aggregate results only
  --help                        Show this usage
Defaults: seeds 0, 1, 123, 987; 15×15; 5 floors.
LARN_REVIEW_TRACE=1 adds actions to each per-seed result.`;

export function parseReviewOptions(args, defaults, limits, maxSeed) {
	const options = { ...defaults, maxActions: 500, summaryOnly: false };
	const seeds = [];
	let seedStart, seedCount;
	const integer = (input, min, max, name) => {
		if (!/^\d+$/.test(input ?? ""))
			throw new Error(`${name} needs an integer.`);
		const value = Number(input);
		if (!Number.isSafeInteger(value) || value < min || value > max)
			throw new Error(`${name} must be between ${min} and ${max}.`);
		return value;
	};
	for (let i = 0; i < args.length; i++) {
		const arg = args[i];
		if (arg === "--help") return { help: true };
		if (arg === "--summary-only") {
			options.summaryOnly = true;
			continue;
		}
		const fields = {
			"--rows": "rows",
			"--cols": "cols",
			"--floors": "floorCount",
		};
		if (fields[arg]) {
			const field = fields[arg];
			options[field] = integer(
				args[++i],
				limits[field].min,
				limits[field].max,
				arg,
			);
		} else if (arg === "--max-actions")
			options.maxActions = integer(args[++i], 1, Number.MAX_SAFE_INTEGER, arg);
		else if (arg === "--seed-start")
			seedStart = integer(args[++i], 0, maxSeed, arg);
		else if (arg === "--seed-count")
			seedCount = integer(args[++i], 1, 10000, arg);
		else if (arg.startsWith("--")) throw new Error(`Unknown option: ${arg}`);
		else seeds.push(integer(arg, 0, maxSeed, "Seed"));
	}
	if (seedStart !== undefined || seedCount !== undefined) {
		if (seeds.length)
			throw new Error("Choose positional seeds or a seed batch, not both.");
		if (seedStart === undefined || seedCount === undefined)
			throw new Error(
				"A seed batch requires both --seed-start and --seed-count.",
			);
		if (seedStart + seedCount - 1 > maxSeed)
			throw new Error("Seed batch exceeds the seed range.");
		for (let i = 0; i < seedCount; i++) seeds.push(seedStart + i);
	}
	return { ...options, seeds: seeds.length ? seeds : [0, 1, 123, 987] };
}

export function summarizeReviews(results, configuration, maxActions) {
	const outcomes = { won: 0, died: 0, "action limit": 0, "no route": 0 };
	const levels = {};
	for (const result of results) {
		outcomes[result.reason]++;
		levels[result.level] = (levels[result.level] ?? 0) + 1;
	}
	return {
		type: "summary",
		configuration,
		maxActions,
		seeds: results.length,
		outcomes,
		levels,
		experience: {
			min: Math.min(...results.map((r) => r.experience)),
			max: Math.max(...results.map((r) => r.experience)),
		},
	};
}
