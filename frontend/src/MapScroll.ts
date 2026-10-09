type ScrollAxis = {
	offset: number;
	viewportSize: number;
	contentSize: number;
	tileStart: number;
	tileSize: number;
	margin: number;
};

export const getScrollOffset = ({
	offset,
	viewportSize,
	contentSize,
	tileStart,
	tileSize,
	margin,
}: ScrollAxis): number => {
	const availableMargin = Math.max(
		0,
		Math.min(margin, (viewportSize - tileSize) / 2),
	);
	let nextOffset = offset;
	if (tileStart < offset + availableMargin)
		nextOffset = tileStart - availableMargin;
	else if (tileStart + tileSize > offset + viewportSize - availableMargin)
		nextOffset = tileStart + tileSize + availableMargin - viewportSize;
	return Math.max(
		0,
		Math.min(nextOffset, Math.max(0, contentSize - viewportSize)),
	);
};
