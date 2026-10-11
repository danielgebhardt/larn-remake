// Weights are relative chances among an already eligible pool.
export const selectWeighted = <T>(
	entries: readonly { value: T; weight: number }[],
	random: () => number,
): T | undefined => {
	if (entries.length === 0) return undefined;
	const total = entries.reduce((sum, entry) => sum + entry.weight, 0);
	if (
		!Number.isFinite(total) ||
		entries.some((entry) => !Number.isFinite(entry.weight) || entry.weight <= 0)
	)
		throw new RangeError("Weights must be finite and positive.");
	const roll = random();
	if (!Number.isFinite(roll) || roll < 0 || roll >= 1)
		throw new RangeError("Random selection requires a value in [0, 1).");
	let remaining = roll * total;
	for (const entry of entries) {
		remaining -= entry.weight;
		if (remaining < 0) return entry.value;
	}
	return entries[entries.length - 1].value;
};
