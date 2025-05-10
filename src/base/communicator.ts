import { CoreCommunicator, CoreIsInitialized } from "../communicator/core";
import Core from "../communicator/core";
import { IProxyCommunicator, ProxyCommunicator } from "../communicator/proxy";
import Address from "./address";
import { communicator_event, CommunicatorEventType } from "./event_pool";
import Message from "./message";
import { Middleware } from "./middleware";

type CommunicatorType = string;
type CommunicatorModality = "MSG_SINK" | "MSG_SOURCE" | "MSG_ALL" | "INITIALIZING" | "INACTIVE";
export type InternalEvent = CommunicatorEventType;

export interface ICommunicator {
    type: CommunicatorType;
    modality: CommunicatorModality;
    send(msg: Message): void;
    receive(msg: Message): void;
    get_address(): Address;

    // use(m: Middleware): void;
    proxify(): IProxyCommunicator;

    // Sugar;
    message(content: string): void;
}

export default class Communicator implements ICommunicator {
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
        if (msg.target.agrees_with(this.address)) {
            return this.receive(msg);
        } else {
            return Core().send(msg);
        }
    }

    receive(msg: Message) {
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

    /*use(m: Middleware) { }
    use_in(m: Middleware) { }
    use_out(m: Middleware) { }*/

    proxify(): IProxyCommunicator {
        return ProxyCommunicator(this);
    }

    // Sugar
    message(content: string) {
        this.send(new Message(this.address, content));
    }
}