import { config } from "./config.js";
import { logger } from "./logger.js";
import { metrics } from "./metrics.js";
import { AppError, ErrorCodes } from "./errors.js";

import ivm from "./sandbox/ivm.js";

interface IsolateWrapper {
    isolate: ivm.Isolate;
    id: string;
    createdAt: number;
    runs: number;
    poisoned: boolean;
}

export class IsolatePool {
    private pool: IsolateWrapper[] = [];
    private currentActive: number = 0;
    private queue: { resolve: (iso: IsolateWrapper) => void; reject: (err: any) => void; timer: NodeJS.Timeout }[] = [];

    public ready: Promise<void>;
    private isReady: boolean = false;
    private disabled: boolean = false;

    constructor() {
        this.ready = this.init();
    }

    private async init() {
        try {
            // Pre-warm isolates
            const warmUpPromises = [];
            for (let i = 0; i < config.poolSize; i++) {
                warmUpPromises.push(this.createNewIsolate().then(iso => {
                    if (iso) this.pool.push(iso);
                }));
            }
            await Promise.all(warmUpPromises);

            this.isReady = true;
            metrics.poolSize.set(config.poolSize); // Total provisioned capacity
            this.updatePoolSizeMetric();
            logger.info({ size: this.pool.length }, "[IsolatePool] Initialized and warmed up.");
        } catch (e) {
            logger.error({ err: e }, "[IsolatePool] Critical: Failed to warm up isolates.");
            this.disabled = true;
            this.isReady = false;
        }
    }

    private async createNewIsolate(): Promise<IsolateWrapper | null> {
        try {
            const iso = new ivm.Isolate({ memoryLimit: config.isolateMemoryLimitMb });
            metrics.isolatesCreated.inc({ reason: 'new' });
            return {
                isolate: iso,
                id: Math.random().toString(36).substring(7),
                createdAt: Date.now(),
                runs: 0,
                poisoned: false
            };
        } catch (e) {
            logger.error({ err: e }, "[IsolatePool] Failed to create isolate");
            return null;
        }
    }

    async acquire(): Promise<IsolateWrapper> {
        const startTime = Date.now();

        if (this.disabled) {
            throw new AppError(ErrorCodes.ERR_IVM_UNAVAILABLE, "Secure execution runtime unavailable", 503);
        }

        if (!this.isReady) {
            // Wait for init to complete
            await this.ready;
            if (this.disabled) throw new AppError(ErrorCodes.ERR_IVM_UNAVAILABLE, "Secure execution runtime unavailable", 503);
        }

        // 1. Try to get idle isolate
        if (this.pool.length > 0) {
            const wrapper = this.pool.pop();
            if (wrapper && !wrapper.isolate.isDisposed) {
                this.currentActive++;
                metrics.activeIsolates.set(this.currentActive);
                this.updatePoolSizeMetric();
                metrics.poolAcquireDuration.observe((Date.now() - startTime) / 1000);
                return wrapper;
            } else if (wrapper) {
                metrics.isolatesDisposed.inc({ reason: 'found_dead' });
            }
        }

        // 2. Can we create a new one?
        // Check active limit
        if (this.currentActive < config.maxConcurrency) {
            const wrapper = await this.createNewIsolate();
            if (wrapper) {
                this.currentActive++;
                metrics.activeIsolates.set(this.currentActive);
                this.updatePoolSizeMetric();
                metrics.poolAcquireDuration.observe((Date.now() - startTime) / 1000);
                return wrapper;
            }
            throw new AppError(ErrorCodes.ERR_INTERNAL, "Failed to create isolate", 500);
        }

        // 3. Queue logic
        if (this.queue.length >= config.maxQueueSize) {
            metrics.poolQueueLength.set(this.queue.length);
            throw new AppError(ErrorCodes.ERR_QUEUE_FULL, "Server busy", 429);
        }

        return new Promise<IsolateWrapper>((resolve, reject) => {
            const timer = setTimeout(() => {
                // Remove from queue
                const idx = this.queue.findIndex(item => item.reject === reject);
                if (idx !== -1) {
                    this.queue.splice(idx, 1);
                    metrics.poolQueueLength.set(this.queue.length);
                }
                metrics.poolQueueWait.observe((Date.now() - startTime) / 1000);
                reject(new AppError(ErrorCodes.ERR_QUEUE_TIMEOUT, "Request timed out in queue", 503));
            }, config.maxQueueWaitMs);

            this.queue.push({ resolve, reject, timer });
            metrics.poolQueueLength.set(this.queue.length);
        });
    }

    private safeDispose(wrapper: IsolateWrapper, reason: string) {
        // Explicitly release runtime context if it exists (though runtime.ts usually handles it per-run)
        // This acts as a safety net for poisoned/timed-out wrappers that might have leftover state.
        if ((wrapper as any).runtime?.context) {
            try { (wrapper as any).runtime.context.release(); } catch (e) { /* ignore */ }
        }

        if (!wrapper.isolate.isDisposed) {
            wrapper.isolate.dispose();
            metrics.isolatesDisposed.inc({ reason });
        }
    }

    async release(wrapper: IsolateWrapper, poisonReason?: string) {
        this.currentActive--;
        metrics.activeIsolates.set(this.currentActive);
        this.updatePoolSizeMetric();

        wrapper.runs++;

        let shouldDispose = false;
        let disposeReason = "";

        if (poisonReason) {
            shouldDispose = true;
            metrics.isolatesPoisoned.inc({ reason: poisonReason });
            disposeReason = `poison:${poisonReason}`;
            wrapper.poisoned = true;
        } else if (wrapper.runs >= config.maxRunsPerIsolate) {
            shouldDispose = true;
            disposeReason = "max_runs";
        } else if (Date.now() - wrapper.createdAt > config.maxIsolateAgeMs) {
            shouldDispose = true;
            disposeReason = "max_age";
        }

        if (!shouldDispose && wrapper.isolate.isDisposed) {
            shouldDispose = true;
            disposeReason = "already_disposed";
        }

        if (this.queue.length > 0) {
            const next = this.queue.shift();
            if (next) {
                clearTimeout(next.timer);
                metrics.poolQueueLength.set(this.queue.length);
                this.currentActive++;
                metrics.activeIsolates.set(this.currentActive);

                if (shouldDispose) {
                    this.safeDispose(wrapper, disposeReason);

                    const newWrapper = await this.createNewIsolate();
                    if (newWrapper) {
                        next.resolve(newWrapper);
                    } else {
                        next.reject(new AppError(ErrorCodes.ERR_INTERNAL, "Failed to create replacement isolate", 500));
                    }
                } else {
                    next.resolve(wrapper);
                }
                return;
            }
        }

        if (shouldDispose) {
            this.safeDispose(wrapper, disposeReason);
        } else {
            if (this.pool.length < config.poolSize) {
                this.pool.push(wrapper);
                this.updatePoolSizeMetric();
            } else {
                this.safeDispose(wrapper, 'pool_full');
            }
        }
    }
    private updatePoolSizeMetric() {
        metrics.poolSize.set(this.pool.length + this.currentActive);
    }
}
