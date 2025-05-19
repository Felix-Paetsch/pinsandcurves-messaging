import Core from "../communicator/core";
import { ICommunicator } from "./communicator";
import Message from "./message";
import uuidv4 from "../utils/uuid";

export default class Address {
    constructor(
        public readonly host_id: string,
        public readonly plugin_id: string = "core",
        private communicator: ICommunicator | null = null
    ) { }

    send(msg: Message) {
        if (this.communicator) return this.communicator.send(msg);
        return Core().send(msg);
    }

    agrees_with(target: Address | ICommunicator): boolean {
        if (target instanceof Address) {
            return this.host_id == target.host_id && this.plugin_id == target.plugin_id;
        }
        return this.agrees_with(target.get_address());
    }

    set_communicator(c: ICommunicator) {
        this.communicator = c;
    }

    get_communicator() {
        return this.communicator;
    }

    serialize() {
        return `HOST_ID: ${this.host_id}\nPLUGIN_ID: ${this.plugin_id}`
    }

    static deserialize(str: string) {
        const lines = str.split("\n");
        return new Address(
            lines[0].split(" ")[1],
            lines[1].split(" ")[1],
        )
    }
}

export function new_local_address() {
    return new Address(Core().host_id, uuidv4())
}