
import type * as IVM from "isolated-vm";

export interface JobState {
    fetchCount: number;
    fetchBytes: number;
    logBytes: number;
    logsTruncated: boolean;
    logs: string[];
    deadlineMs: number;
}

export interface RuntimeState {
    context: any; // ivm.Context
    jail: any;    // context.global reference
}

// Extension of the pool's wrapper (we will cast it in runtime or update pool definition)
// For now, let's define what we expect to tack onto it.
export interface ExtendedWrapper {
    isolate: IVM.Isolate;
    id: string;
    createdAt: number;
    runs: number;
    poisoned: boolean;

    // Runtime extensions
    runtime?: RuntimeState;
    job?: JobState;
}
