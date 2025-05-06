import { CoreCommunicator, CoreIsInitialized } from "../communicator/core";
import Core from "../communicator/core";
import Address from "./address";
import { communicator_event, CommunicatorEventType } from "./event_pool";
import Message from "./message";

type CommunicatorType = string;
type CommunicatorModality = "MSG_SINK" | "MSG_SOURCE" | "MSG_ALL" | "INITIALIZING" | "INACTIVE";
export type InternalEvent = CommunicatorEventType;

export interface ICommunicator {
    type: CommunicatorType;
    modality: CommunicatorModality;
    send(msg: Message): void;
    receive(msg: Message): void;
    get_address(): Address;
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

    receive(_msg: Message) { }

    agrees_with(target: Address | ICommunicator): boolean {
        return this.get_address().agrees_with(target);
    }

    get_address() {
        return this.address;
    }

    internal_event(event: InternalEvent, data: any = null) {
        communicator_event(event, data, this);
    }
}