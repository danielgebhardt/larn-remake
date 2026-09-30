import type { Dungeon } from "./LayoutTiles.ts";
import type { Room } from "./Room.ts";

export type Region = {
	startRow: number;
	startCol: number;
	endRow: number;
	endCol: number;
};

export type PartitionNode = {
	region: Region;
	children?: [PartitionNode, PartitionNode];
	room?: Room;
};

export type SplitDirection = "horizontal" | "vertical";

export const makeRegion = (dungeon: Dungeon | undefined): Region => {
	if (!dungeon) {
		throw new Error("Dungeon is undefined");
	}

	return {
		startRow: 0,
		endRow: dungeon.length - 1,
		startCol: 0,
		endCol: dungeon[0].length - 1,
	};
};

export const splitRegion = (
	region: Region,
	direction: SplitDirection,
	minChildSize: number,
	random?: () => number,
): [Region, Region] | undefined => {
	const regionWidth = region.endCol - region.startCol + 1;
	const regionHeight = region.endRow - region.startRow + 1;

	if (direction === "vertical") {
		if (regionWidth < minChildSize * 2 || regionHeight < minChildSize) {
			return undefined;
		}

		let firstChildWidth = Math.floor(regionWidth / 2);

		if (random) {
			const minFirstChildWidth = minChildSize;
			const maxFirstChildWidth = regionWidth - minChildSize;
			const widthChoiceCount = maxFirstChildWidth - minFirstChildWidth + 1;

			firstChildWidth = Math.floor(random() * widthChoiceCount) + minChildSize;
		}

		const firstChildEndCol = region.startCol + firstChildWidth - 1;

		const child1: Region = {
			startRow: region.startRow,
			endRow: region.endRow,
			startCol: region.startCol,
			endCol: region.startCol + firstChildWidth - 1,
		};
		const child2: Region = {
			startRow: region.startRow,
			endRow: region.endRow,
			startCol: firstChildEndCol + 1,
			endCol: region.endCol,
		};

		return [child1, child2];
	} else if (direction === "horizontal") {
		if (regionHeight < minChildSize * 2 || regionWidth < minChildSize) {
			return undefined;
		}

		let firstChildHeight = Math.floor(regionHeight / 2);

		if (random) {
			const minFirstChildHeight = minChildSize;
			const maxFirstChildHeight = regionHeight - minChildSize;
			const heightChoiceCount = maxFirstChildHeight - minFirstChildHeight + 1;

			firstChildHeight =
				Math.floor(random() * heightChoiceCount) + minChildSize;
		}

		const firstChildEndRow = region.startRow + firstChildHeight - 1;

		const child1: Region = {
			startRow: region.startRow,
			endRow: region.startRow + firstChildHeight - 1,
			startCol: region.startCol,
			endCol: region.endCol,
		};
		const child2: Region = {
			startRow: firstChildEndRow + 1,
			endRow: region.endRow,
			startCol: region.startCol,
			endCol: region.endCol,
		};

		return [child1, child2];
	}

	return undefined;
};

export const recursivePartition = (
	region: Region,
	minChildSize: number,
): PartitionNode => {
	const partitions: PartitionNode = {
		region: { ...region },
	};

	if (!Number.isInteger(minChildSize) || minChildSize < 1) {
		throw new RangeError("minChildSize must be a positive integer");
	}

	const regionWidth = region.endCol - region.startCol + 1;
	const regionHeight = region.endRow - region.startRow + 1;
	const direction = regionWidth - regionHeight >= 0 ? "vertical" : "horizontal";

	const childPartitions = splitRegion(
		partitions.region,
		direction,
		minChildSize,
	);

	if (childPartitions) {
		const partition1: PartitionNode = recursivePartition(
			childPartitions[0],
			minChildSize,
		);
		const partition2: PartitionNode = recursivePartition(
			childPartitions[1],
			minChildSize,
		);

		partitions.children = [partition1, partition2];
	}

	return partitions;
};
