import { navigationRun } from "../src/domain/objects/NavigationTerrain";
// The walker can bump-open ordinary doors. Optional gates remain closed until
// deliberately opened; they must not become an accidental route or objective.
export const reviewRoutingFloor = (state) =>
	navigationRun({
		run: state.run,
		objects: state.objects.map((object) =>
			object.kind === "door" && !object.activated
				? { ...object, activated: true }
				: object,
		),
	}).floors[state.run.activeFloor - 1];
