"use strict";
/**
 * Module Installer Interface
 * Defines contract for modular dependency injection
 * Following Microservice Pattern: Composition Root Decomposition
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.InstallerRegistry = void 0;
// ==================== INSTALLER REGISTRY ====================
/**
 * Registry for collecting all module installers
 */
class InstallerRegistry {
    installers = [];
    register(installer) {
        this.installers.push(installer);
    }
    getAll() {
        return this.installers;
    }
    installAll(context) {
        return this.installers.map((installer) => {
            console.log(`[INSTALLER] Installing module: ${installer.name}`);
            return installer.install(context);
        });
    }
}
exports.InstallerRegistry = InstallerRegistry;
//# sourceMappingURL=installer.interface.js.map