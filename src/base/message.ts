import Address from "./address";
import { ICommunicator } from "./communicator";

type MessageMetaData = any;
export type ComputedMessageData = {
    message: Message;
    local_address: Address;
    communicator: ICommunicator;
    incomming: Boolean,
    [key: string]: any;
};

export default class Message {
    public computed_data: ComputedMessageData | null = null;

    constructor(
        public target: Address,
        public content: string = "",
        public meta_data: MessageMetaData = {}
    ) { }

    send() {
        this.target.send(this);
    }

    serialize(): string {
        return JSON.stringify({
            content: this.content,
            meta_data: this.meta_data,
            target: this.target.serialize()
        })
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
