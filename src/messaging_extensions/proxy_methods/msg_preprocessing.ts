import { ICommunicator } from "../../base/communicator";
import Message from "../../base/message";

export function MsgPreprocessor(
    fn: (msg: Message) => void
): (target: ICommunicator) => ICommunicator {
    return (target) =>
        new Proxy(target, {
            get(obj, prop, receiver) {
                if (prop === "send") {
                    return (msg: Message) => {
                        fn(msg);
                        obj.send(msg);
                    };
                }
                return Reflect.get(obj, prop, receiver);
            },
        });
}
