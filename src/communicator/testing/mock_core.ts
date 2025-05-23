import Message from "../../base/message";
import { CoreCommunicator } from "../core";
import uuidv4 from "../../utils/uuid";

export default class MockCoreCommunicator extends CoreCommunicator {
    constructor(public host_id: string = uuidv4()) {
        super(host_id);
    }

    send(msg: Message): void {
        const serialized = msg.serialize();
        const deserialized = Message.deserialize(serialized);
        super.send(deserialized);
    }

    receive(msg: Message): void {
        const serialized = msg.serialize();
        const deserialized = Message.deserialize(serialized);
        super.receive(deserialized);
    }
}
