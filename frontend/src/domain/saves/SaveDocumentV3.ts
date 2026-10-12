import type { SaveDocumentV2 } from "./SaveDocumentV2";

// V3 marks the extended progression rules. V1/V2 retain the old level-five cap.
export type SaveDocumentV3 = Omit<SaveDocumentV2, "version"> & { version: 3 };
