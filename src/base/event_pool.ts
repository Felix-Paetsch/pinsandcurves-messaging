import { ICommunicator } from "./communicator";
import { v4 as uuidv4 } from "uuid";
import { CommunicatorError } from "./communicator_error";

export type CommunicatorEventType = "ERROR" | "INITIALIZED" | "RECEIVE_MSG" | "FREEFORM";
export type CommunicatorEvent = {
    type: CommunicatorEventType,
    data: any,
    trigger: ICommunicator
};

export type ErrorEvent = CommunicatorEvent & {
    type: "ERROR",
    data: {
        error: CommunicatorError,
        message?: any
    }
};

type MsgProcessFn = (e: CommunicatorEvent) => any;

// Outer map: event-name → (inner map)
const listenersByType = new Map<CommunicatorEventType | "ALL", Map<string, MsgProcessFn>>();

export function subscribe_to(
    type: CommunicatorEventType | "ALL",
    method: MsgProcessFn,
    signature: string = uuidv4()
): string {
    let bucket = listenersByType.get(type);
    if (!bucket) {
        bucket = new Map();
        listenersByType.set(type, bucket);
    }
    bucket.set(signature, method);
    return signature;
}

export function unsubscribe_from(idOrFn: string | MsgProcessFn): void {
    for (const bucket of listenersByType.values()) {
        if (typeof idOrFn === "string") {
            bucket.delete(idOrFn);
        } else {
            for (const [sig, fn] of bucket) {
                if (fn === idOrFn) bucket.delete(sig);
            }
        }
    }
}

export function communicator_event(
    type: CommunicatorEventType,
    data: any,
    trigger: ICommunicator
): void {
    const ev = { type, data, trigger } as CommunicatorEvent;
    listenersByType.get(type)?.forEach(fn => fn(ev));
    listenersByType.get("ALL")?.forEach(fn => fn(ev));
}
