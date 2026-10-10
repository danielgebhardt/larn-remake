export const MAX_SEED = 0xffffffff;

export const parseSeedInput = (input: string): number | undefined => {
	const trimmed = input.trim();
	if (!/^\d+$/.test(trimmed)) {
		return undefined;
	}
	const seed = Number(trimmed);
	return Number.isInteger(seed) && seed <= MAX_SEED ? seed : undefined;
};

export const createSeededRandom = (seed: number): (() => number) => {
	let state = seed >>> 0;

	return () => {
		state = (state + 0x6d2b79f5) >>> 0;
		let t = state;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		t = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
		return t;
	};
};
