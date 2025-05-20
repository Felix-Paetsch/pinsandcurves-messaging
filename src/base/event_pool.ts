import { ICommunicator } from "./communicator";
import uuidv4, { UUID } from "../utils/uuid";
import { CommunicatorError } from "./communicator_error";
import { getConfig } from "../config";

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
    signature: UUID = uuidv4()
): UUID {
    let bucket = listenersByType.get(type);
    if (!bucket) {
        bucket = new Map();
        listenersByType.set(type, bucket);
    }
    bucket.set(signature, method);
    return signature;
}

export function unsubscribe_from(idOrFn: UUID | MsgProcessFn): void {
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

    // Get listeners for this specific event type and "ALL"
    const typeListeners = listenersByType.get(type);
    const allListeners = listenersByType.get("ALL");

    typeListeners?.forEach(fn => fn(ev));
    allListeners?.forEach(fn => fn(ev));

    if (type === "ERROR") {
        getConfig().hard_errors && data.error.throw_if_unhandled();
    }
}
