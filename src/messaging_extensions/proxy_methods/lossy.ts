import Address from "../../base/address";
import { ICommunicator } from "../../base/communicator";
import Message from "../../base/message";

export function Lossy(p: number = 0.9): (target: ICommunicator) => ICommunicator {
    return (target) => {
        const proxy = new Proxy(target, {
            get(obj, prop) {
                if (prop === "get_address") {
                    const addr = obj.get_address();
                    return () => new Address(addr.host_id, addr.plugin_id, proxy);
                }

                if (prop === "transmit_message") {
                    return (msg: Message) => {
                        if (Math.random() > p) return;
                        obj.transmit_message(msg);
                    };
                }
                return Reflect.get(obj, prop);
            }
        });

        return proxy;
    }
}