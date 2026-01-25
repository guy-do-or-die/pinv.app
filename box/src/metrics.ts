import client from "prom-client";

// Metrics Registry
export const register = new client.Registry();

// Default Metrics
client.collectDefaultMetrics({ register, prefix: 'box_' });

// Custom Metrics
export const metrics = {
    executionsTotal: new client.Counter({
        name: 'box_executions_total',
        help: 'Total number of script executions',
        labelNames: ['status', 'code'],
        registers: [register]
    }),
    executionDuration: new client.Histogram({
        name: 'box_execution_duration_seconds',
        help: 'Duration of script execution in seconds',
        registers: [register],
        buckets: [0.1, 0.5, 1, 2, 5, 10]
    }),
    activeIsolates: new client.Gauge({
        name: 'box_active_isolates',
        help: 'Number of currently active/busy isolates',
        registers: [register]
    }),
    poolSize: new client.Gauge({
        name: 'box_pool_size',
        help: 'Current size of the isolate pool (idle + active)',
        registers: [register]
    }),
    poolQueueLength: new client.Gauge({
        name: 'box_pool_queue_length',
        help: 'Number of requests waiting in the queue',
        registers: [register]
    }),
    poolQueueWait: new client.Histogram({
        name: 'box_pool_queue_wait_seconds',
        help: 'Time spent waiting in the queue',
        registers: [register],
        buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5]
    }),
    poolAcquireDuration: new client.Histogram({
        name: 'box_pool_acquire_duration_seconds',
        help: 'Total time to acquire an isolate (wait + create)',
        registers: [register],
        buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5]
    }),
    isolatesPoisoned: new client.Counter({
        name: 'box_isolates_poisoned_total',
        help: 'Total number of isolates poisoned/discarded due to errors',
        labelNames: ['reason'],
        registers: [register]
    }),
    isolatesCreated: new client.Counter({
        name: 'box_isolates_created_total',
        help: 'Total number of new isolates created',
        labelNames: ['reason'],
        registers: [register]
    }),
    isolatesDisposed: new client.Counter({
        name: 'box_isolates_disposed_total',
        help: 'Total number of isolates disposed',
        labelNames: ['reason'],
        registers: [register]
    })
};
