import uuidv4, { UUID } from "../utils/uuid";
import Communicator from "../base/communicator";
import Address from "../base/address";
import Message, { IPreMessage } from '../base/message';
import { CommunicatorError } from '../base/communicator_error';

export class CoreCommunicator extends Communicator {
    private known_addresses: Address[] = [this.get_address()];
    constructor(public host_id: UUID = uuidv4()) {
        super(new Address(host_id, "core"), "core", "MSG_ALL");
    }

    send(msg: IPreMessage) {
        if (!(msg instanceof Message)) {
            msg = msg.set_target(this.get_address());
        }

        const msgm = msg as Message;
        if (msgm.target.host_id == this.host_id) {
            this.incomming_message(msgm);
        } else {
            this.outgoing_message(msgm);
        }
    }

    incomming_message(msg: Message): void {
        msg.set_communicator_environment(this, "incomming");

        let idx = 0;
        const runNext = () => {
            const mw = this.middleware[idx++];
            if (mw) {
                mw(msg, runNext);
            } else {
                Core().transmit_message(msg);
            }
        };
        runNext();
    }

    outgoing_message(msg: Message): void {
        msg.set_communicator_environment(this, "outgoing");

        let idx = 0;
        const runNext = () => {
            const mw = this.middleware[idx++];
            if (mw) {
                mw(msg, runNext);
            } else {
                Core().transmit_message(msg);
            }
        };
        runNext();
    }

    transmit_message(msg: Message) {
        if (msg.target.agrees_with(this.get_address())) {
            return this.receive(msg);
        }

        if (msg.target.get_communicator()) {
            return msg.target.get_communicator()?.outgoing_message(msg);
        }

        for (let adrr of this.known_addresses) {
            if (
                adrr.agrees_with(msg.target)
                && !(adrr.get_communicator()?.modality == "MSG_SOURCE")
            ) {
                return adrr.get_communicator()?.outgoing_message(msg);
            }
        }

        if (msg.target.host_id == this.host_id) {
            return this.internal_event("ERROR", {
                error: new CommunicatorError("UNKNOWN_TARGET", `No communicator found for target ${msg.target.plugin_id} on this host`),
                message: msg
            });
        }

        for (let adrr of this.known_addresses) {
            if (
                msg.target.host_id == adrr.host_id && adrr.plugin_id == "core"
                && !(adrr.get_communicator()?.modality == "MSG_SOURCE")
            ) {
                return adrr.get_communicator()?.outgoing_message(msg);
            }
        }

        return this.internal_event("ERROR", {
            error: new CommunicatorError("UNKNOWN_TARGET", `No route found to host ${msg.target.host_id}`),
            message: msg
        });
    }

    add_known_address(address: Address) {
        if (!address.get_communicator()) {
            throw new CommunicatorError("INTERNAL_ERROR", "Address doesn't have associated communicator");
        }

        for (let i = 0; i < this.known_addresses.length; i++) {
            if (address.agrees_with(this.known_addresses[i])) {
                this.known_addresses[i] = address;
            }
        }

        this.known_addresses.push(address);
    }

    remove_known_address(address: Address) {
        this.known_addresses = this.known_addresses.filter(
            a => !a.agrees_with(address)
        );
    }
}

let coreInstance: CoreCommunicator | null = null;

export function initCore(host?: string | CoreCommunicator, overwrite: Boolean = false): CoreCommunicator {
    if (coreInstance && !overwrite) {
        throw new CommunicatorError("INTERNAL_ERROR", "Core already initialized");
    }
    if (host instanceof CoreCommunicator) {
        coreInstance = host;
        return coreInstance;
    }
    coreInstance = new CoreCommunicator(host ? host : uuidv4());
    return coreInstance;
}

export function CoreIsInitialized(): boolean {
    return !!coreInstance;
}

export default function Core(): CoreCommunicator {
    if (!coreInstance) initCore(uuidv4());
    return coreInstance!;
}
