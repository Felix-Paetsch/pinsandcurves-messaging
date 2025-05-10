import { ICommunicator } from "../base/communicator";

export interface IProxyCommunicator extends ICommunicator {
    apply_proxy(fn: (target: ICommunicator) => ICommunicator): IProxyCommunicator;
}

export function ProxyCommunicator(
    target: ICommunicator
): IProxyCommunicator {
    const handler: ProxyHandler<any> = {
        get(_, prop, receiver) {
            if (prop === "apply_proxy") {
                return (apply_proxy: (t: ICommunicator) => ICommunicator) => {
                    target = apply_proxy(target);
                    return p
                };
            }
            const value = Reflect.get(target, prop, receiver);
            return typeof value === "function"
                ? (...args: any[]) => (value as Function).apply(target, args)
                : value;
        },
        set(_, prop, value, receiver) {
            return Reflect.set(target, prop, value, receiver);
        },
    };

    const p = new Proxy({}, handler) as IProxyCommunicator;
    return p;
}