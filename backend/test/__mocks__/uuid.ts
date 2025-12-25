/**
 * UUID Mock for Jest
 * Workaround for uuid package ESM import issue in Jest
 */

export const v4 = (): string => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

export const validate = (uuid: string): boolean => {
    const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return regex.test(uuid);
};

export const version = (uuid: string): number | null => {
    if (!validate(uuid)) return null;
    return parseInt(uuid.charAt(14), 16);
};

export default { v4, validate, version };
