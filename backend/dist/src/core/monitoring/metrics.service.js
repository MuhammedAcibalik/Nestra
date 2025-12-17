"use strict";
/**
 * Metrics Service
 * Provides Prometheus-compatible metrics for monitoring
 * Following Microservice Pattern: Observability
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetricsService = void 0;
exports.getMetricsService = getMetricsService;
class MetricsService {
    metrics = new Map();
    defaultHistogramBuckets = [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5, 10];
    constructor() {
        this.initializeDefaultMetrics();
    }
    initializeDefaultMetrics() {
        // HTTP request counter
        this.metrics.set('http_requests_total', {
            type: 'counter',
            help: 'Total number of HTTP requests',
            values: new Map()
        });
        // HTTP request duration
        this.metrics.set('http_request_duration_seconds', {
            type: 'histogram',
            help: 'HTTP request duration in seconds',
            values: new Map(),
            histogramBuckets: this.defaultHistogramBuckets,
            histogramCounts: new Map()
        });
        // Active connections
        this.metrics.set('active_connections', {
            type: 'gauge',
            help: 'Number of active connections',
            values: new Map()
        });
        // Event bus events
        this.metrics.set('events_published_total', {
            type: 'counter',
            help: 'Total number of events published',
            values: new Map()
        });
        // Database queries
        this.metrics.set('db_queries_total', {
            type: 'counter',
            help: 'Total number of database queries',
            values: new Map()
        });
        // Memory usage
        this.metrics.set('process_heap_bytes', {
            type: 'gauge',
            help: 'Process heap memory in bytes',
            values: new Map()
        });
    }
    labelsToKey(labels) {
        if (!labels || Object.keys(labels).length === 0)
            return '';
        return Object.entries(labels)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([k, v]) => `${k}="${v}"`)
            .join(',');
    }
    incrementCounter(name, labels) {
        const metric = this.metrics.get(name);
        if (!metric || metric.type !== 'counter')
            return;
        const key = this.labelsToKey(labels);
        const current = metric.values.get(key) ?? 0;
        metric.values.set(key, current + 1);
    }
    setGauge(name, value, labels) {
        const metric = this.metrics.get(name);
        if (!metric || metric.type !== 'gauge')
            return;
        const key = this.labelsToKey(labels);
        metric.values.set(key, value);
    }
    recordHistogram(name, value, labels) {
        const metric = this.metrics.get(name);
        if (!metric || metric.type !== 'histogram')
            return;
        const key = this.labelsToKey(labels);
        // Update sum and count
        const currentSum = metric.values.get(`${key}_sum`) ?? 0;
        const currentCount = metric.values.get(`${key}_count`) ?? 0;
        metric.values.set(`${key}_sum`, currentSum + value);
        metric.values.set(`${key}_count`, currentCount + 1);
        // Update bucket counts
        if (metric.histogramBuckets && metric.histogramCounts) {
            let bucketCounts = metric.histogramCounts.get(key);
            if (!bucketCounts) {
                bucketCounts = new Array(metric.histogramBuckets.length).fill(0);
                metric.histogramCounts.set(key, bucketCounts);
            }
            for (let i = 0; i < metric.histogramBuckets.length; i++) {
                if (value <= metric.histogramBuckets[i]) {
                    bucketCounts[i]++;
                }
            }
        }
    }
    getMetrics() {
        const lines = [];
        for (const [name, metric] of this.metrics.entries()) {
            lines.push(`# HELP ${name} ${metric.help}`);
            lines.push(`# TYPE ${name} ${metric.type}`);
            if (metric.type === 'histogram') {
                // Output histogram format
                for (const [labelKey, value] of metric.values.entries()) {
                    const suffix = labelKey.includes('_sum') ? '' : (labelKey.includes('_count') ? '' : '');
                    const cleanKey = labelKey.replace('_sum', '').replace('_count', '');
                    const labelsPart = cleanKey ? `{${cleanKey}}` : '';
                    if (labelKey.includes('_sum')) {
                        lines.push(`${name}_sum${labelsPart} ${value}`);
                    }
                    else if (labelKey.includes('_count')) {
                        lines.push(`${name}_count${labelsPart} ${value}`);
                    }
                }
            }
            else {
                for (const [labelKey, value] of metric.values.entries()) {
                    const labelsPart = labelKey ? `{${labelKey}}` : '';
                    lines.push(`${name}${labelsPart} ${value}`);
                }
            }
            lines.push('');
        }
        return lines.join('\n');
    }
    getMetricsJson() {
        const result = [];
        for (const [name, metric] of this.metrics.entries()) {
            for (const [labelKey, value] of metric.values.entries()) {
                const labels = {};
                if (labelKey) {
                    const pairs = labelKey.split(',');
                    for (const pair of pairs) {
                        const [k, v] = pair.split('=');
                        if (k && v)
                            labels[k] = v.replace(/"/g, '');
                    }
                }
                result.push({
                    name,
                    type: metric.type,
                    help: metric.help,
                    value,
                    labels: Object.keys(labels).length > 0 ? labels : undefined
                });
            }
        }
        return result;
    }
    // Update system metrics
    updateSystemMetrics() {
        const memUsage = process.memoryUsage();
        this.setGauge('process_heap_bytes', memUsage.heapUsed);
    }
}
exports.MetricsService = MetricsService;
// ==================== SINGLETON INSTANCE ====================
let metricsInstance = null;
function getMetricsService() {
    metricsInstance ??= new MetricsService();
    return metricsInstance;
}
//# sourceMappingURL=metrics.service.js.map