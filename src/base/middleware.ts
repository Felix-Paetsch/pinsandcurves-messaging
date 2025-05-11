import Message from "./message";

export type Middleware = (msg: Message, next: () => void) => void;
export type MessageListener = (msg: Message) => void;