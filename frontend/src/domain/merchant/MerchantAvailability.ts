import { APP_FEATURES } from "../../settings/FeatureFlags";
import type { DungeonObject } from "../objects/DungeonObject";
export const merchantsEnabled = (): boolean =>
	APP_FEATURES.wanderingMerchant !== false;
export const objectAvailable = (object: Pick<DungeonObject, "kind">): boolean =>
	object.kind !== "merchant" || merchantsEnabled();
