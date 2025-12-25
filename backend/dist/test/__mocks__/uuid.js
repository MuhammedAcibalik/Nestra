"use strict";
/**
 * UUID Mock for Jest
 * Workaround for uuid package ESM import issue in Jest
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.version = exports.validate = exports.v4 = void 0;
const v4 = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};
exports.v4 = v4;
const validate = (uuid) => {
    const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return regex.test(uuid);
};
exports.validate = validate;
const version = (uuid) => {
    if (!(0, exports.validate)(uuid))
        return null;
    return parseInt(uuid.charAt(14), 16);
};
exports.version = version;
exports.default = { v4: exports.v4, validate: exports.validate, version: exports.version };
//# sourceMappingURL=uuid.js.map