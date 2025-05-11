import { CoreCommunicator, CoreIsInitialized } from "../communicator/core";
import Core from "../communicator/core";
import { IProxyCommunicator, ProxyCommunicator } from "../communicator/proxy";
import Address from "./address";
import { communicator_event, CommunicatorEventType } from "./event_pool";
import Message from "./message";
import { Middleware, MessageListener } from "./middleware";

type CommunicatorType = string;
type CommunicatorModality = "MSG_SINK" | "MSG_SOURCE" | "MSG_ALL" | "INITIALIZING" | "INACTIVE";
export type InternalEvent = CommunicatorEventType;

export interface ICommunicator {
    type: CommunicatorType;
    modality: CommunicatorModality;
    send(msg: Message): void;
    transmit_message(msg: Message): void;
    receive(msg: Message): void;
    get_address(): Address;

    use(m: Middleware): void;
    listen(m: MessageListener): void;
    proxify(): IProxyCommunicator;

    // Sugar;
    message(content: string): void;
}

export default class Communicator implements ICommunicator {
    private middleware: Middleware[] = [];
    private msg_listeners: MessageListener[] = [];

    constructor(
        private address: Address,
        public type: CommunicatorType,
        public modality: CommunicatorModality
    ) {
        address.set_communicator(this);
        if (!(this instanceof CoreCommunicator) || CoreIsInitialized()) {
            Core().add_known_address(address);
        }
    }

    send(msg: Message) {
        msg.computed_data = {
            message: msg,
            local_address: this.get_address(),
            communicator: this,
            incomming: this.get_address().agrees_with(msg.target)
        };

        let idx = 0;
        const runNext = () => {
            const mw = this.middleware[idx++];
            if (mw) {
                mw(msg, runNext);
            } else {
                this.transmit_message(msg);
            }
        };
        runNext();
    }

    transmit_message(msg: Message) {
        if (msg.target.agrees_with(this.address)) {
            return this.receive(msg);
        } else {
            return Core().send(msg);
        }
    }

    receive(msg: Message) {
        for (const ml of this.msg_listeners) {
            ml(msg);
        }

        this.internal_event("RECIEVE_MSG", msg);
    }

    agrees_with(target: Address | ICommunicator): boolean {
        return this.get_address().agrees_with(target);
    }

    get_address() {
        return this.address;
    }

    internal_event(event: InternalEvent, data: any = null) {
        communicator_event(event, data, this);
    }

    use(m: Middleware) {
        this.middleware.push(m);
    }

    listen(m: MessageListener): void {
        this.msg_listeners.push(m);
    }

    proxify(): IProxyCommunicator {
        return ProxyCommunicator(this);
    }

    // Sugar
    message(content: string) {
        this.send(new Message(this.address, content));
    }
}