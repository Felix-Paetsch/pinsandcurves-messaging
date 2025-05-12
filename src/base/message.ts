import Core from "../communicator/core";
import Address from "./address";
import { ICommunicator } from "./communicator";

export type MessageMetaData = Record<string, any>;;
export type ComputedMessageData = {
    message: Message;
    local_address: Address;
    communicator: ICommunicator;
    message_state: "incomming" | "outgoing" | "recieving",
    [key: string]: any;
};

export interface IPreMessage {
    content: string;
    meta_data: MessageMetaData;
    computed_data: ComputedMessageData | null;
    set_target: (addr: Address) => Message;
};

export class PreMessage implements IPreMessage {
    public computed_data: ComputedMessageData | null = null;
    constructor(
        public content: string = "",
        public meta_data: MessageMetaData = {}
    ) { }

    set_target(target: Address) {
        const res = new Message(target, this.content, this.meta_data);
        res.computed_data = this.computed_data;
        return res;
    }
}

export default class Message implements IPreMessage {
    public computed_data: ComputedMessageData | null = null;

    constructor(
        public target: Address,
        public content: string = "",
        public meta_data: MessageMetaData = {}
    ) { }

    send() {
        Core().send(this);
    }

    serialize(): string {
        return JSON.stringify({
            content: this.content,
            meta_data: this.meta_data,
            target: this.target.serialize()
        })
    }

    set_target(addr: Address) {
        this.target = addr;
        return this;
    }

    static deserialize(str: string): Message {
        const res = JSON.parse(str);
        return new Message(
            Address.deserialize(res.target),
            res.content,
            res.meta_data
        );
    }
}