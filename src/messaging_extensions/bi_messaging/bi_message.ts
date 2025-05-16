import Address from "../../base/address";
import Message, { IPreMessage, MessageMetaData } from "../../base/message";
import { Middleware } from "../../base/middleware";
import { v4 as uuidv4 } from 'uuid';
import Core from "../../communicator/core";
import { CommunicatorError } from "../../base/communicator_error";

const biMessages: Array<BidirectionalMessage> = [];

// Only moddles outgoing bidirectional
export default class BidirectionalMessage extends Message {
    private prom: Promise<Message>;
    private res: ((msg: Message) => void) | null = null;
    private rej: ((reason: any) => void) | null = null;
    private res_rej_value: Message | any | null = null;

    public state: "pending" | "fullfilled" | "rejected" = "pending";

    constructor(
        public target: Address,
        public content: string = "",
        public meta_data: MessageMetaData = {}
    ) {
        super(target, content, meta_data);

        biMessages.push(this);
        this.meta_data.bidirectional_message_id = uuidv4();
        this.meta_data.bidirectional_message_type = "request";
        this.meta_data.bidirectional_message_source = Core().get_address().serialize();

        this.prom = new Promise<Message>((res, rej) => {
            this.res = res;
            this.rej = rej;
        });
    }

    send(): Promise<Message> {
        super.send();
        return this.prom;
    }

    promise(): Promise<Message> {
        return new Promise<Message>((res, rej) => {
            if (this.state == "fullfilled") {
                res(this.res_rej_value);
            } else if (this.state == "rejected") {
                rej(this.res_rej_value);
            } else {
                const [t_res, t_rej] = [this.res, this.rej];
                this.res = (m: Message) => {
                    t_res!(m);
                    res(m);
                }

                this.rej = (reason: any) => {
                    t_rej!(reason);
                    rej(reason);
                }
            }
        })
    }

    resolve(msg: Message) {
        if (!this.res) throw this.#no_promise_error();
        this.res_rej_value = msg;
        this.state = "fullfilled";
        this.res(msg);
        this.res = null;
        this.rej = null;
        return msg;
    }

    reject(reason: any) {
        if (!this.rej) throw this.#no_promise_error();
        this.res_rej_value = reason;
        this.state = "rejected";
        this.rej(reason);
        this.res = null;
        this.rej = null;
        return reason;
    }

    #no_promise_error() {
        return new CommunicatorError("INTERNAL_ERROR", "Promise has already been handled!");
    }
}

type IncommingMessageHandler = (m: Message, respond: (m: IPreMessage) => void, next: () => void) => void;
export function trivial_incomming_message_handler(_: Message, __: (msg: IPreMessage) => void, next: () => void) {
    next();
}

export const bi_middleware = (incomming_message_handler: IncommingMessageHandler = trivial_incomming_message_handler) => {
    const computed_middleware: Middleware = (msg, next) => {
        // Nothing bidirectional
        if (!msg.meta_data.bidirectional_message_id) {
            return next();
        }

        // A bidirectional message getting send (through)
        if (
            msg.computed_data?.message_state == "outgoing"
            || (
                msg.computed_data?.message_state == "incomming"
                && !msg.target.agrees_with(Core())
            )
        ) {
            return next();
        }

        // If it is a message that is comming back to here
        if (msg.meta_data.bidirectional_message_type == "response") {
            for (let i = 0; i < biMessages.length; i++) {
                if (
                    biMessages[i].meta_data.bidirectional_message_id ===
                    msg.meta_data.bidirectional_message_id
                ) {
                    const r = biMessages.splice(i, 1)[0];
                    return r.resolve(msg);
                }
            }

            return msg.computed_data?.communicator.internal_event(
                "ERROR",
                {
                    error: new CommunicatorError("INVALID_MESSAGE", "Bidirectional response without request"),
                    message: msg
                }
            );
        }

        // Message that reached the other side
        if (msg.target.agrees_with(msg.computed_data?.communicator!) && msg.computed_data?.message_state == "incomming") {
            return incomming_message_handler(msg, response_builder(msg), next);
        }

        throw new CommunicatorError("INTERNAL_ERROR", "Unreachable state");
    }

    return computed_middleware as Middleware;
}

function response_builder(msg: Message) {
    return (res_msg: IPreMessage) => {
        const res = res_msg.set_target(Address.deserialize(msg.meta_data.bidirectional_message_source));
        res.meta_data.bidirectional_message_id = msg.meta_data.bidirectional_message_id;
        res.meta_data.bidirectional_message_type = "response";
        res.send();
    }
}