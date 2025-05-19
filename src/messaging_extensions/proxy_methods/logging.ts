import { ICommunicator } from "../../base/communicator";
import Message, { MessageTransmissionState } from "../../base/message";
import { MessageLogger, defaultLogger } from "../message_logger";
import { Middleware } from "../../base/middleware";
import Address from "../../base/address";

function verbose_middleware_method(
    msg: Message,
    middleware: Middleware[],
    logger: MessageLogger,
    messageState: MessageTransmissionState,
    finalAction: () => void
) {
    logger.log(msg, 1, {
        log_source: "logging_proxy_verbose",
        method: messageState,
        phase: "start"
    });

    let idx = 0;
    const runNext = () => {
        const mw = middleware[idx];
        if (mw) {
            logger.log(msg, 1, {
                log_source: "logging_proxy_verbose",
                phase: "before",
                before: mw.middleware_name || "[anonymous]"
            });

            mw(msg, () => {
                if (idx == middleware.length - 1) {
                    logger.log(msg, 1, {
                        log_source: "logging_proxy_verbose",
                        phase: "after",
                        after: mw.middleware_name || "[anonymous]"
                    });
                    finalAction();
                } else {
                    logger.log(msg, 1, {
                        log_source: "logging_proxy_verbose",
                        phase: "in_between",
                        before: middleware[idx - 1].middleware_name || "[anonymous]",
                        after: middleware[idx].middleware_name || "[anonymous]"
                    });
                }
                idx++;
                runNext();
            });
        } else {
            finalAction();
        }
    };
    runNext();
}

const messageStateMap: { [key: string]: MessageTransmissionState } = {
    "incomming_message": "incomming",
    "outgoing_message": "outgoing",
    "receive": "recieving",
    "transmit_message": "transmitting"
};

export function Logging(intensity: "normal" | "verbose" = "normal", logger: MessageLogger = defaultLogger): (target: ICommunicator) => ICommunicator {
    return (target) => {
        const proxy = new Proxy(target, {
            get(obj: ICommunicator, prop: string | symbol) {
                const original = Reflect.get(obj, prop);

                if (prop === "get_address") {
                    const addr = obj.get_address();
                    return () => new Address(addr.host_id, addr.plugin_id, proxy);
                }
                if (prop === "logger") {
                    return logger;
                }

                if (typeof original !== 'function') {
                    return original;
                }

                const propStr = prop.toString();
                if (["incomming_message", "outgoing_message", "receive", "transmit_message"].includes(propStr)) {
                    const messageState = messageStateMap[propStr];
                    if (intensity === "normal") {
                        return function (this: ICommunicator, msg: Message, ...args: any[]) {
                            msg.set_communicator_environment(this, messageState);
                            logger.log(msg, 1, {
                                log_source: "logging_proxy"
                            });
                            return original.apply(this, [msg, ...args]);
                        };
                    } else if (intensity === "verbose" && (propStr === "incomming_message" || propStr === "outgoing_message")) {
                        return function (this: ICommunicator, msg: Message) {
                            msg.set_communicator_environment(this, messageState);
                            const middleware = this.middleware;

                            const finalAction = () => {
                                if (propStr === "incomming_message") {
                                    obj.constructor.prototype.incomming_message.call(obj, msg);
                                } else {
                                    obj.constructor.prototype.outgoing_message.call(obj, msg);
                                }
                            };

                            verbose_middleware_method(msg, middleware, logger, messageState, finalAction);
                        };
                    }
                }

                return original.bind(obj);
            }
        });

        return proxy;
    }
}