import { v4 as uuidv4 } from 'uuid';
import Address from "../../base/address";
import Message from "../../base/message";
import Communicator from "../../base/communicator";
import Core from "../core";

export default class MockAgentCommunicator extends Communicator {
    constructor(
        public plugin_id: string = uuidv4()
    ) {
        const host_id = Core().host_id;
        super(new Address(host_id, plugin_id), "mock agent", "MSG_ALL");
    }

    send(msg: Message): void {
        const serialized = msg.serialize();
        const deserialized = Message.deserialize(serialized);
        super.send(deserialized);
    }

    receive(msg: Message): void {
        console.log(msg)
    }
}
