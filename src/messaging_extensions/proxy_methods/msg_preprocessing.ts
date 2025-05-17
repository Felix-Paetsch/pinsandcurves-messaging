import Address from "../../base/address";
import { ICommunicator } from "../../base/communicator";
import Message from "../../base/message";

export function MsgPreprocessor(
    fn: (msg: Message) => void
): (target: ICommunicator) => ICommunicator {
    return (target) => {
        const proxy = new Proxy(target, {
            get(obj, prop, receiver) {
                if (prop === "get_address") {
                    const addr = obj.get_address();
                    return () => new Address(addr.host_id, addr.plugin_id, proxy);
                }
                if (prop === "send") {
                    return (msg: Message) => {
                        fn(msg);
                        obj.send(msg);
                    };
                }
                return Reflect.get(obj, prop, receiver);
            },
        });

        return proxy;
    }
}
