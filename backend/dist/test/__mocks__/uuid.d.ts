/**
 * UUID Mock for Jest
 * Workaround for uuid package ESM import issue in Jest
 */
export declare const v4: () => string;
export declare const validate: (uuid: string) => boolean;
export declare const version: (uuid: string) => number | null;
declare const _default: {
    v4: () => string;
    validate: (uuid: string) => boolean;
    version: (uuid: string) => number | null;
};
export default _default;
//# sourceMappingURL=uuid.d.ts.map