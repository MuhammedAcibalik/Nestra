"use strict";
/**
 * Circuit Breaker Pattern
 * Fault tolerance wrapper using opossum
 * Following Microservice Pattern: Resilience, Fail-Fast
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CircuitBreakerManager = exports.defaultCircuitBreakerConfig = void 0;
exports.createCircuitBreaker = createCircuitBreaker;
exports.getCircuitBreakerStats = getCircuitBreakerStats;
const opossum_1 = __importDefault(require("opossum"));
const metrics_1 = require("../monitoring/metrics");
// ==================== DEFAULT CONFIG ====================
exports.defaultCircuitBreakerConfig = {
    timeout: 30000, // 30s timeout
    errorThresholdPercentage: 50, // Open after 50% failures
    resetTimeout: 10000, // 10s before half-open
    volumeThreshold: 5 // Min 5 requests before evaluation
};
// ==================== CIRCUIT BREAKER MANAGER ====================
class CircuitBreakerManager {
    static breakers = new Map();
    /**
     * Create a circuit breaker for an async function
     */
    static create(action, config, fallback) {
        const fullConfig = {
            ...exports.defaultCircuitBreakerConfig,
            ...config
        };
        const breaker = new opossum_1.default(action, {
            timeout: fullConfig.timeout,
            errorThresholdPercentage: fullConfig.errorThresholdPercentage,
            resetTimeout: fullConfig.resetTimeout,
            volumeThreshold: fullConfig.volumeThreshold
        });
        // Set fallback if provided
        if (fallback) {
            breaker.fallback(fallback);
        }
        // Setup event listeners for monitoring
        this.setupEventListeners(breaker, config.name);
        // Store for later access
        this.breakers.set(config.name, breaker);
        console.log(`[CIRCUIT BREAKER] Created: ${config.name}`);
        return breaker;
    }
    /**
     * Get existing breaker by name
     */
    static get(name) {
        return this.breakers.get(name);
    }
    /**
     * Get all breaker stats
     */
    static getAllStats() {
        return Array.from(this.breakers.entries()).map(([name, breaker]) => ({
            name,
            state: this.getState(breaker),
            successes: breaker.stats.successes,
            failures: breaker.stats.failures,
            fallbacks: breaker.stats.fallbacks,
            rejects: breaker.stats.rejects,
            timeouts: breaker.stats.timeouts
        }));
    }
    /**
     * Get state string
     */
    static getState(breaker) {
        if (breaker.opened)
            return 'OPEN';
        if (breaker.halfOpen)
            return 'HALF_OPEN';
        return 'CLOSED';
    }
    /**
     * Get state as number for Prometheus
     */
    static getStateNumber(breaker) {
        if (breaker.opened)
            return 1; // OPEN
        if (breaker.halfOpen)
            return 2; // HALF_OPEN
        return 0; // CLOSED
    }
    /**
     * Setup event listeners for logging and metrics
     */
    static setupEventListeners(breaker, name) {
        breaker.on('open', () => {
            console.warn(`[CIRCUIT BREAKER] ${name} OPENED`);
            metrics_1.circuitBreakerStateGauge.labels(name).set(1);
        });
        breaker.on('halfOpen', () => {
            console.log(`[CIRCUIT BREAKER] ${name} HALF-OPEN`);
            metrics_1.circuitBreakerStateGauge.labels(name).set(2);
        });
        breaker.on('close', () => {
            console.log(`[CIRCUIT BREAKER] ${name} CLOSED`);
            metrics_1.circuitBreakerStateGauge.labels(name).set(0);
        });
        breaker.on('fallback', () => {
            console.log(`[CIRCUIT BREAKER] ${name} fallback executed`);
        });
        breaker.on('timeout', () => {
            console.warn(`[CIRCUIT BREAKER] ${name} timeout`);
        });
        breaker.on('reject', () => {
            console.warn(`[CIRCUIT BREAKER] ${name} rejected (circuit open)`);
        });
    }
    /**
     * Shutdown all breakers
     */
    static async shutdownAll() {
        for (const [name, breaker] of this.breakers) {
            breaker.shutdown();
            console.log(`[CIRCUIT BREAKER] ${name} shutdown`);
        }
        this.breakers.clear();
    }
}
exports.CircuitBreakerManager = CircuitBreakerManager;
// ==================== HELPER FUNCTIONS ====================
function createCircuitBreaker(action, config, fallback) {
    return CircuitBreakerManager.create(action, config, fallback);
}
function getCircuitBreakerStats() {
    return CircuitBreakerManager.getAllStats();
}
//# sourceMappingURL=circuit-breaker.js.map