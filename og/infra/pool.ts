import { EventEmitter } from 'events';

interface WorkerTask {
    id: number;
    data: any;
    resolve: (value: any) => void;
    reject: (reason: any) => void;
    timeout?: ReturnType<typeof setTimeout>;
}

export class BunWorkerPool extends EventEmitter {
    private workers: Worker[] = [];
    private freeWorkers: Worker[] = [];
    private taskQueue: WorkerTask[] = [];
    private workerTaskMap: Map<Worker, WorkerTask> = new Map();

    private maxWorkers: number;
    private workerScript: string;
    private executionTimeout: number; // ms
    private taskIdCounter = 0;

    constructor(workerScript: string, options: { maxWorkers?: number, executionTimeout?: number } = {}) {
        super();
        this.workerScript = workerScript;
        this.maxWorkers = options.maxWorkers || 2; // Conservative default for Fly.io
        this.executionTimeout = options.executionTimeout || 10000; // 10s hard timeout
    }

    public async execute(data: any): Promise<any> {
        return new Promise((resolve, reject) => {
            const task: WorkerTask = {
                id: ++this.taskIdCounter,
                data,
                resolve,
                reject
            };
            this.schedule(task);
        });
    }

    private schedule(task: WorkerTask) {
        if (this.freeWorkers.length > 0) {
            const worker = this.freeWorkers.pop()!;
            this.runTaskOnWorker(worker, task);
        } else if (this.workers.length < this.maxWorkers) {
            const worker = this.createWorker();
            this.runTaskOnWorker(worker, task);
        } else {
            this.taskQueue.push(task);
        }
    }

    private createWorker(): Worker {
        const worker = new Worker(this.workerScript);
        this.workers.push(worker);

        worker.onmessage = (event) => {
            const result = event.data;
            this.handleWorkerMessage(worker, result);
        };

        worker.onerror = (err) => {
            console.error(`[WorkerPool] Worker Error:`, err);
            this.handleWorkerError(worker, err);
        };

        // If worker exits unexpectedly (e.g. segfault or OOM kill)
        // Bun workers don't have standard 'exit' event like Node cluster, 
        // relying on onerror/termination logic.

        return worker;
    }

    private runTaskOnWorker(worker: Worker, task: WorkerTask) {
        this.workerTaskMap.set(worker, task);

        // Set Timeout Guard
        task.timeout = setTimeout(() => {
            this.terminateAndRestartWorker(worker, new Error(`Task ${task.id} timed out after ${this.executionTimeout}ms`));
        }, this.executionTimeout);

        // Send data
        worker.postMessage({ id: task.id, data: task.data });
    }

    private handleWorkerMessage(worker: Worker, msg: any) {
        const task = this.workerTaskMap.get(worker);
        if (!task) return; // Stale message?

        // Clear timeout
        if (task.timeout) clearTimeout(task.timeout);

        this.workerTaskMap.delete(worker);
        this.freeWorkers.push(worker);

        if (msg.error) {
            task.reject(new Error(msg.error));
        } else {
            // Re-hydrate Buffer (Bun postMessage transfers as Uint8Array)
            let result = msg.result;
            // Case 1: Result is direct Uint8Array (Legacy/Simple)
            if (result instanceof Uint8Array) {
                result = Buffer.from(result);
            }
            // Case 2: Result is Object with image: Uint8Array (Structured)
            else if (result && typeof result === 'object' && result.image instanceof Uint8Array) {
                result.image = Buffer.from(result.image);
            }

            task.resolve(result);
        }

        this.processNextTask();
    }

    private handleWorkerError(worker: Worker, error: Event | Error) {
        this.terminateAndRestartWorker(worker, error);
    }

    private terminateAndRestartWorker(worker: Worker, reason: any) {
        console.warn(`[WorkerPool] Terminating worker: ${reason.message || reason}`);

        // fail current task
        const task = this.workerTaskMap.get(worker);
        if (task) {
            if (task.timeout) clearTimeout(task.timeout);
            task.reject(reason);
            this.workerTaskMap.delete(worker);
        }

        // remove from lists
        worker.terminate();
        this.workers = this.workers.filter(w => w !== worker);
        this.freeWorkers = this.freeWorkers.filter(w => w !== worker);

        // Immediately try to process queue (will spawn new worker if needed)
        this.processNextTask();
    }

    private processNextTask() {
        if (this.taskQueue.length > 0) {
            const nextTask = this.taskQueue.shift()!;
            this.schedule(nextTask);
        }
    }
}
