import Core from "../communicator/core";
import Address from "./address";
import { ICommunicator } from "./communicator";
import { serializeWithDepth } from "../utils/serialization";

export type MessageMetaData = Record<string, any>;
export type MessageTransmissionState = "incomming" | "outgoing" | "recieving" | "transmitting";
export type ComputedMessageData = {
    communicator: ICommunicator | null;
    message_state: MessageTransmissionState | null,
    [key: string]: any;
};

export interface IPreMessage {
    content: string;
    meta_data: MessageMetaData;
    computed_data: ComputedMessageData;

    set_target: (addr: Address) => Message;
    set_communicator_environment: (communicator: ICommunicator | null, message_state: MessageTransmissionState | null) => void;
};

export class PreMessage implements IPreMessage {
    public computed_data: ComputedMessageData;
    constructor(
        public content: string = "",
        public meta_data: MessageMetaData = {}
    ) {
        this.computed_data = {
            communicator: null,
            message_state: null
        };
    }

    set_target(target: Address) {
        const res = new Message(target, this.content, this.meta_data);
        res.computed_data = this.computed_data;
        return res;
    }

    set_communicator_environment(communicator: ICommunicator | null, message_state: MessageTransmissionState | null) {
        this.computed_data.communicator = communicator;
        this.computed_data.message_state = message_state;
    }

    serialize_log(max_depth: number = 20): Record<string, any> {
        const baseObj: Record<string, any> = {
            content: this.content,
            meta_data: this.meta_data,
            computed_data: this.computed_data
        };

        return serializeWithDepth(baseObj, max_depth);
    }
}

export default class Message extends PreMessage {
    public computed_data: ComputedMessageData;

    constructor(
        public target: Address,
        public content: string = "",
        public meta_data: MessageMetaData = {}
    ) {
        super(content, meta_data);
        this.computed_data = {
            communicator: null,
            message_state: null
        };
    }

    send() {
        Core().send(this);
    }

    serialize(): string {
        return JSON.stringify(
            this.toJSON()
        )
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

    serialize_log(max_depth: number = 20): Record<string, any> {
        const res = super.serialize_log(max_depth);
        res.target = this.target.serialize();
        return res;
    }

    toJSON() {
        return {
            content: this.content,
            meta_data: this.meta_data,
            target: this.target.serialize()
        };
    }
}