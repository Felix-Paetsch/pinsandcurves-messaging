import { ICommunicator } from "../../base/communicator";
import Message from "../../base/message";

export function Lossy(p: number = 0.9): (target: ICommunicator) => ICommunicator {
    return (target) => new Proxy(target, {
        get(obj, prop) {
            if (prop === "transmit_message") {
                return (msg: Message) => {
                    if (Math.random() > p) return;
                    obj.transmit_message(msg);
                };
            }
            return Reflect.get(obj, prop);
        },
    });
}