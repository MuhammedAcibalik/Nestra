/**
 * Manual mock for xlsx package
 * Jest automatically uses this when xlsx is imported in tests
 */

export const read = jest.fn();

export const utils = {
    sheet_to_json: jest.fn(() => [])
};

export default {
    read,
    utils
};
