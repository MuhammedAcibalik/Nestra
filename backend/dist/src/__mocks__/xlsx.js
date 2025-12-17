"use strict";
/**
 * Manual mock for xlsx package
 * Jest automatically uses this when xlsx is imported in tests
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.utils = exports.read = void 0;
exports.read = jest.fn();
exports.utils = {
    sheet_to_json: jest.fn(() => [])
};
exports.default = {
    read: exports.read,
    utils: exports.utils
};
//# sourceMappingURL=xlsx.js.map