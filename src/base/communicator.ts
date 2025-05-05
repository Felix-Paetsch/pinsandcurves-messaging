import { CoreCommunicator } from "../communicator/core";
import Core from "../communicator/core";
import Address from "./address";
import Message from "./message";

type CommunicatorType = string;
type CommunicatorModality = "MSG_SINK" | "MSG_SOURCE" | "MSG_ALL" | "INITIALIZING";
type InternalEvent = string;

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
        if (!(this instanceof CoreCommunicator)) {
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
        if (event == "MSG_ERROR") {
            console.log(data.message);
            throw new Error(`The above message encountered the following error: "${data.err}"`);
        }
    }
}