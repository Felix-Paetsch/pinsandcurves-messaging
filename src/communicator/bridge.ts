import Address from "../base/address";
import Message from "../base/message";
import Communicator, { ICommunicator } from "../base/communicator";

export default class BridgeCommunicator extends Communicator {
    constructor(addr: Address, private bridge_point: ICommunicator) {
        super(addr, "bridge", bridge_point.modality);
    }

    send(msg: Message): void {
        this.bridge_point.send(msg);
    }

    receive(_msg: Message): void {
        throw new Error("BridgeCommunicator does not support receiving messages.");
    }
}
