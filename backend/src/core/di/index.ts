/**
 * DI Module Barrel Export
 */

export { DIContainer, container, TOKENS, resolve, isRegistered } from './container';
export type { TokenKey } from './container';
export { initializeContainer, getServices } from './registration';
export type { IAppServices } from './registration';
