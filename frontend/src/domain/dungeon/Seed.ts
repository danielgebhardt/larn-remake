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

export const hashStringToUint32 = (value: string): number => {
	let hash = 1779033703 ^ value.length;

	for (let i = 0; i < value.length; i++) {
		hash = Math.imul(hash ^ value.charCodeAt(i), 3432918353);
		hash = (hash << 13) | (hash >>> 19);
	}

	hash = Math.imul(hash ^ (hash >>> 16), 2246822507);
	hash = Math.imul(hash ^ (hash >>> 13), 3266489909);
	hash ^= hash >>> 16;

	return hash >>> 0;
};
