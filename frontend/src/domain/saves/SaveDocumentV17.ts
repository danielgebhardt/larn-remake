import type { MerchantStock } from "../merchant/MerchantRules";
import type { SaveDocumentV16 } from "./SaveDocumentV16";
export type SaveDocumentV17 = Omit<SaveDocumentV16, "version" | "state"> & {
	version: 17;
	state: SaveDocumentV16["state"] & { merchantStock: MerchantStock };
};
